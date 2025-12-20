---
description: Go to the definition of an Elm symbol
arguments:
  - name: symbol
    description: The symbol to find the definition for (e.g., "myFunction" or "src/Module.elm:25:myFunction")
---

# Elm Go to Definition

Find where `$ARGUMENTS.symbol` is defined.

## Instructions

1. Locate the symbol:
   - If a file:line:char is provided, use that location
   - Otherwise, search for the symbol using Grep

2. Use `mcp__elm-lsp__elm_definition` to find the definition location

3. Report:
   - The file path where the symbol is defined
   - The line number
   - Show the relevant code snippet from that location
