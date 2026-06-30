# Brave Search MCP for VS Code

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![VS Code Version](https://img.shields.io/badge/VS%20Code-%5E1.95.0-blue)](https://code.visualstudio.com/)
[![GitHub Issues](https://img.shields.io/github/issues/overtonlabs/brave-search-vscode-mcp-extension)](https://github.com/overtonlabs/brave-search-vscode-mcp-extension/issues)

A VS Code extension that integrates the [Brave Search API](https://brave.com/search/api/) with the Model Context Protocol (MCP), enabling AI Copilot to perform internet searches for research and planning purposes.

## Features

This extension provides AI Copilot with the ability to:

- 🔍 **Web Search**: Search the web using Brave's independent search index
- 📰 **News Search**: Find recent news articles and current events
- 🖼️ **Image Search**: Search for images across the web
- 🎬 **Video Search**: Search for videos with metadata and thumbnails
- 📍 **Local Search**: Find local businesses and places with ratings and hours (requires Search plan)

These capabilities are automatically available to GitHub Copilot and other AI assistants in VS Code when running in agent mode.

## Prerequisites

- VS Code version 1.95.0 or higher
- A Brave Search API key (free tier available)
- Node.js installed (required for running the MCP server)

## Installation

### From VSIX File (Local Installation)

1. Download or build the `.vsix` file
2. Open VS Code
3. Go to Extensions view (Ctrl+Shift+X / Cmd+Shift+X)
4. Click the "..." menu at the top of the Extensions view
5. Select "Install from VSIX..."
6. Choose the downloaded `.vsix` file

### From VS Code Marketplace

Search for "Brave Search MCP" in the Extensions view and click Install.

## Getting a Brave Search API Key

1. Visit [Brave Search API](https://api.search.brave.com/)
2. Sign up for a free account
3. Create a new API key in your dashboard
4. Copy your API key (starts with `BSA`)

### API Plans

- **Search**: $5/1,000 requests — includes $5 in free credits every month (automatically applied)
- **Answers**: $4/1,000 queries + token costs — AI-generated grounded answers
- **Enterprise**: Custom terms, capacity, and Zero Data Retention — [contact Brave](https://brave.com/search/api/)

See [Brave Search API Pricing](https://api-dashboard.search.brave.com/documentation/pricing) for full details.

## Configuration

Your API key is stored securely in your operating system's keychain via VS Code's
Secret Storage — never in plaintext settings, and never synced by Settings Sync.

### Initial Setup

The first time an AI assistant uses Brave Search, you'll be prompted for your API key
and it will be saved securely. To set it ahead of time, use the Command Palette:

1. Open Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
2. Type "Brave Search MCP: Configure API Key"
3. Enter your API key when prompted

### Managing your key

Both commands live under the **Brave Search MCP** category in the Command Palette:

- **Brave Search MCP: Configure API Key** — set your key, or replace an existing one (key rotation)
- **Brave Search MCP: Clear API Key** — remove the stored key from secure storage

> **Upgrading from an earlier version?** If you previously stored your key in the
> `braveSearchMcp.apiKey` setting, it is migrated into secure storage automatically and
> the plaintext setting is cleared — no action needed.

### Settings

- `braveSearchMcp.enabled`: Enable/disable the MCP server (default: true)
- `braveSearchMcp.apiKey`: _Deprecated_ — retained only to migrate older plaintext keys into secure storage. Use the Configure API Key command instead.

## Usage

Once configured, the Brave Search tools are automatically available to AI assistants in VS Code:

### Quick Start

1. **Open Copilot Chat** - Click the chat icon in the sidebar or use Ctrl+Shift+I (Cmd+Shift+I on Mac)
2. **Enable Agent Mode** - Click the sparkle icon (✨) in the chat input box
3. **Ask questions requiring web search** - Use natural language prompts (see examples below)

The AI will automatically use Brave Search when your question requires current information from the internet.

### Example Prompts

Try asking Copilot questions like these:

#### 🔍 Web Search Examples

- "What are the latest features in TypeScript 5.7?"
- "Find documentation for the vscode.lm API"
- "Search for best practices for React Server Components"
- "Look up the current syntax for Python async/await"
- "Find examples of using the Fetch API with error handling"
- "What's the difference between REST and GraphQL?"

#### 📰 News Search Examples

- "Find recent news about AI coding assistants"
- "What are the latest announcements from Microsoft Build?"
- "Search for news about the newest VS Code updates"
- "Find recent articles about GitHub Copilot features"
- "What's new in the JavaScript ecosystem this month?"

#### 🖼️ Image Search Examples

- "Find images of the VS Code logo"
- "Search for TypeScript architecture diagrams"
- "Find screenshots of popular VS Code themes"
- "Look for icons representing API concepts"

#### 🎬 Video Search Examples

- "Find tutorial videos for getting started with Rust"
- "Search for conference talks about distributed systems"
- "Find videos explaining how transformers work in machine learning"
- "Look for VS Code tips and tricks videos"

#### 📍 Local Search Examples

- "Find coffee shops near downtown Seattle"
- "Search for co-working spaces in Austin, TX"
- "Find highly rated Thai restaurants in Chicago"
- "Look for hardware stores open near me"

**💡 Tips for Best Results:**

- **Use natural language** - No special syntax or commands needed
- **Be specific** - The more specific your question, the better the results
- **Let the AI decide** - Copilot automatically chooses which search tool to use
- **Agent mode required** - Make sure the sparkle icon (✨) is active in chat

## How It Works

This extension uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) to connect AI assistants to the Brave Search API:

1. The extension registers an MCP server definition with VS Code
2. When activated, it launches the official `@brave/brave-search-mcp-server` package
3. The MCP server exposes search tools to AI assistants
4. AI assistants can invoke these tools automatically based on user intent
5. Search results are returned and incorporated into AI responses

## Troubleshooting

### "API key not configured" warning

- Run "Brave Search MCP: Configure API Key" from the Command Palette to (re)enter your key
- Verify the API key is correct and starts with `BSA`

### Search tools not appearing in Copilot

- Ensure you're using VS Code 1.95.0 or higher
- Make sure Copilot is in agent mode (sparkle icon)
- Check that `braveSearchMcp.enabled` is set to `true`
- Restart VS Code after configuring the API key

### "npx command not found" error

- Ensure Node.js and npm are installed on your system
- Restart VS Code after installing Node.js
- Verify npm is in your system PATH

### Rate limiting errors

- Check your API usage in the [Brave API Dashboard](https://api-dashboard.search.brave.com/)
- The Search plan includes $5 in free monthly credits — usage beyond that is billed at $5/1,000 requests

## Privacy & Security

- Your API key is stored securely in your OS keychain via VS Code Secret Storage — not in plaintext settings, and not carried by Settings Sync
- The API key is never transmitted except to Brave's API servers
- Search queries are processed by Brave Search (see [Brave Privacy Policy](https://brave.com/privacy/))
- The extension only activates when the MCP server is requested by an AI assistant

## Building from Source

```bash
# Clone the repository
git clone https://github.com/overtonlabs/brave-search-vscode-mcp-extension.git
cd brave-search-vscode-mcp-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package the extension
npm run package

# This creates a .vsix file you can install
```

## Development

```bash
# Watch mode for development
npm run watch

# Run in Extension Development Host
# Press F5 in VS Code to launch a new window with the extension loaded
```

## Feature Requests & Contributing

Have an idea or found a bug? [Open an issue on GitHub](https://github.com/overtonlabs/brave-search-vscode-mcp-extension/issues) — all feature requests and enhancement ideas are tracked there.

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

BSD 3-Clause License - see LICENSE file for details

## Links

- [Brave Search API](https://brave.com/search/api/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Official Brave Search MCP Server](https://github.com/brave/brave-search-mcp-server)
- [VS Code MCP Documentation](https://code.visualstudio.com/api/references/vscode-api#McpServerDefinition)

## Acknowledgments

- Built using the official [@brave/brave-search-mcp-server](https://www.npmjs.com/package/@brave/brave-search-mcp-server) package
- Powered by [Brave Search API](https://brave.com/search/api/)
- Implements the [Model Context Protocol](https://modelcontextprotocol.io/) standard

---

**Note**: This extension requires an active internet connection and a valid Brave Search API key to function.
