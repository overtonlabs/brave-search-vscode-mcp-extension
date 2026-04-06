# Copilot Instructions

You are a full-stack developer working on a VS Code extension that integrates Brave Search with AI assistants using MCP.

## What we're building

### Project Overview

**Brave Search MCP for VS Code** is an extension that connects AI assistants (like GitHub Copilot) to the [Brave Search API](https://brave.com/search/api/) via the Model Context Protocol (MCP). This enables AI to perform real-time internet searches during agent mode conversations.

### Architecture

- **Extension Type**: VS Code Extension (TypeScript)
- **Primary File**: `src/extension.ts` - Handles activation, configuration, and MCP server registration
- **MCP Server**: Uses official `@brave/brave-search-mcp-server` npm package (not bundled)
- **Protocol**: Model Context Protocol (MCP) for AI-to-tool communication
- **API**: Brave Search API for independent web search

### Core Features

1. **Web Search** (`brave_web_search`): General web search returning up to 20 results
2. **News Search** (`brave_news_search`): Recent news articles and current events
3. **Image Search** (`brave_image_search`): Image search across the web
4. **Video Search** (`brave_video_search`): Video search with metadata and thumbnails
5. **Local Search** (`brave_local_search`): Local businesses and places with ratings and hours (full functionality requires Search plan)

These tools are automatically available to AI assistants when:

- Extension is activated
- API key is configured
- AI is running in agent mode

### Key Components

#### Configuration

- **API Key Storage**: Secure storage in VS Code settings (`braveSearchMcp.apiKey`)
- **Enable/Disable**: Toggle via `braveSearchMcp.enabled` setting
- **Command**: `brave-search-mcp.configureApiKey` for interactive setup

#### MCP Server Registration

- Server definition registered via `vscode.mcp.registerMcpServer`
- Server launched using `npx @brave/brave-search-mcp-server`
- API key passed via `BRAVE_API_KEY` environment variable
- Server runs when AI assistants request it

#### Extension Lifecycle

- Activates when MCP server is requested (via `activationEvents`)
- Checks for API key configuration on activation
- Prompts user if key is missing
- Re-registers server definition when configuration changes

### Technology Stack

- **Language**: TypeScript
- **Build**: VS Code Extension API
- **Runtime**: Node.js (for MCP server via npx)
- **Dependencies**:
  - `vscode` (VS Code Extension API)
  - `@brave/brave-search-mcp-server` (runtime, not bundled)

### Requirements

- VS Code version: `^1.95.0` (requires MCP support)
- Node.js: Required on user's system for npx
- API Key: Brave Search API key (free or paid tier)

### Development Guidelines

#### Code Style

- Follow TypeScript best practices
- Use VS Code API types properly
- Handle errors gracefully with user-friendly messages
- Validate configuration before server registration

#### Configuration Management

- Always validate API key format (starts with `BSA`)
- Provide clear error messages for missing/invalid keys
- Support both interactive (Command Palette) and settings-based configuration
- Watch for configuration changes and update server registration

#### Error Handling

- Check for Node.js/npx availability
- Handle API key validation failures
- Provide actionable error messages
- Log errors for troubleshooting

#### Testing Scenarios

- API key not configured
- API key configured correctly
- Extension enabled/disabled toggle
- Configuration changes while running
- Multiple workspaces

### Resources

- [Brave Search API Docs](https://brave.com/search/api/)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [VS Code MCP API](https://code.visualstudio.com/api/references/vscode-api#McpServerDefinition)
- [Official MCP Server](https://github.com/brave/brave-search-mcp-server)

## Changelog

### Format

- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Use [Semantic Versioning](https://semver.org/) for version numbers

### Structure

- **Version headers**: `## [X.Y.Z] - YYYY-MM-DD`
- **Category sections**: (e.g., `### ✨ Added`)
- **Change entries**: Use bold titles followed by descriptive bullets:

  ```markdown
  ### ✨ Added

  #### **Feature Name**

  - **Specific detail**: Explanation of what was added and why it matters
  - **Another detail**: Additional context with technical specifics
  ```

### When to update

- **With each feature PR**: Add entry under `[Unreleased]` section
- **Before release**: Move `[Unreleased]` entries to new version section with date
- **For fixes**: Document what was broken and how it was fixed
- **For breaking changes**: Call out explicitly in Changed section

### Writing style

- **Be specific**: "Added hybrid BM25 + vector search" not "Added search"
- **Include context**: Explain why change matters to users/developers
- **Use technical terms**: This is for developers, not marketing
