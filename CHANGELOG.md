# Changelog

All notable changes to the "Brave Search MCP for VS Code" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-06-23

### ✨ Added

#### **API key management commands**

- **Clear API Key**: New "Brave Search MCP: Clear API Key" command removes the stored key from secure storage (with a confirmation prompt) — restoring the ability to remove/reset a credential that the move off plaintext settings had taken away
- **Replace key**: The "Configure API Key" command now detects an existing key and prompts to replace it, making key rotation explicit

### 🔒 Security

#### **API key moved to secure OS keychain storage**

- **SecretStorage**: The Brave Search API key is now stored in VS Code's Secret Storage (backed by the operating system keychain) instead of plaintext in `settings.json`. The key is no longer readable on disk, no longer visible in the Settings UI, and is no longer carried to other machines by Settings Sync
- **Automatic migration**: Any existing key in the deprecated `braveSearchMcp.apiKey` user (global) setting is moved into secure storage on activation and then cleared — existing users keep working with no action required. Workspace-scoped values of that setting are intentionally not promoted, to prevent a malicious repo from injecting a credential into the OS keychain
- **Deprecated setting**: `braveSearchMcp.apiKey` is retained (marked deprecated) solely as a migration source; the key is now set via the "Brave Search MCP: Configure API Key" command

#### **Supply-chain hardening: pinned upstream server version**

- **Exact version pin**: The bundled launch of `@brave/brave-search-mcp-server` is now pinned to an exact version instead of resolving `latest` on every user's machine. A new upstream release — including a compromised or breaking one — can no longer reach users automatically; it reaches them only through a tested, deliberate extension release
- **Why an exact pin (not a range)**: upstream does not follow semver — breaking changes ship as `2.0.x` patch releases — so a `^`/`~` range would offer no real protection. Bumping the pin is now a reviewed release step
- **Seasoned, not bleeding-edge**: the pin targets a version that is already a few weeks old, so it clears npm "cooldown"/minimum-release-age policies (npm 11+ refuses versions published in the last ~14 days) and has had time to surface regressions — the extension works whether or not a user enforces a release-age delay

## [1.1.1] - 2026-04-06

### 🐛 Fixed

#### **Extension Not Visible as a Chat Agent Tool**

- **`activationEvents`**: Changed from an empty array `[]` to `["onStartupFinished"]` in `package.json` — the extension was never activating, so the MCP server was never registered and the search tools were invisible to the chat agent
- **MCP server always published**: Removed the guard in `provideMcpServerDefinitions()` that returned an empty array when no API key was configured; the server definition is now always returned when the extension is enabled, making the tools immediately visible to the agent
- **Credentials deferred to `resolveMcpServerDefinition()`**: API key collection moved out of `provideMcpServerDefinitions()` (where user interaction is not allowed) into `resolveMcpServerDefinition()`, which is the correct MCP lifecycle hook for credential injection and UI prompts
- **`McpServerDefinitionProvider` fully implemented**: Added `onDidChangeMcpServerDefinitions` event emitter and `dispose()` implementation required by the interface; added `refresh()` to notify VS Code when the server definition changes
- **Live config updates**: Configuration change listener and the `configureApiKey` command now call `provider.refresh()` so the MCP server is updated immediately when the API key is saved or settings change
- **API key validation hardened**: Extracted shared `validateApiKey()` function used by both the input box and `resolveMcpServerDefinition()`; added check that the key starts with `BSA` (format validation was missing from the command palette flow)

## [1.1.0] - 2026-04-06

### ✨ Added

- **Video and Local Search tools**: Documented `brave_video_search` and `brave_local_search` tools now available via `@brave/brave-search-mcp-server` v2.x
- **Example prompts**: Added Video Search and Local Search example prompt sections to README

### 🐛 Fixed

- **npm audit**: Updated devDependencies (ajv, brace-expansion, flatted, minimatch, picomatch, qs, underscore, undici) to resolve moderate and high severity vulnerabilities
- **README clone URL**: Corrected placeholder `yourusername` to `Steve0verton` in the Building from Source section
- **README API pricing**: Replaced stale Free AI / Base AI / Pro AI plan tiers with current Brave Search pricing
- **README troubleshooting**: Removed dead reference to deleted Future Enhancements section

### 📝 Documentation

- **README**: Removed Future Enhancements section — all feature requests now tracked as [GitHub Issues](https://github.com/overtonlabs/brave-search-vscode-mcp-extension/issues)
- **copilot-instructions.md**: Updated Core Features list to all 5 search tools; replaced Future Enhancements with GitHub Issues reference

### 🔧 Technical Details

#### **Developer Tooling**

- **launch.json**: Added VS Code launch configuration so pressing F5 opens a fresh VS Code Extension Development Host window with the extension loaded for live testing and debugging — without affecting your main VS Code environment
- **tasks.json**: Added default build task that automatically compiles TypeScript before each F5 launch, ensuring the running extension always reflects the latest source code changes

## [1.0.1] - 2026-02-09

### 🐛 Fixed

- **MCP Server Discovery**: Added `mcpServerDefinitionProviders` contribution point to package.json to improve discoverability and align with VS Code's MCP extension categorization

## [1.0.0] - 2026-02-04

### ✨ Added

#### **Initial Release**

- **MCP Server Integration**: Integrated official `@brave/brave-search-mcp-server` package with VS Code
  - Automatic server registration when AI assistants request MCP capabilities
  - Server launched via npx, no bundling required
  - Environment-based API key passing for security

#### **Search Tools**

- **Web Search**: `brave_web_search` tool for general web search
  - Returns up to 20 search results with titles, descriptions, and URLs
  - Supports various search queries for research and planning
- **News Search**: `brave_news_search` tool for recent news articles
  - Filters for current events and news content
  - Provides timely information for AI responses
- **Image Search**: `brave_image_search` tool for image discovery
  - Searches across the web for relevant images
  - Returns image URLs and metadata

#### **Configuration & Setup**

- **API Key Management**: Secure API key storage in VS Code settings
  - Password-masked input for key entry
  - Validation to ensure non-empty API keys
  - Global configuration persistence
- **Interactive Configuration**: Command Palette command "Brave Search MCP: Configure API Key"
  - User-friendly input prompts with validation
  - One-click access from warning notifications
  - Direct link to Brave API dashboard for key creation
- **Enable/Disable Toggle**: `braveSearchMcp.enabled` setting to control server activation
  - Defaults to enabled for immediate use after API key setup
  - Dynamic server registration based on setting state

#### **User Experience**

- **Activation Prompts**: Helpful notifications when API key is missing
  - "Configure Now" button for immediate setup
  - "Get API Key" button linking to Brave API signup
  - Non-intrusive warnings that don't block workflow
- **Automatic Availability**: Search tools automatically available in Copilot agent mode
  - No manual tool selection required
  - AI determines when to use search based on query intent
  - Seamless integration with existing Copilot workflows

#### **Developer Experience**

- **TypeScript Implementation**: Full TypeScript support with proper typing
  - VS Code API types for extension development
  - Type-safe configuration and command handling
- **Build Scripts**: Comprehensive npm scripts for development and packaging
  - `npm run compile` for TypeScript compilation
  - `npm run watch` for development with auto-recompile
  - `npm run package` for VSIX creation
- **Documentation**: Detailed README, QUICKSTART guide, and inline code comments
  - Installation instructions for both development and end users
  - API key acquisition guide with tier comparisons
  - Troubleshooting section for common issues
  - Architecture overview in Copilot instructions

### 🔧 Technical Details

- **VS Code Engine**: Requires VS Code ^1.95.0 for MCP support
- **Node.js Requirement**: Uses npx to launch MCP server (Node.js must be installed)
- **Extension Categories**: AI, Other
- **License**: BSD-3-Clause

[1.2.0]: https://github.com/overtonlabs/brave-search-vscode-mcp-extension/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/overtonlabs/brave-search-vscode-mcp-extension/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/overtonlabs/brave-search-vscode-mcp-extension/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/overtonlabs/brave-search-vscode-mcp-extension/releases/tag/v1.0.1
[1.0.0]: https://github.com/overtonlabs/brave-search-vscode-mcp-extension/releases/tag/v1.0.0
