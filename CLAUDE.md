# Claude Code Instructions for elm-lsp-plugin

## Project Overview

This is the **elm-lsp-plugin** repository - a Claude Code marketplace that indexes Elm-related plugins.

### What is a Marketplace?

A marketplace is a registry that tells Claude Code where to find plugins. This repository contains no plugin code - only metadata pointing to plugin repositories.

### Architecture

```
elm-lsp-plugin (this repo)              elm-lsp-rust (plugin repo)
├── .claude-plugin/                     ├── .claude-plugin/
│   └── marketplace.json ──────────────►│   └── plugin.json
│       └── points to CharlonTank/      │
│           elm-lsp-rust                ├── src/        (Rust LSP)
└── README.md                           ├── mcp-wrapper/ (MCP bridge)
                                        └── scripts/setup.sh
```

## Key Files

- `.claude-plugin/marketplace.json` - Plugin registry (the only important file)
- `README.md` - Installation instructions

## Common Tasks

### Updating Plugin Version

When a new version of `elm-lsp-rust` is released:

1. Edit `.claude-plugin/marketplace.json`
2. Update the `version` field to match the new version
3. Commit and push

```json
{
  "plugins": [
    {
      "name": "elm-lsp-rust",
      "version": "X.Y.Z",  // <-- Update this
      ...
    }
  ]
}
```

### Adding a New Plugin

To add another Elm plugin to this marketplace:

1. Ensure the plugin repo has `.claude-plugin/plugin.json`
2. Add an entry to `marketplace.json`:

```json
{
  "name": "new-plugin-name",
  "description": "Description here",
  "version": "1.0.0",
  "source": {
    "source": "github",
    "repo": "Username/repo-name"
  },
  "category": "development"
}
```

## Related Repository

- **elm-lsp-rust**: https://github.com/CharlonTank/elm-lsp-rust
  - The actual Elm Language Server plugin
  - Contains Rust code, MCP wrapper, and tests
