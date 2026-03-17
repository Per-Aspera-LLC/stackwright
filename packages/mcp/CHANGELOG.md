# @stackwright/mcp

## 0.3.0-alpha.2

### Patch Changes

- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0-alpha.1
  - @stackwright/cli@0.7.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- bbe2138: Add `stackwright_compose_site` MCP tool and `stackwright compose` CLI command for atomic whole-site generation with cross-page semantic validation.

  New capabilities:
  - Validate and write site config + all pages in a single atomic operation
  - Cross-page semantic checks: nav linkage, orphan pages, button hrefs, collection sources, duplicate titles, theme colors
  - Errors block all writes; warnings are reported but don't block

### Patch Changes

- Updated dependencies [bbe2138]
  - @stackwright/cli@0.7.0-alpha.1

## 0.3.0-alpha.0

### Minor Changes

- 87bd24d: Declarative collection entry pages with YAML-based layout templates.

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

### Patch Changes

- Updated dependencies [87bd24d]
  - @stackwright/cli@0.7.0-alpha.0
  - @stackwright/types@1.1.0-alpha.0

## 0.2.0

### Patch Changes

- Updated dependencies [d673906]
  - @stackwright/cli@0.6.0

## 0.2.0-alpha.17

### Patch Changes

- Updated dependencies [d673906]
  - @stackwright/cli@0.6.0-alpha.16

## 0.2.0-alpha.16

### Patch Changes

- Updated dependencies [840779f]
  - @stackwright/cli@0.6.0-alpha.15

## 0.2.0-alpha.15

### Patch Changes

- 948d04d: AI-first scaffold enhancements (Phase 2):
  - **feat**: Scaffold JSON output now includes `dependencyMode`, `siteConfigPath`, `pagesDir`, and structured `nextSteps` array for AI agent consumption.
  - **feat**: `--pages` flag for creating multiple pages during scaffold (e.g., `--pages about,contact,pricing`). Navigation auto-updated. MCP tool supports pages parameter.

- Updated dependencies [948d04d]
  - @stackwright/cli@0.6.0-alpha.14

## 0.2.0-alpha.14

### Patch Changes

- 14f862b: CLI overhaul for AI agent workflow (Phase 0+1):
  - **fix**: Pure functions (`scaffold()`, `addPage()`) now throw typed errors instead of calling `process.exit()`. MCP server no longer crashes on scaffold/page failures.
  - **feat**: `--force` flag on `scaffold` for non-empty directories. MCP scaffold tool defaults force to true.
  - **feat**: `--no-interactive` flag skips all prompts with sane defaults. `--json` implies non-interactive.
  - **feat**: `--monorepo` flag with auto-detection of pnpm workspaces. Generates `workspace:*` dependencies when inside a monorepo.
  - **fix**: Error messages now suggest recovery actions (e.g., "Use `stackwright scaffold` to create a project").
  - **fix**: Pages directory detection aligned between CLI and MCP. Single source of truth via `resolvePagesDir()`.

- Updated dependencies [14f862b]
  - @stackwright/cli@0.6.0-alpha.13

## 0.2.0-alpha.13

### Minor Changes

- c0fc647: BREAKING: Content items now use an explicit `type` field for discrimination.

  Before (nested key):

  ```yaml
  content_items:
    - main:
        label: hero
        heading: { text: 'Hello', textSize: h1 }
  ```

  After (flat with `type`):

  ```yaml
  content_items:
    - type: main
      label: hero
      heading: { text: 'Hello', textSize: h1 }
  ```

  This replaces the fragile `Object.entries(item)[0]` discrimination pattern with a proper
  discriminated union on the `type` field. Benefits:
  - TypeScript discriminated union narrowing (`if (item.type === 'main')`)
  - Clearer Zod validation errors (field-level paths instead of "unrecognized key")
  - No dependence on JS object insertion order
  - Simpler content renderer logic
  - Better MCP tool introspection

  All 15 content types are updated. The prebuild pipeline, CLI scaffolding, MCP tools,
  and agent docs generation have been adapted to the new format.

- daf5955: Add `board` CLI command and `stackwright_get_board` MCP tool for priority-tiered product board
  - `pnpm stackwright -- board` displays open GitHub Issues organized by priority label (now/next/later/vision)
  - `--json` flag outputs structured `BoardResult` for scripting and CI
  - `stackwright_get_board` MCP tool provides the same data to AI agents
  - Pure `parseBoard()` function exported for programmatic use
  - ROADMAP.md transformed from stale checklist to architectural narrative document
  - Priority label system documented in CONTRIBUTING.md

- a81fd0a: Add `stackwright_write_site_config` MCP tool and `writeSiteConfig` CLI function (#124). Agents can now programmatically update site configuration (themes, navigation, app bar, footer) with full Zod schema validation before write. Invalid YAML is rejected with field-level error messages. Also adds `site write` CLI subcommand.

### Patch Changes

- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [27c6083]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [daf5955]
- Updated dependencies [8d1a637]
- Updated dependencies [a5c1ff4]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
- Updated dependencies [a81fd0a]
  - @stackwright/types@1.0.0-alpha.7
  - @stackwright/cli@0.6.0-alpha.12

## 0.2.0-alpha.12

### Minor Changes

- Version dependencies
- a81fd0a: Add `stackwright_write_site_config` MCP tool and `writeSiteConfig` CLI function (#124). Agents can now programmatically update site configuration (themes, navigation, app bar, footer) with full Zod schema validation before write. Invalid YAML is rejected with field-level error messages. Also adds `site write` CLI subcommand.

### Patch Changes

- Updated dependencies [8d1a637]
- Updated dependencies
- Updated dependencies [a81fd0a]
  - @stackwright/types@0.4.0-alpha.6
  - @stackwright/cli@0.6.0-alpha.11

## 0.2.0-alpha.11

### Patch Changes

- 91ad9d7: feat(cli): replace scaffold builder functions with Zod schema introspection + GitHub template repo
  - New `schema-defaults.ts` generates valid default objects by walking Zod v4 schema `.def` structures, with a flat dot-path hints system for semantic overrides
  - New `scaffold-hints.ts` provides hint maps for site config, root page, and getting-started page content
  - New `template-fetcher.ts` fetches project boilerplate from the `stackwright-template-nextjs` GitHub template repo, with bundled fallback for offline/failure
  - Add `--offline` flag to `scaffold` command to skip GitHub template fetch
  - Fix #127: add `registerShadcnComponents()` to scaffold template `_app.tsx`
  - CI: `check-template-sync` job detects drift between bundled templates and template repo
  - CI: `sync-template-repo` workflow auto-pushes template changes on merge to dev

- Updated dependencies [91ad9d7]
  - @stackwright/cli@0.6.0-alpha.10

## 0.2.0-alpha.10

### Patch Changes

- @stackwright/cli@0.6.0-alpha.9
- @stackwright/types@0.4.0-alpha.5

## 0.2.0-alpha.9

### Patch Changes

- @stackwright/cli@0.6.0-alpha.8
- @stackwright/types@0.4.0-alpha.4

## 0.2.0-alpha.8

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/cli@0.6.0-alpha.7
  - @stackwright/types@0.4.0-alpha.3

## 0.2.0-alpha.7

### Patch Changes

- @stackwright/cli@0.6.0-alpha.6

## 0.2.0-alpha.6

### Minor Changes

- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool
  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool

## 0.2.0-alpha.5

### Minor Changes

- 0f05ba1: Add `stackwright_stage_changes` and `stackwright_open_pr` MCP tools completing the AI editorial loop. Agents can now go from content authoring to PR creation entirely via MCP — staging only content files for safety and validating all YAML before committing. Requires the GitHub CLI (`gh`) for PR creation.

### Patch Changes

- Updated dependencies [0f05ba1]
  - @stackwright/cli@0.6.0-alpha.5

## 0.2.0-alpha.4

### Minor Changes

- f330ab8: Add MCP tools for reading and writing page content and site configuration. New tools: `stackwright_get_page` (read page YAML by slug), `stackwright_write_page` (write/update page YAML with validation), and `stackwright_get_site_config` (read site config YAML). Also adds corresponding CLI commands `page get`, `page write`, and `site get`.

### Patch Changes

- Updated dependencies [f330ab8]
  - @stackwright/cli@0.6.0-alpha.4

## 0.1.2-alpha.3

### Patch Changes

- Updated dependencies [62a97d5]
  - @stackwright/types@0.4.0-alpha.2
  - @stackwright/cli@0.6.0-alpha.3

## 0.1.2-alpha.2

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1
  - @stackwright/cli@0.6.0-alpha.2

## 0.1.2-alpha.1

### Patch Changes

- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0
  - @stackwright/cli@0.6.0-alpha.1

## 0.1.2-alpha.0

### Patch Changes

- Updated dependencies [4efd19a]
  - @stackwright/cli@0.6.0-alpha.0

## 0.1.1

### Patch Changes

- @stackwright/cli@0.5.1
- @stackwright/types@0.3.1

## 0.1.0

### Minor Changes

- 855fc18: Add `@stackwright/mcp` — a stdio-based MCP server (`pnpm stackwright-mcp`) that exposes Stackwright as 8 agent tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. All tools use Zod for input validation and return structured MCP responses with error flags.

### Patch Changes

- b728f0d: Added MCP Server package
- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [4a15246]
- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0
  - @stackwright/cli@0.5.0

## 0.1.0-alpha.2

### Patch Changes

- Updated dependencies [ce372ed]
- Updated dependencies [4a15246]
  - @stackwright/types@0.3.0-alpha.2
  - @stackwright/cli@0.5.0-alpha.2

## 0.1.0-alpha.1

### Minor Changes

- 855fc18: Add `@stackwright/mcp` — a stdio-based MCP server (`pnpm stackwright-mcp`) that exposes Stackwright as 8 agent tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. All tools use Zod for input validation and return structured MCP responses with error flags.

### Patch Changes

- b728f0d: Added MCP Server package
