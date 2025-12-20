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
- **Remove a variant** from a custom type (union type)

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

### mcp__elm-lsp__elm_prepare_remove_variant
Check if a variant can be removed from a custom type. Returns variant info, usage count, and other variants.

**Parameters:**
- `file_path`: Absolute path to the Elm file containing the type definition
- `line`: 0-indexed line number of the variant name
- `character`: 0-indexed character position within the variant name

**Response includes:**
- `variantName`: Name of the variant
- `typeName`: Name of the parent type
- `otherVariants`: Array of other variant names (alternatives for replacement)
- `usagesCount`: Number of places the variant is used
- `canRemove`: Whether removal is allowed (false if it's the only variant)

### mcp__elm-lsp__elm_remove_variant
Remove a variant from a custom type. Will fail if the variant is used anywhere, showing blocking usages with call chain context.

**Parameters:**
- `file_path`: Absolute path to the Elm file containing the type definition
- `line`: 0-indexed line number of the variant name
- `character`: 0-indexed character position within the variant name

**On success:** Removes the variant line from the type definition.

**On failure:** Returns detailed blocking usages with:
- `function_name`: The function containing the usage
- `module_name`: The module name
- `call_chain`: Path from the function up to entry points (view, update, etc.) with `[ENTRY]` markers
- `otherVariants`: Available variants to use as replacements

## Workflow for Renaming

1. **Find the symbol location**: Use Grep to find where the symbol is defined
2. **Prepare rename**: Call `mcp__elm-lsp__elm_prepare_rename` to verify the symbol can be renamed
3. **Execute rename**: Call `mcp__elm-lsp__elm_rename` with the new name
4. **Verify**: Run `lamdera make src/Frontend.elm src/Backend.elm` to ensure compilation succeeds

## Workflow for Removing a Variant

1. **Find the variant**: Locate the type definition and the variant you want to remove
2. **Check removability**: Call `mcp__elm-lsp__elm_prepare_remove_variant` to see usage count and other variants
3. **Attempt removal**: Call `mcp__elm-lsp__elm_remove_variant`
4. **If blocked**: The response shows all blocking usages with context:
   - Each usage shows the function name and module
   - The call chain shows how it connects to app entry points (view, update, etc.)
   - `otherVariants` shows what you can replace it with
5. **Fix blocking usages**: Replace the variant with one of the `otherVariants` in each blocking location
6. **Retry removal**: Call `mcp__elm-lsp__elm_remove_variant` again
7. **Verify**: Run `lamdera make src/Frontend.elm src/Backend.elm` to ensure compilation succeeds

**Example blocking response:**
```
Cannot remove variant 'EventCancelled' from type CancellationStatus
Reason: Variant 'EventCancelled' is used in 5 place(s).

Other variants you can use instead: [EventUncancelled]

Blocking usages:
  1. Event.isCancelled:156
     Context: "Just ( EventCancelled, _ ) ->"
     Call chain:
       → Event.isCancelled:156
         → Backend.updateFromFrontend:727 [ENTRY]
```

This tells you:
- The variant is used in `isCancelled` function at line 156
- That function is called from `updateFromFrontend` (an entry point)
- You can replace `EventCancelled` with `EventUncancelled`

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
