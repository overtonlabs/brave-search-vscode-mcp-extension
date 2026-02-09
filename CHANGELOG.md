# Changelog

All notable changes to the "Brave Search MCP for VS Code" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.1]: https://github.com/Steve0verton/brave-search-vscode-mcp-extension/releases/tag/v1.0.1
[1.0.0]: https://github.com/Steve0verton/brave-search-vscode-mcp-extension/releases/tag/v1.0.0
