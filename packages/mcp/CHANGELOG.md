# @stackwright/mcp

## 0.6.0-alpha.1

### Minor Changes

- db54ac1: feat(mcp): expose register\*Tools and closeBrowser via /register subpath for downstream composition (fixes swp-hbdx)

  Adds a new `@stackwright/mcp/register` subpath export that re-exports all
  tool registrar functions and `closeBrowser` without any side effects (no
  McpServer instantiation, no transport binding). Downstream packages (Pro,
  third-party MCP composers) can now import and compose OSS tools onto their
  own McpServer instances.

  Changes:
  - New `src/register.ts` — pure re-export module, no side effects
  - `src/server.ts` — refactored to import from `register.ts` (single source of truth)
  - `package.json` — `./register` added to exports map
  - `tsup.config.ts` — `register` entry added; DTS enabled for `register` only
  - `tsconfig.json` — `types: ["node"]` added (required for DTS generation)
  - `vitest.config.ts` — alias for `@stackwright/build-scripts` (Vite 7 CJS resolution workaround)
  - `test/register-subpath.test.ts` — integration test asserting full tool surface on a real McpServer

## 0.5.3-alpha.0

### Patch Changes

- Updated dependencies [98bc1f7]
  - @stackwright/types@1.9.0-alpha.0
  - @stackwright/build-scripts@0.10.0-alpha.0
  - @stackwright/cli@0.9.0

## 0.5.2

### Patch Changes

- Updated dependencies [5e6d487]
- Updated dependencies [5e6d487]
  - @stackwright/build-scripts@0.9.0
  - @stackwright/types@1.8.0
  - @stackwright/cli@0.9.0

## 0.5.2-alpha.1

### Patch Changes

- Updated dependencies [3bac6b8]
  - @stackwright/build-scripts@0.9.0-alpha.1
  - @stackwright/types@1.8.0-alpha.1
  - @stackwright/cli@0.9.0

## 0.5.2-alpha.0

### Patch Changes

- Updated dependencies [803e6ea]
  - @stackwright/types@1.7.1-alpha.0
  - @stackwright/cli@0.9.0
  - @stackwright/build-scripts@0.8.2-alpha.0

## 0.5.1

### Patch Changes

- Updated dependencies [7fc040f]
- Updated dependencies [7fc040f]
  - @stackwright/types@1.7.0
  - @stackwright/build-scripts@0.8.1
  - @stackwright/cli@0.9.0

## 0.5.0

### Minor Changes

- cd5403d: Add integration management commands and MCP tools: `stackwright integrations list/get/add` CLI commands and `stackwright_list_integrations`, `stackwright_get_integration`, `stackwright_add_integration` MCP tools for managing OpenAPI, GraphQL, and REST integrations in stackwright.yml.
- cd5403d: Add `stackwright test:a11y` command for portable WCAG 2.1 AA accessibility auditing. Tests all pages (auto-discovered) in both light and dark modes using axe-core + Playwright. Also exposes `stackwright_test_a11y` MCP tool for Otter agent integration.
- cd5403d: Replace GitHub Issues board with beads-native implementation. The `stackwright board` CLI command and `stackwright_get_board` MCP tool now read from `.beads/issues.jsonl` instead of calling the `gh` CLI. No GitHub authentication or `gh` CLI required.

  **Breaking change in `@stackwright/cli` public types**: `GhIssueRaw` is removed (replaced by `BeadsIssue`); `BoardIssue.number` is now `BoardIssue.id: string`; `BoardIssue.labels` and `BoardIssue.assignees` are removed; `BoardIssue.issueType` is added.

### Patch Changes

- cd5403d: feat(mcp): auto-trigger prebuild before render in all four render tools. Replaces the fragile 2-second sleep in `stackwright_render_yaml` with an explicit `runPrebuild()` call so co-located images are always processed. Adds optional `projectRoot` param to `stackwright_render_page` and `stackwright_render_diff` for the same benefit.
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [f0bd272]
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [a931eb3]
- Updated dependencies [cd5403d]
- Updated dependencies [a931eb3]
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [cd5403d]
- Updated dependencies [f0bd272]
- Updated dependencies [a931eb3]
  - @stackwright/cli@0.9.0
  - @stackwright/build-scripts@0.8.0
  - @stackwright/types@1.6.0

## 0.5.0-alpha.13

### Patch Changes

- Updated dependencies [510517c]
  - @stackwright/types@1.6.0-alpha.4
  - @stackwright/build-scripts@0.8.0-alpha.7
  - @stackwright/cli@0.9.0-alpha.5

## 0.5.0-alpha.12

### Patch Changes

- Updated dependencies [2eba549]
- Updated dependencies [2eba549]
  - @stackwright/build-scripts@0.8.0-alpha.6
  - @stackwright/cli@0.9.0-alpha.5

## 0.5.0-alpha.11

### Patch Changes

- Updated dependencies [85075cd]
  - @stackwright/build-scripts@0.8.0-alpha.5
  - @stackwright/cli@0.9.0-alpha.5

## 0.5.0-alpha.10

### Patch Changes

- Updated dependencies [ed64fab]
  - @stackwright/types@1.6.0-alpha.3
  - @stackwright/build-scripts@0.8.0-alpha.4
  - @stackwright/cli@0.9.0-alpha.5

## 0.5.0-alpha.9

### Patch Changes

- @stackwright/cli@0.9.0-alpha.5
- @stackwright/types@1.6.0-alpha.2
- @stackwright/build-scripts@0.8.0-alpha.3

## 0.5.0-alpha.8

### Patch Changes

- Updated dependencies [6946d19]
  - @stackwright/cli@0.9.0-alpha.5

## 0.5.0-alpha.7

### Patch Changes

- Updated dependencies [9bd288f]
  - @stackwright/build-scripts@0.8.0-alpha.2
  - @stackwright/cli@0.9.0-alpha.4

## 0.5.0-alpha.6

### Patch Changes

- 2b85093: feat(mcp): auto-trigger prebuild before render in all four render tools. Replaces the fragile 2-second sleep in `stackwright_render_yaml` with an explicit `runPrebuild()` call so co-located images are always processed. Adds optional `projectRoot` param to `stackwright_render_page` and `stackwright_render_diff` for the same benefit.
- Updated dependencies [5df938e]
  - @stackwright/cli@0.9.0-alpha.4

## 0.5.0-alpha.5

### Patch Changes

- Updated dependencies [af4a166]
  - @stackwright/types@1.6.0-alpha.1
  - @stackwright/cli@0.9.0-alpha.3

## 0.5.0-alpha.4

### Patch Changes

- Updated dependencies [22e60b8]
  - @stackwright/cli@0.9.0-alpha.3

## 0.5.0-alpha.3

### Minor Changes

- 8dbbe0b: Add `stackwright test:a11y` command for portable WCAG 2.1 AA accessibility auditing. Tests all pages (auto-discovered) in both light and dark modes using axe-core + Playwright. Also exposes `stackwright_test_a11y` MCP tool for Otter agent integration.

### Patch Changes

- Updated dependencies [8dbbe0b]
  - @stackwright/cli@0.9.0-alpha.2

## 0.5.0-alpha.2

### Minor Changes

- 34d95c8: Replace GitHub Issues board with beads-native implementation. The `stackwright board` CLI command and `stackwright_get_board` MCP tool now read from `.beads/issues.jsonl` instead of calling the `gh` CLI. No GitHub authentication or `gh` CLI required.

  **Breaking change in `@stackwright/cli` public types**: `GhIssueRaw` is removed (replaced by `BeadsIssue`); `BoardIssue.number` is now `BoardIssue.id: string`; `BoardIssue.labels` and `BoardIssue.assignees` are removed; `BoardIssue.issueType` is added.

### Patch Changes

- Updated dependencies [34d95c8]
  - @stackwright/cli@0.9.0-alpha.1

## 0.5.0-alpha.1

### Patch Changes

- Updated dependencies [be7f767]
  - @stackwright/types@1.5.1-alpha.0
  - @stackwright/cli@0.9.0-alpha.0

## 0.5.0-alpha.0

### Minor Changes

- ba6b73a: Add integration management commands and MCP tools: `stackwright integrations list/get/add` CLI commands and `stackwright_list_integrations`, `stackwright_get_integration`, `stackwright_add_integration` MCP tools for managing OpenAPI, GraphQL, and REST integrations in stackwright.yml.

### Patch Changes

- Updated dependencies [ba6b73a]
  - @stackwright/cli@0.9.0-alpha.0

## 0.4.6

### Patch Changes

- Updated dependencies [e2f4e15]
- Updated dependencies [c2392b8]
- Updated dependencies [f132e20]
  - @stackwright/cli@0.8.6

## 0.4.6-alpha.0

### Patch Changes

- Updated dependencies [669aeee]
- Updated dependencies [3819871]
- Updated dependencies [cd01671]
  - @stackwright/cli@0.8.6-alpha.0

## 0.4.5

### Patch Changes

- Updated dependencies [03f6f4d]
- Updated dependencies [03f6f4d]
- Updated dependencies [03f6f4d]
  - @stackwright/cli@0.8.5

## 0.4.5-alpha.6

### Patch Changes

- Updated dependencies [a12100d]
  - @stackwright/cli@0.8.5-alpha.3

## 0.4.5-alpha.5

### Patch Changes

- Updated dependencies [11bfe0f]
  - @stackwright/cli@0.8.5-alpha.2

## 0.4.5-alpha.5

### Patch Changes

- Updated dependencies [11bfe0f]
  - @stackwright/cli@0.8.5-alpha.2

## 0.4.5-alpha.4

### Patch Changes

- Updated dependencies [182a4da]
- Updated dependencies [e6b3459]
  - @stackwright/cli@0.8.5-alpha.1

## 0.4.5-alpha.3

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- Updated dependencies [adb13ae]
  - @stackwright/types@1.5.0-alpha.3
  - @stackwright/cli@0.8.5-alpha.0

## 0.4.5-alpha.2

### Patch Changes

- Updated dependencies [b9a482b]
  - @stackwright/types@1.5.0-alpha.2
  - @stackwright/cli@0.8.4

## 0.4.5-alpha.1

### Patch Changes

- Updated dependencies [496aebb]
  - @stackwright/types@1.5.0-alpha.1
  - @stackwright/cli@0.8.4

## 0.4.5-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

- Updated dependencies [c18b6a1]
  - @stackwright/types@1.4.2-alpha.0
  - @stackwright/cli@0.8.4

## 0.4.4

### Patch Changes

- Updated dependencies [8616cd5]
- Updated dependencies [8616cd5]
- Updated dependencies [8616cd5]
- Updated dependencies [8616cd5]
  - @stackwright/cli@0.8.4
  - @stackwright/types@1.4.1

## 0.4.4-alpha.1

### Patch Changes

- Updated dependencies [21ed937]
  - @stackwright/types@1.4.1-alpha.1
  - @stackwright/cli@0.8.4-alpha.0

## 0.4.4-alpha.0

### Patch Changes

- Updated dependencies [f756476]
- Updated dependencies [5cfa88e]
- Updated dependencies [5cfa88e]
  - @stackwright/cli@0.8.4-alpha.0
  - @stackwright/types@1.4.1-alpha.0

## 0.4.3

### Patch Changes

- Updated dependencies [1c432e6]
  - @stackwright/types@1.4.0
  - @stackwright/cli@0.8.3

## 0.4.2

### Patch Changes

- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
  - @stackwright/types@1.3.0
  - @stackwright/cli@0.8.2

## 0.4.2-alpha.0

### Patch Changes

- Updated dependencies [bdf7fe0]
- Updated dependencies [f0b74ef]
- Updated dependencies [90a22c6]
- Updated dependencies [68bdad5]
- Updated dependencies [a410f02]
  - @stackwright/types@1.3.0-alpha.1
  - @stackwright/cli@0.8.2-alpha.0

## 0.4.1

### Patch Changes

- @stackwright/cli@0.8.1

## 0.4.0

### Minor Changes

- 8f34fd6: Add `stackwright_compose_site` MCP tool and `stackwright compose` CLI command for atomic whole-site generation with cross-page semantic validation.

  New capabilities:
  - Validate and write site config + all pages in a single atomic operation
  - Cross-page semantic checks: nav linkage, orphan pages, button hrefs, collection sources, duplicate titles, theme colors
  - Errors block all writes; warnings are reported but don't block

- 8f34fd6: Declarative collection entry pages with YAML-based layout templates.

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

- 8f34fd6: Add visual rendering tools to the MCP server — `stackwright_render_page`, `stackwright_render_diff`, `stackwright_render_yaml`, and `stackwright_check_dev_server`. These give AI agents a visual feedback loop: render any page to a screenshot, preview raw YAML before committing, capture before/after comparisons, and verify brand consistency.

  Add `stackwright preview` CLI command for rendering pages to screenshot files. Requires Playwright (optional peer dependency).

  Uses Playwright with browser instance pooling for sub-second re-renders after cold start.

### Patch Changes

- Updated dependencies [f365749]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [199ca1c]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/types@1.2.0
  - @stackwright/cli@0.8.0

## 0.3.0

### Minor Changes

- bbe2138: Add `stackwright_compose_site` MCP tool and `stackwright compose` CLI command for atomic whole-site generation with cross-page semantic validation.

  New capabilities:
  - Validate and write site config + all pages in a single atomic operation
  - Cross-page semantic checks: nav linkage, orphan pages, button hrefs, collection sources, duplicate titles, theme colors
  - Errors block all writes; warnings are reported but don't block

- f714fff: Declarative collection entry pages with YAML-based layout templates.

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

- 74c7efd: Add visual rendering tools to the MCP server — `stackwright_render_page`, `stackwright_render_diff`, `stackwright_render_yaml`, and `stackwright_check_dev_server`. These give AI agents a visual feedback loop: render any page to a screenshot, preview raw YAML before committing, capture before/after comparisons, and verify brand consistency.

  Add `stackwright preview` CLI command for rendering pages to screenshot files. Requires Playwright (optional peer dependency).

  Uses Playwright with browser instance pooling for sub-second re-renders after cold start.

### Patch Changes

- Updated dependencies [f5d7ec2]
- Updated dependencies [bbe2138]
- Updated dependencies [f714fff]
- Updated dependencies [53623f6]
- Updated dependencies [b14b0d2]
- Updated dependencies [b14b0d2]
- Updated dependencies [a662f0c]
- Updated dependencies [8bb4629]
- Updated dependencies [c1ca6ed]
- Updated dependencies [06e97c0]
- Updated dependencies [53623f6]
- Updated dependencies [6cda0f0]
- Updated dependencies [b14b0d2]
- Updated dependencies [a5b331f]
- Updated dependencies [74c7efd]
  - @stackwright/types@1.1.0
  - @stackwright/cli@0.7.0

## 0.3.0-alpha.11

### Patch Changes

- Updated dependencies [5c351f5]
- Updated dependencies [b2e451a]
  - @stackwright/cli@0.7.0-alpha.11

## 0.3.0-alpha.10

### Patch Changes

- Updated dependencies [24fed0f]
  - @stackwright/cli@0.7.0-alpha.10

## 0.3.0-alpha.9

### Patch Changes

- Updated dependencies [8bb4629]
  - @stackwright/cli@0.7.0-alpha.9

## 0.3.0-alpha.8

### Patch Changes

- Updated dependencies [02638c9]
- Updated dependencies [a662f0c]
  - @stackwright/types@1.1.0-alpha.6
  - @stackwright/cli@0.7.0-alpha.8

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [06e97c0]
- Updated dependencies [6cda0f0]
  - @stackwright/cli@0.7.0-alpha.7
  - @stackwright/types@1.1.0-alpha.5

## 0.3.0-alpha.6

### Patch Changes

- Updated dependencies [3663c96]
  - @stackwright/types@1.1.0-alpha.4
  - @stackwright/cli@0.7.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- Updated dependencies [e8dcbc0]
  - @stackwright/types@1.1.0-alpha.3
  - @stackwright/cli@0.7.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [ec21b1f]
  - @stackwright/types@1.1.0-alpha.2
  - @stackwright/cli@0.7.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- 74c7efd: Add visual rendering tools to the MCP server — `stackwright_render_page`, `stackwright_render_diff`, `stackwright_render_yaml`, and `stackwright_check_dev_server`. These give AI agents a visual feedback loop: render any page to a screenshot, preview raw YAML before committing, capture before/after comparisons, and verify brand consistency.

  Add `stackwright preview` CLI command for rendering pages to screenshot files. Requires Playwright (optional peer dependency).

  Uses Playwright with browser instance pooling for sub-second re-renders after cold start.

### Patch Changes

- Updated dependencies [74c7efd]
  - @stackwright/cli@0.7.0-alpha.3

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
