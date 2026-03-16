# @stackwright/cli

## 0.7.0-alpha.1

### Minor Changes

- bbe2138: Add `stackwright_compose_site` MCP tool and `stackwright compose` CLI command for atomic whole-site generation with cross-page semantic validation.

  New capabilities:
  - Validate and write site config + all pages in a single atomic operation
  - Cross-page semantic checks: nav linkage, orphan pages, button hrefs, collection sources, duplicate titles, theme colors
  - Errors block all writes; warnings are reported but don't block

## 0.7.0-alpha.0

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
  - @stackwright/build-scripts@0.4.0-alpha.0
  - @stackwright/types@1.1.0-alpha.0

## 0.6.0

### Patch Changes

- d673906: Fix shell injection vulnerability in template-fetcher by replacing execSync with execFileSync (CodeQL CWE-78/CWE-88). Add pnpm overrides for vulnerable transitive dependencies (undici, flatted, hono, @hono/node-server, express-rate-limit) to resolve all open Dependabot alerts.

## 0.6.0-alpha.16

### Patch Changes

- d673906: Fix shell injection vulnerability in template-fetcher by replacing execSync with execFileSync (CodeQL CWE-78/CWE-88). Add pnpm overrides for vulnerable transitive dependencies (undici, flatted, hono, @hono/node-server, express-rate-limit) to resolve all open Dependabot alerts.

## 0.6.0-alpha.15

### Patch Changes

- 840779f: Add ESM output to CLI package to fix Vite/Vitest module resolution in downstream packages

## 0.6.0-alpha.14

### Minor Changes

- 948d04d: AI-first scaffold enhancements (Phase 2):
  - **feat**: Scaffold JSON output now includes `dependencyMode`, `siteConfigPath`, `pagesDir`, and structured `nextSteps` array for AI agent consumption.
  - **feat**: `--pages` flag for creating multiple pages during scaffold (e.g., `--pages about,contact,pricing`). Navigation auto-updated. MCP tool supports pages parameter.

## 0.6.0-alpha.13

### Minor Changes

- 14f862b: CLI overhaul for AI agent workflow (Phase 0+1):
  - **fix**: Pure functions (`scaffold()`, `addPage()`) now throw typed errors instead of calling `process.exit()`. MCP server no longer crashes on scaffold/page failures.
  - **feat**: `--force` flag on `scaffold` for non-empty directories. MCP scaffold tool defaults force to true.
  - **feat**: `--no-interactive` flag skips all prompts with sane defaults. `--json` implies non-interactive.
  - **feat**: `--monorepo` flag with auto-detection of pnpm workspaces. Generates `workspace:*` dependencies when inside a monorepo.
  - **fix**: Error messages now suggest recovery actions (e.g., "Use `stackwright scaffold` to create a project").
  - **fix**: Pages directory detection aligned between CLI and MCP. Single source of truth via `resolvePagesDir()`.

## 0.6.0-alpha.12

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
- b1f3a30: feat(types,core): layout grid content type for composable multi-column layouts (#125)
  - Add `grid` content type with `GridColumn` and `GridContent` Zod schemas
  - Columns contain recursive `content_items` arrays (same structure as pages)
  - Column widths expressed as relative `fr` units (default: equal width)
  - `LayoutGrid` React component renders CSS Grid with responsive stacking
  - SSR-safe `matchMedia` hook for mobile breakpoint detection (`stackBelow` prop, default 768px)
  - Nested grids filtered at render time with `console.warn` to prevent infinite recursion
  - Registered in `componentRegistry` as `'grid'`
  - `GridColumn` added to AGENTS.md sub-type reference table via `generate-agent-docs`
  - JSON schemas regenerated with grid type (circular `z.lazy()` refs handled cleanly)
  - 12 new unit tests + 1 content renderer integration test
  - Two grid demos added to showcase page (2-column and 3-column layouts)

  Also includes: refactor(core) — cleaned up verbose debug logging in `contentRenderer.tsx` and `componentRegistry.ts` (~112 lines of redundant try/catch-rethrow wrappers removed, zero behavioral changes)

- Updated dependencies [27c6083]
- Updated dependencies [7077f83]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [8d1a637]
- Updated dependencies [f0fbf0c]
- Updated dependencies [a5c1ff4]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
  - @stackwright/types@1.0.0-alpha.7
  - @stackwright/build-scripts@0.3.0-alpha.8
  - @stackwright/themes@0.5.0-alpha.4

## 0.6.0-alpha.11

### Minor Changes

- Version dependencies
- a81fd0a: Add `stackwright_write_site_config` MCP tool and `writeSiteConfig` CLI function (#124). Agents can now programmatically update site configuration (themes, navigation, app bar, footer) with full Zod schema validation before write. Invalid YAML is rejected with field-level error messages. Also adds `site write` CLI subcommand.

### Patch Changes

- Updated dependencies [8d1a637]
- Updated dependencies
  - @stackwright/types@0.4.0-alpha.6
  - @stackwright/build-scripts@0.3.0-alpha.7
  - @stackwright/themes@0.5.0-alpha.3

## 0.6.0-alpha.10

### Minor Changes

- 91ad9d7: feat(cli): replace scaffold builder functions with Zod schema introspection + GitHub template repo
  - New `schema-defaults.ts` generates valid default objects by walking Zod v4 schema `.def` structures, with a flat dot-path hints system for semantic overrides
  - New `scaffold-hints.ts` provides hint maps for site config, root page, and getting-started page content
  - New `template-fetcher.ts` fetches project boilerplate from the `stackwright-template-nextjs` GitHub template repo, with bundled fallback for offline/failure
  - Add `--offline` flag to `scaffold` command to skip GitHub template fetch
  - Fix #127: add `registerShadcnComponents()` to scaffold template `_app.tsx`
  - CI: `check-template-sync` job detects drift between bundled templates and template repo
  - CI: `sync-template-repo` workflow auto-pushes template changes on merge to dev

## 0.6.0-alpha.9

### Patch Changes

- Updated dependencies [70f070c]
  - @stackwright/themes@0.4.2-alpha.2
  - @stackwright/types@0.4.0-alpha.5
  - @stackwright/build-scripts@0.3.0-alpha.6

## 0.6.0-alpha.8

### Patch Changes

- Updated dependencies [77836f7]
  - @stackwright/themes@0.4.2-alpha.1
  - @stackwright/types@0.4.0-alpha.4
  - @stackwright/build-scripts@0.3.0-alpha.5

## 0.6.0-alpha.7

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/types@0.4.0-alpha.3
  - @stackwright/themes@0.4.2-alpha.0
  - @stackwright/build-scripts@0.3.0-alpha.4

## 0.6.0-alpha.6

### Patch Changes

- Updated dependencies [d1ecb6b]
  - @stackwright/build-scripts@0.3.0-alpha.3

## 0.6.0-alpha.5

### Minor Changes

- 0f05ba1: Add `stackwright_stage_changes` and `stackwright_open_pr` MCP tools completing the AI editorial loop. Agents can now go from content authoring to PR creation entirely via MCP — staging only content files for safety and validating all YAML before committing. Requires the GitHub CLI (`gh`) for PR creation.

## 0.6.0-alpha.4

### Minor Changes

- f330ab8: Add MCP tools for reading and writing page content and site configuration. New tools: `stackwright_get_page` (read page YAML by slug), `stackwright_write_page` (write/update page YAML with validation), and `stackwright_get_site_config` (read site config YAML). Also adds corresponding CLI commands `page get`, `page write`, and `site get`.

## 0.6.0-alpha.3

### Patch Changes

- Updated dependencies [62a97d5]
  - @stackwright/types@0.4.0-alpha.2
  - @stackwright/build-scripts@0.2.2-alpha.2

## 0.6.0-alpha.2

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1
  - @stackwright/build-scripts@0.2.2-alpha.1

## 0.6.0-alpha.1

### Patch Changes

- 6820928: Move JSON schema output from `dist/schemas/` to `schemas/` (committed to git) so CI can detect drift. Update package exports and `files` field. Update scaffold `.vscode/settings.json` to reference the new schema path.
- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0
  - @stackwright/build-scripts@0.2.2-alpha.0

## 0.6.0-alpha.0

### Minor Changes

- 4efd19a: feat(cli): add `generate-agent-docs` command to auto-generate AGENTS.md content type reference tables from live Zod schemas (closes #83)
  - New `pnpm stackwright -- generate-agent-docs` command introspects Zod schemas at runtime and regenerates the content type reference tables in `/AGENTS.md` and `examples/hellostackwrightnext/AGENTS.md`
  - Tables are delimited by `<!-- stackwright:content-type-table:start/end -->` HTML comment markers; non-table content is preserved
  - Schema name registry maps Zod schema object references to human-readable type names (TextBlock, MediaItem, etc.) for readable output
  - Fixed `resolveSchema` to correctly handle `optional(lazy(...))` wrapper nesting (fixes `tabbed_content` showing empty fields)
  - CI job `check-agent-docs` runs the generator and fails with an actionable message if AGENTS.md is out of sync
  - `generateAgentDocs()` exported from `@stackwright/cli` for programmatic use

## 0.5.1

### Patch Changes

- Updated dependencies
  - @stackwright/themes@0.4.1
  - @stackwright/types@0.3.1
  - @stackwright/build-scripts@0.2.1

## 0.5.0

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- 750f84a: Patch bump for core package import fixes.
- 4a15246: refactor(cli): replace dynamic require() with static imports for sub-type schema introspection

  Sub-type schemas are now imported statically from @stackwright/types, making the
  dependency explicit and eliminating the silent-drop risk when a schema is renamed.

- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [36dd46c]
- Updated dependencies [1c35939]
  - @stackwright/themes@0.4.0
  - @stackwright/types@0.3.0
  - @stackwright/build-scripts@0.2.0

## 0.5.0-alpha.2

### Patch Changes

- 4a15246: refactor(cli): replace dynamic require() with static imports for sub-type schema introspection

  Sub-type schemas are now imported statically from @stackwright/types, making the
  dependency explicit and eliminating the silent-drop risk when a schema is renamed.

- Updated dependencies [ce372ed]
  - @stackwright/types@0.3.0-alpha.2
  - @stackwright/build-scripts@0.2.0-alpha.1

## 0.5.0-alpha.1

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- Updated dependencies [36dd46c]
- Updated dependencies [1c35939]
  - @stackwright/build-scripts@0.2.0-alpha.0
  - @stackwright/types@0.3.0-alpha.1
  - @stackwright/themes@0.4.0-alpha.1

## 0.4.3-alpha.0

### Patch Changes

- Patch bump for core package import fixes.
- Updated dependencies
  - @stackwright/themes@0.3.4-alpha.0
  - @stackwright/types@0.2.3-alpha.0

## 0.4.2

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor
  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

- Updated dependencies [076c9e7]
  - @stackwright/themes@0.3.3
  - @stackwright/types@0.2.2

## 0.4.2-alpha.0

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor
  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

- Updated dependencies [076c9e7]
  - @stackwright/themes@0.3.3-alpha.0
  - @stackwright/types@0.2.2-alpha.0

## 0.4.1

### Patch Changes

- 386acb8: chore(deps): batch dependency maintenance — February 2026
  - `@mui/material` + `@mui/icons-material`: 7.2.0 → 7.3.8 (patch)
  - `@fontsource/montserrat-alternates`: 5.2.6 → 5.2.8 (patch)
  - `uuid`: ^11.1.0 → ^13.0.0 (major — API unchanged for v4/v7 usage)
  - `@inquirer/prompts`: ^7.0.0 → ^8.3.0 (major — updated call sites)
  - `jsdom`: ^26.1.0 → ^28.1.0 (major, devDep)
  - `vitest`: ^3.2.4 → ^4.0.18 across all packages (major, devDep)
  - `tsx`: ^4.0.0 → ^4.21.0 (patch, devDep)
  - `typescript-json-schema`: ^0.65.1 → ^0.67.1 (patch, devDep)
  - `@testing-library/jest-dom`: ^6.6 → ^6.9 (patch, devDep)
  - `chalk`: ^5.4.0 → ^5.6.2 (patch)
  - `@types/node`: ^24.1 → ^25.3 (major, devDep)

  Note: eslint held at ^9.39.2 in examples/hellostackwrightnext — eslint v10
  is not yet supported by eslint-config-next / eslint-plugin-import.

- Updated dependencies [386acb8]
  - @stackwright/types@0.2.1
  - @stackwright/themes@0.3.2
  - @stackwright/build-scripts@0.1.2

## 0.4.1-alpha.0

### Patch Changes

- 386acb8: chore(deps): batch dependency maintenance — February 2026
  - `@mui/material` + `@mui/icons-material`: 7.2.0 → 7.3.8 (patch)
  - `@fontsource/montserrat-alternates`: 5.2.6 → 5.2.8 (patch)
  - `uuid`: ^11.1.0 → ^13.0.0 (major — API unchanged for v4/v7 usage)
  - `@inquirer/prompts`: ^7.0.0 → ^8.3.0 (major — updated call sites)
  - `jsdom`: ^26.1.0 → ^28.1.0 (major, devDep)
  - `vitest`: ^3.2.4 → ^4.0.18 across all packages (major, devDep)
  - `tsx`: ^4.0.0 → ^4.21.0 (patch, devDep)
  - `typescript-json-schema`: ^0.65.1 → ^0.67.1 (patch, devDep)
  - `@testing-library/jest-dom`: ^6.6 → ^6.9 (patch, devDep)
  - `chalk`: ^5.4.0 → ^5.6.2 (patch)
  - `@types/node`: ^24.1 → ^25.3 (major, devDep)

  Note: eslint held at ^9.39.2 in examples/hellostackwrightnext — eslint v10
  is not yet supported by eslint-config-next / eslint-plugin-import.

- Updated dependencies [386acb8]
  - @stackwright/types@0.2.1-alpha.0
  - @stackwright/themes@0.3.2-alpha.0
  - @stackwright/build-scripts@0.1.2-alpha.0

## 0.4.0

### Minor Changes

- 9e08684: Modernize scaffold template to match current project conventions.

  New projects created with `stackwright scaffold` now:
  - Include a `getting-started/` starter page alongside the root page, demonstrating the subdirectory-per-slug convention
  - Scaffold `stackwright.yml` with a full `customTheme` block (colors, typography, spacing) instead of a bare `themeName` reference
  - Include a CTA button on the root page linking to the getting-started page
  - Use the secure `[slug].tsx` template with slug allowlist validation (path traversal prevention)
  - Include `pnpm` engine spec (`>=10.0.0`) and `packageManager` field in `package.json`
  - Have an enriched `.env.local.example` with copy instructions and clearer comments
  - Have a WSL-annotated `.gitignore`

## 0.3.2

### Patch Changes

- Updated dependencies [4c964f1]
  - @stackwright/build-scripts@0.1.1

## 0.3.1

### Patch Changes

- dc2db25: Adding null checks to core
- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- 51dbbc9: Refactor types out of core into own package.
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- 46df7ac: Documentation updates
- e4fbf2f: Update all dependencies
- cc761ce: More version updates
- Updated dependencies [dc2db25]
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [51dbbc9]
- Updated dependencies [f195337]
- Updated dependencies [8910585]
- Updated dependencies [5ff20a6]
- Updated dependencies [46df7ac]
- Updated dependencies [e4fbf2f]
- Updated dependencies [ae26492]
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1
  - @stackwright/core@0.4.0

## 0.3.1-alpha.6

### Patch Changes

- Updated dependencies [8910585]
  - @stackwright/core@0.3.1-alpha.6

## 0.3.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/themes@0.3.1-alpha.5
  - @stackwright/core@0.3.1-alpha.5

## 0.3.1-alpha.4

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1-alpha.4
  - @stackwright/core@0.3.1-alpha.4

## 0.3.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/themes@0.3.1-alpha.3
  - @stackwright/core@0.3.1-alpha.3

## 0.3.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/themes@0.3.1-alpha.2
  - @stackwright/core@0.3.1-alpha.2

## 0.3.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/themes@0.3.1-alpha.1
  - @stackwright/core@0.3.1-alpha.1

## 0.3.1-alpha.0

### Patch Changes

- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
  - @stackwright/themes@0.3.1-alpha.0
  - @stackwright/core@0.3.1-alpha.0

## 0.2.2

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
- Updated dependencies [78a02d1]
- Updated dependencies [d66fda6]
  - @stackwright/core@0.2.2
  - @stackwright/themes@0.2.1

## 0.2.1

### Patch Changes

- Updated dependencies [dcbbb62]
  - @stackwright/core@0.2.1
