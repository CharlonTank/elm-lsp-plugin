---
description: Get available code actions for a range in an Elm file
arguments:
  - name: file
    description: The Elm file (e.g., "src/Module.elm")
  - name: range
    description: Line range to check (e.g., "10:0-10:50" for line 10)
---

# Elm Code Actions

Get available code actions for `$ARGUMENTS.file` at `$ARGUMENTS.range`.

## Instructions

1. Parse the range argument:
   - Format: "startLine:startChar-endLine:endChar"
   - All values are 0-indexed

2. Use `mcp__elm-lsp__elm_code_actions` with the file and range

3. List available actions:
   - Show action titles
   - Describe what each action does

4. To apply an action, use `mcp__elm-lsp__elm_apply_code_action`
