# Elm LSP Plugin for Claude Code

A Claude Code plugin that integrates elm-language-server for intelligent Elm refactoring.

## Features

- **Rename symbols** across your entire project safely
- **Find all references** to functions, types, and values
- **Go to definition** for any symbol
- **Get type information** with hover
- **List document symbols** with pagination
- **Diagnostics** for compilation errors

## Prerequisites

Install elm-language-server globally:

```bash
npm install -g @elm-tooling/elm-language-server
```

## Installation

### Option 1: Install from GitHub

```bash
/plugin install elm-lsp@CharlonTank/elm-lsp-plugin
```

### Option 2: Install locally

```bash
/plugin install /path/to/elm-lsp-plugin
```

### Option 3: Add to project

Add to your project's `.claude/plugins.json`:

```json
{
  "plugins": ["elm-lsp@CharlonTank/elm-lsp-plugin"]
}
```

## Usage

### Slash Commands

- `/elm-rename <symbol> <newName>` - Rename a symbol across the project
- `/elm-refs <symbol>` - Find all references to a symbol
- `/elm-type <symbol>` - Get type information for a symbol

### Automatic (via Skill)

The plugin teaches Claude to automatically use LSP tools when you ask to:
- Rename a variable or function
- Find where something is used
- Check the type of a function

Just ask naturally:
- "Rename `oldName` to `newName`"
- "Find all usages of `myFunction`"
- "What's the type of `processData`?"

## MCP Tools

The plugin exposes these tools to Claude:

| Tool | Description |
|------|-------------|
| `elm_rename` | Rename symbol across all files |
| `elm_references` | Find all references |
| `elm_definition` | Go to definition |
| `elm_hover` | Get type info |
| `elm_symbols` | List file symbols (paginated) |
| `elm_prepare_rename` | Check if rename is valid |
| `elm_diagnostics` | Get compilation errors |

## Project Structure

```
elm-lsp-plugin/
├── .claude-plugin/
│   └── plugin.json       # Plugin metadata
├── .mcp.json             # MCP server configuration
├── commands/
│   ├── elm-rename.md     # /elm-rename command
│   ├── elm-refs.md       # /elm-refs command
│   └── elm-type.md       # /elm-type command
├── skills/
│   └── elm-refactoring/
│       └── SKILL.md      # Teaches Claude when to use LSP
├── server/
│   ├── index.mjs         # MCP server implementation
│   └── package.json      # Server dependencies
└── README.md
```

## Development

To modify the plugin:

1. Edit files in the plugin directory
2. Run `npm install` in the `server/` directory
3. Restart Claude Code to reload the plugin

## License

MIT
