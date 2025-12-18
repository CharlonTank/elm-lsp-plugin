---
description: Rename an Elm symbol across the entire project using LSP
arguments:
  - name: symbol
    description: The symbol to rename (e.g., "myFunction" or "src/Module.elm:myFunction")
  - name: newName
    description: The new name for the symbol
---

# Elm Rename

Rename the Elm symbol `$ARGUMENTS.symbol` to `$ARGUMENTS.newName` using the elm-language-server.

## Instructions

1. First, find where the symbol is defined:
   - If the argument contains a file path (e.g., "src/Module.elm:symbolName"), use that file
   - Otherwise, search the codebase for the symbol definition using Grep

2. Use `mcp__elm-lsp__elm_prepare_rename` to verify the symbol can be renamed

3. Use `mcp__elm-lsp__elm_rename` with:
   - The file path where the symbol is defined
   - The line and character position (0-indexed)
   - The new name: `$ARGUMENTS.newName`

4. Report which files were modified

5. Run `lamdera make src/Frontend.elm src/Backend.elm` to verify the rename didn't break anything

## Important
- Line numbers are 0-indexed for LSP (subtract 1 from editor line numbers)
- Always verify compilation after renaming
