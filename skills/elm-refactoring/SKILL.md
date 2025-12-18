---
name: elm-refactoring
description: Use elm-language-server MCP tools for safe refactoring in Elm projects. Automatically use these tools instead of manual text edits when renaming variables, finding references, or navigating code.
---

# Elm Refactoring with LSP

When working in an Elm project (has `elm.json`), use the elm-lsp MCP tools for refactoring operations instead of manual text search/replace.

## When to Use This Skill

Activate this skill when the user asks to:
- **Rename** a variable, function, type, or module
- **Find all references** to a symbol
- **Go to definition** of a function or type
- **Get type information** for a symbol

## Available MCP Tools

### mcp__elm-lsp__elm_rename
Rename a symbol across all files in the project.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `line`: 0-indexed line number where the symbol is defined
- `character`: 0-indexed character position
- `newName`: The new name for the symbol

**Example:**
```
To rename `oldName` to `newName` at line 29 (1-indexed) in DomId.elm:
- file_path: "/path/to/project/src/DomId.elm"
- line: 28 (0-indexed)
- character: 0
- newName: "newName"
```

### mcp__elm-lsp__elm_references
Find all references to a symbol.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `line`: 0-indexed line number
- `character`: 0-indexed character position

### mcp__elm-lsp__elm_definition
Go to the definition of a symbol.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `line`: 0-indexed line number
- `character`: 0-indexed character position

### mcp__elm-lsp__elm_symbols
List all symbols (functions, types, values) in a file.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `limit`: (optional) Maximum symbols to return (default: 50)
- `offset`: (optional) Number of symbols to skip for pagination (default: 0)

**Response includes:**
- `symbols`: Array of symbol definitions
- `pagination`: `{ total, offset, limit, hasMore }`

### mcp__elm-lsp__elm_hover
Get type information and documentation for a symbol.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `line`: 0-indexed line number
- `character`: 0-indexed character position

### mcp__elm-lsp__elm_prepare_rename
Check if a symbol can be renamed before attempting.

**Parameters:**
- `file_path`: Absolute path to the Elm file
- `line`: 0-indexed line number
- `character`: 0-indexed character position

## Workflow for Renaming

1. **Find the symbol location**: Use Grep to find where the symbol is defined
2. **Prepare rename**: Call `mcp__elm-lsp__elm_prepare_rename` to verify the symbol can be renamed
3. **Execute rename**: Call `mcp__elm-lsp__elm_rename` with the new name
4. **Verify**: Run `lamdera make src/Frontend.elm src/Backend.elm` to ensure compilation succeeds

## Important Notes

- Line numbers in LSP are **0-indexed** (subtract 1 from what you see in the editor)
- Character positions are also **0-indexed**
- The rename tool returns a WorkspaceEdit with changes across multiple files
- Always verify compilation after renaming

## Why Use LSP Instead of Manual Edits

- **Safe**: LSP understands Elm's scope and semantics
- **Complete**: Finds all references including across modules
- **Accurate**: Won't accidentally rename unrelated symbols with the same name
- **Fast**: Single operation instead of multiple file edits
