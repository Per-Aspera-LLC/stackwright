---
"@stackwright/build-scripts": minor
"@stackwright/cli": minor
"@stackwright/mcp": minor
---

Declarative collection entry pages: collections with `entryPage` config in `_collection.yaml` now automatically generate full page JSON during prebuild — zero custom React code required.

**@stackwright/build-scripts:**
- Prebuild generates `PageContent` JSON for each collection entry when `entryPage` config is present
- Entry pages include heading, meta fields, body content, and back button
- Path traversal protection on `basePath` and slug values
- Collision detection between generated entry pages and manual pages

**@stackwright/cli:**
- New `stackwright collection list` command shows all collections with entry counts
- New `stackwright collection add <name>` command with `--entry-page`, `--base-path`, `--sort` flags
- Scaffold template updated: `[slug].tsx` → `[...slug].tsx` catch-all route supporting nested paths

**@stackwright/mcp:**
- New `stackwright_list_collections` MCP tool
- New `stackwright_create_collection` MCP tool with full parameter validation
