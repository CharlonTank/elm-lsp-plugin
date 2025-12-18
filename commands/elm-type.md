---
description: Get the type signature of an Elm symbol
arguments:
  - name: symbol
    description: The symbol to get type info for (e.g., "myFunction" or "src/Module.elm:25:0")
---

# Elm Type Info

Get the type signature and documentation for `$ARGUMENTS.symbol`.

## Instructions

1. Locate the symbol:
   - If a file:line:char is provided, use that location
   - Otherwise, search for the symbol using Grep

2. Use `mcp__elm-lsp__elm_hover` to get type information

3. Display:
   - The full type signature
   - Any documentation/comments
   - The module where it's defined
