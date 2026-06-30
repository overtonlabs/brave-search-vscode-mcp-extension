import * as vscode from "vscode";

const EXTENSION_CONFIGURATION_SECTION = "braveSearchMcp";
const MCP_PROVIDER_ID = "brave-search-mcp";
const MCP_SERVER_LABEL = "Brave Search";
const MCP_SERVER_VERSION = "1.2.0";
const BRAVE_SEARCH_SERVER_PACKAGE = "@brave/brave-search-mcp-server";
// Pinned upstream server version. Pinned to an exact version (not "latest") so a new
// upstream release reaches users only through a tested extension release. Upstream does
// not follow semver — breaking changes ship as 2.0.x patches — so a range (^/~) would
// not protect users; only an exact pin does. Choose a version that is already a few weeks
// old so it clears npm "cooldown"/minimum-release-age policies (npm 11+ blocks versions
// published in the last ~14 days) and has had time to surface regressions. Bump
// deliberately via the release-coordinator.
const BRAVE_SEARCH_SERVER_VERSION = "2.0.83";

// SecretStorage key under which the Brave Search API key is kept (backed by the OS keychain).
const API_KEY_SECRET = "braveSearchMcp.apiKey";
// Legacy plaintext setting that earlier versions wrote to user settings. Read once at
// activation for migration into SecretStorage, then cleared. See migrateLegacyApiKey().
const LEGACY_API_KEY_SETTING = "apiKey";

/**
 * Activates the Brave Search MCP extension.
 * Migrates any legacy plaintext API key into secure storage, then registers an MCP
 * server definition provider that launches the official Brave Search MCP server.
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log("Brave Search MCP extension is now active");

  // One-time migration of any plaintext key from settings into secure storage.
  await migrateLegacyApiKey(context);

  const provider = new BraveSearchMcpProvider(context.secrets);

  // Register the MCP server definition provider
  const providerRegistration = vscode.lm.registerMcpServerDefinitionProvider(
    MCP_PROVIDER_ID,
    provider,
  );

  context.subscriptions.push(providerRegistration);
  context.subscriptions.push(provider);

  // Command to set or replace the API key — stored in SecretStorage, never in settings
  const configureCommand = vscode.commands.registerCommand(
    "brave-search-mcp.configureApiKey",
    async () => {
      const alreadySet = Boolean(await context.secrets.get(API_KEY_SECRET));
      const apiKey = await promptForApiKey(alreadySet);

      if (apiKey) {
        await context.secrets.store(API_KEY_SECRET, apiKey.trim());
        vscode.window.showInformationMessage(
          alreadySet
            ? "Brave Search API key updated."
            : "Brave Search API key saved securely.",
        );
      }
    },
  );

  context.subscriptions.push(configureCommand);

  // Command to remove the stored API key from secure storage
  const clearCommand = vscode.commands.registerCommand(
    "brave-search-mcp.clearApiKey",
    async () => {
      const existing = await context.secrets.get(API_KEY_SECRET);

      if (!existing) {
        vscode.window.showInformationMessage(
          "No Brave Search API key is currently stored.",
        );
        return;
      }

      // Require explicit confirmation before deleting the credential
      const confirm = await vscode.window.showWarningMessage(
        "Remove the stored Brave Search API key? You'll be prompted for a new key the next time search is used.",
        { modal: true },
        "Clear Key",
      );

      if (confirm === "Clear Key") {
        await context.secrets.delete(API_KEY_SECRET);
        vscode.window.showInformationMessage("Brave Search API key cleared.");
      }
    },
  );

  context.subscriptions.push(clearCommand);

  // Re-publish the server definition when the stored key changes (set or cleared)
  context.subscriptions.push(
    context.secrets.onDidChange((event) => {
      if (event.key === API_KEY_SECRET) {
        provider.refresh();
      }
    }),
  );

  // Re-publish when configuration (e.g. the enabled toggle) changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(EXTENSION_CONFIGURATION_SECTION)) {
        provider.refresh();
      }
    }),
  );
}

/**
 * MCP Server Definition Provider for Brave Search
 */
class BraveSearchMcpProvider
  implements vscode.McpServerDefinitionProvider, vscode.Disposable
{
  private readonly changeEmitter = new vscode.EventEmitter<void>();

  readonly onDidChangeMcpServerDefinitions = this.changeEmitter.event;

  // The API key lives in SecretStorage (OS keychain); the provider reads it on resolve.
  constructor(private readonly secrets: vscode.SecretStorage) {}

  dispose() {
    this.changeEmitter.dispose();
  }

  refresh() {
    this.changeEmitter.fire();
  }

  provideMcpServerDefinitions(
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.McpServerDefinition[]> {
    const config = vscode.workspace.getConfiguration(
      EXTENSION_CONFIGURATION_SECTION,
    );
    const enabled = config.get<boolean>("enabled", true);

    // If disabled, return empty array
    if (!enabled) {
      console.log("Brave Search MCP is disabled");
      return [];
    }

    // Always publish the server definition when enabled.
    // Credential collection is deferred to resolveMcpServerDefinition,
    // which is the MCP lifecycle point that allows user interaction.
    return [
      new vscode.McpStdioServerDefinition(
        MCP_SERVER_LABEL,
        "npx",
        ["-y", `${BRAVE_SEARCH_SERVER_PACKAGE}@${BRAVE_SEARCH_SERVER_VERSION}`],
        {},
        MCP_SERVER_VERSION,
      ),
    ];
  }

  async resolveMcpServerDefinition(
    server: vscode.McpServerDefinition,
    token: vscode.CancellationToken,
  ): Promise<vscode.McpServerDefinition | undefined> {
    if (!(server instanceof vscode.McpStdioServerDefinition)) {
      return server;
    }

    if (token.isCancellationRequested) {
      return undefined;
    }

    let apiKey = (await this.secrets.get(API_KEY_SECRET))?.trim();

    // Discard a stored key that no longer passes validation, forcing a re-prompt
    if (apiKey && validateApiKey(apiKey) !== null) {
      apiKey = undefined;
    }

    if (!apiKey) {
      apiKey = (await promptForApiKey())?.trim();

      if (!apiKey) {
        return undefined;
      }

      await this.secrets.store(API_KEY_SECRET, apiKey);
    }

    server.env = {
      ...(server.env ?? {}),
      // Exact env var name required by the upstream server; not camelCase.
      // eslint-disable-next-line @typescript-eslint/naming-convention
      BRAVE_API_KEY: apiKey,
    };

    return server;
  }
}

/**
 * Prompts the user for their Brave Search API key with a masked input box.
 * Shared by the configure command and the MCP resolve flow.
 * @param alreadySet when true, the prompt makes clear a key already exists and will be replaced
 */
async function promptForApiKey(
  alreadySet = false,
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt: alreadySet
      ? "A Brave Search API key is already configured. Enter a new key to replace it."
      : "Enter your Brave Search API key",
    password: true,
    placeHolder: "BSA...",
    ignoreFocusOut: true,
    validateInput: validateApiKey,
  });
}

/**
 * One-time migration: moves a plaintext key from the legacy `braveSearchMcp.apiKey`
 * setting into secure SecretStorage, then clears the setting from every scope that
 * holds it — so no plaintext key remains on disk or is carried by Settings Sync.
 */
async function migrateLegacyApiKey(
  context: vscode.ExtensionContext,
): Promise<void> {
  const config = vscode.workspace.getConfiguration(
    EXTENSION_CONFIGURATION_SECTION,
  );
  const inspected = config.inspect<string>(LEGACY_API_KEY_SETTING);

  // Only migrate from the global (user) scope. Workspace and workspace-folder
  // scopes are intentionally excluded: braveSearchMcp.apiKey has no declared
  // scope so it defaults to "window", meaning a malicious repo's
  // .vscode/settings.json could plant a value here. Promoting a workspace-scoped
  // value into the OS keychain — and then using it as BRAVE_API_KEY for all
  // API calls — would be a credential-injection risk.
  const legacyKey = inspected?.globalValue?.trim();

  if (!legacyKey) {
    return;
  }

  // Don't clobber a key already stored securely (e.g. set on another synced machine)
  const existing = await context.secrets.get(API_KEY_SECRET);
  if (!existing) {
    await context.secrets.store(API_KEY_SECRET, legacyKey);
  }

  // Clear the plaintext value from the global scope only
  try {
    if (inspected?.globalValue !== undefined) {
      await config.update(
        LEGACY_API_KEY_SETTING,
        undefined,
        vscode.ConfigurationTarget.Global,
      );
    }
  } catch (err) {
    // Migration is best-effort; never block activation if the scope can't be written
    console.error(
      "Brave Search MCP: failed to clear legacy API key setting",
      err,
    );
  }
}

function validateApiKey(value: string): string | null {
  if (!value || value.trim().length === 0) {
    return "API key cannot be empty";
  }

  if (!value.trim().startsWith("BSA")) {
    return 'Brave Search API keys should start with "BSA"';
  }

  return null;
}

/**
 * Deactivates the extension
 */
export function deactivate() {
  console.log("Brave Search MCP extension is now deactivated");
}
