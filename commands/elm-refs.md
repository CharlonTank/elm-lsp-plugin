---
description: Find all references to an Elm symbol
arguments:
  - name: symbol
    description: The symbol to find references for (e.g., "myFunction" or "src/Module.elm:25:myFunction")
---

# Find Elm References

Find all references to `$ARGUMENTS.symbol` in the project.

## Instructions

1. Locate the symbol:
   - If a file:line is provided, use that location
   - Otherwise, search for the symbol definition using Grep

2. Use `mcp__elm-lsp__elm_references` to find all references

3. Report the results grouped by file:
   - Show file path and line number for each reference
   - Indicate which one is the definition
   - Show total count of references
