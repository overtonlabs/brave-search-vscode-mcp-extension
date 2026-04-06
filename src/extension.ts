import * as vscode from "vscode";

const EXTENSION_CONFIGURATION_SECTION = "braveSearchMcp";
const MCP_PROVIDER_ID = "brave-search-mcp";
const MCP_SERVER_LABEL = "Brave Search";
const MCP_SERVER_VERSION = "1.1.1";
const BRAVE_SEARCH_SERVER_PACKAGE = "@brave/brave-search-mcp-server";

/**
 * Activates the Brave Search MCP extension
 * Registers an MCP server definition provider that launches the official Brave Search MCP server
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Brave Search MCP extension is now active");

  const provider = new BraveSearchMcpProvider();

  // Register the MCP server definition provider
  const providerRegistration = vscode.lm.registerMcpServerDefinitionProvider(
    MCP_PROVIDER_ID,
    provider,
  );

  context.subscriptions.push(providerRegistration);
  context.subscriptions.push(provider);

  // Add command to configure API key
  const configureCommand = vscode.commands.registerCommand(
    "brave-search-mcp.configureApiKey",
    async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Brave Search API key",
        password: true,
        placeHolder: "BSA...",
        ignoreFocusOut: true,
        validateInput: validateApiKey,
      });

      if (apiKey) {
        const config = vscode.workspace.getConfiguration(
          EXTENSION_CONFIGURATION_SECTION,
        );
        await config.update(
          "apiKey",
          apiKey,
          vscode.ConfigurationTarget.Global,
        );
        provider.refresh();
        vscode.window.showInformationMessage(
          "Brave Search API key saved successfully!",
        );
      }
    },
  );

  context.subscriptions.push(configureCommand);

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
        ["-y", BRAVE_SEARCH_SERVER_PACKAGE],
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

    const config = vscode.workspace.getConfiguration(
      EXTENSION_CONFIGURATION_SECTION,
    );

    let apiKey = config.get<string>("apiKey")?.trim();

    if (apiKey && validateApiKey(apiKey) !== null) {
      apiKey = undefined;
    }

    if (!apiKey) {
      apiKey = await vscode.window.showInputBox({
        prompt: "Enter your Brave Search API key",
        password: true,
        placeHolder: "BSA...",
        ignoreFocusOut: true,
        validateInput: validateApiKey,
      });

      if (!apiKey) {
        return undefined;
      }

      apiKey = apiKey.trim();

      await config.update("apiKey", apiKey, vscode.ConfigurationTarget.Global);

      this.refresh();
    }

    server.env = {
      ...(server.env ?? {}),
      BRAVE_API_KEY: apiKey,
    };

    return server;
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
