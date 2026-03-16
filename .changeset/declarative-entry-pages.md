---
"@stackwright/build-scripts": minor
"@stackwright/cli": minor
"@stackwright/mcp": minor
"@stackwright/types": minor
---

Declarative collection entry pages with YAML-based layout templates.

Collections with `entryPage` config in `_collection.yaml` now automatically generate full page JSON during prebuild — zero custom React code required.

**Template system (`@stackwright/build-scripts`, `@stackwright/types`):**
- Define entry page layouts using the same `content_items` syntax as regular pages, with `{{fieldName}}` placeholders resolved against each entry's data
- Single `{{field}}` references preserve the raw value type (arrays, objects pass through)
- Inline interpolation: `"{{date}} · {{author}} · {{tags}}"` with auto array-to-comma conversion
- Smart null handling: missing fields cause their containing block to be omitted, so a single template works for entries with and without optional fields (e.g., cover images)
- Default template used when `template` key is absent (backward-compatible with `body`/`meta`/`tags` config)
- Path traversal protection on `basePath` and slug values

**CLI (`@stackwright/cli`):**
- New `stackwright collection list` command shows all collections with entry counts
- New `stackwright collection add <name>` command with `--entry-page`, `--base-path`, `--sort` flags
- Scaffold template updated: `[slug].tsx` → `[...slug].tsx` catch-all route supporting nested paths

**MCP (`@stackwright/mcp`):**
- New `stackwright_list_collections` MCP tool
- New `stackwright_create_collection` MCP tool with full parameter validation
