---
description: List all symbols in an Elm file
arguments:
  - name: file
    description: The Elm file to list symbols from (e.g., "src/Module.elm")
---

# Elm Symbols

List all symbols (functions, types, type aliases) in `$ARGUMENTS.file`.

## Instructions

1. Use `mcp__elm-lsp__elm_symbols` with the file path

2. Display symbols organized by type:
   - Functions
   - Types
   - Type Aliases
   - Ports

3. Show line numbers for each symbol
