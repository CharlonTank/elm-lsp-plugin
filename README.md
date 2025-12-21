# Elm Marketplace for Claude Code

This repository is a **Claude Code marketplace** that provides Elm-related plugins.

## Available Plugins

### elm-lsp-rust

Fast Elm Language Server written in Rust with comprehensive refactoring support.

**Features:**
- Completion, hover, go-to-definition, find references
- Workspace symbols, rename across entire project
- Code actions, move function between modules
- File rename/move with import updates
- Smart variant removal (remove union type variants safely)

**Source:** [CharlonTank/elm-lsp-rust](https://github.com/CharlonTank/elm-lsp-rust)

## Installation

```bash
# Add this marketplace
claude plugin marketplace add https://github.com/CharlonTank/elm-lsp-plugin

# Install the Elm LSP plugin
claude plugin install elm-lsp-rust@elm-marketplace
```

Then restart Claude Code.

## License

MIT
