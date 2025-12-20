---
description: Get compilation errors and warnings for an Elm file
arguments:
  - name: file
    description: The Elm file to check (e.g., "src/Module.elm")
---

# Elm Diagnostics

Get compilation errors and warnings for `$ARGUMENTS.file`.

## Instructions

1. Use `mcp__elm-lsp__elm_diagnostics` with the file path

2. Report any issues found:
   - Error messages
   - Warning messages
   - Line and column for each issue

3. If no issues found, confirm the file compiles successfully
