# Elm Marketplace for Claude Code

This repository is a **Claude Code marketplace** that indexes and distributes Elm-related plugins.

## Installation

```bash
# Add this marketplace to Claude Code
claude plugin marketplace add https://github.com/CharlonTank/elm-lsp-plugin

# Install the Elm LSP plugin
claude plugin install elm-lsp-rust@elm-marketplace
```

Then restart Claude Code.

## How the Marketplace Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     elm-lsp-plugin                              │
│            (This Repository - Marketplace)                      │
│     https://github.com/CharlonTank/elm-lsp-plugin              │
│                                                                 │
│  .claude-plugin/marketplace.json                                │
│  └── plugins: [                                                 │
│        { name: "elm-lsp-rust",                                  │
│          source: "CharlonTank/elm-lsp-rust",                   │
│          version: "0.3.8" }                                     │
│      ]                                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ references
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     elm-lsp-rust                                │
│                   (Plugin Repository)                           │
│      https://github.com/CharlonTank/elm-lsp-rust               │
│                                                                 │
│  .claude-plugin/plugin.json ─► Plugin metadata                  │
│  src/                       ─► Rust LSP server                  │
│  mcp-wrapper/               ─► MCP server (bridges MCP↔LSP)     │
│  scripts/setup.sh           ─► Builds Rust binary on install    │
└─────────────────────────────────────────────────────────────────┘
```

### Distribution Flow

1. **User adds marketplace**: `claude plugin marketplace add https://github.com/CharlonTank/elm-lsp-plugin`
2. **Claude Code reads**: `.claude-plugin/marketplace.json` to discover available plugins
3. **User installs plugin**: `claude plugin install elm-lsp-rust@elm-marketplace`
4. **Claude Code fetches**: The plugin from `CharlonTank/elm-lsp-rust` repository
5. **Setup runs**: `scripts/setup.sh` builds the Rust binary
6. **Plugin active**: MCP tools become available in Claude Code

## Available Plugins

### elm-lsp-rust (v0.3.8)

Fast Elm Language Server written in Rust with comprehensive refactoring support.

**Features:**
- Completion, hover, go-to-definition, find references
- Workspace symbols, rename across entire project
- Code actions, move function between modules
- File rename/move with import updates
- Smart variant removal (remove union type variants safely)

**Source:** [CharlonTank/elm-lsp-rust](https://github.com/CharlonTank/elm-lsp-rust)

## Repository Structure

```
elm-lsp-plugin/
├── .claude-plugin/
│   └── marketplace.json    # Indexes available plugins
├── README.md
└── LICENSE
```

This is a **marketplace-only** repository. It contains no plugin code - just metadata that points to plugin repositories.

## Adding New Plugins

To add a plugin to this marketplace, update `.claude-plugin/marketplace.json`:

```json
{
  "plugins": [
    {
      "name": "your-plugin-name",
      "description": "Your plugin description",
      "version": "1.0.0",
      "source": {
        "source": "github",
        "repo": "YourUsername/your-plugin-repo"
      },
      "category": "development"
    }
  ]
}
```

The plugin repository must have a `.claude-plugin/plugin.json` file.

## License

MIT
