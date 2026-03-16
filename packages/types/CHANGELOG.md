# @stackwright/types

## 1.1.0-alpha.0

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

## 1.0.0

### Major Changes

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

### Minor Changes

- a6c3fcf: Add alert/admonition content type with info, warning, success, danger, note, and tip variants. Replaces the dead Callout component with a proper implementation including Zod schema, themed React component, severity icons, unit tests, and example usage.
- 27c6083: ## Collections system, `collection_list` content type, dark mode toggle, and example app overhaul

  ### New: `@stackwright/collections` package
  - `CollectionProvider` interface for pluggable data backends
  - `FileCollectionProvider` — reads from prebuild JSON (filesystem, zero async)
  - `collectionProviderRegistry` in `@stackwright/core` for registration

  ### New: `collection_list` content type
  - YAML-driven listing of collection entries with `cards`, `list`, and `compact` layouts
  - Field mapping via `card` config (`title`, `subtitle`, `meta`, `tags`)
  - Prebuild injects `_entries` at build time — zero async at render time
  - Zod schemas: `collectionListContentSchema`, `collectionCardMappingSchema`, `entryPageConfigSchema`

  ### New: Dark mode toggle
  - `colorModeToggle` field added to `appBarContentSchema` and `appBarConfigSchema`
  - `TopAppBar` renders Sun/Moon toggle when enabled
  - Removed type intersection hack — both schemas now agree

  ### Prebuild pipeline changes
  - Collections now process **before** pages (so `collection_list` entries can be injected)
  - `injectCollectionEntries()` walks page JSON and embeds `_entries` from collection indexes
  - `collection_list` added to `KNOWN_CONTENT_TYPE_KEYS` for typo detection

  ### Icon additions
  - Added 20+ Lucide icons to the preset (BookOpen, Calendar, Tag, Bot, Paintbrush, etc.)

  ### Example app overhaul
  - Complete rewrite of home, about, getting-started, and showcase pages
  - Dark amber/charcoal theme with `colorModeToggle: true`
  - Blog index page using `collection_list` content type (pure YAML)
  - Blog entry pages with `[slug].tsx` dynamic routing
  - Removed broken `blog/index.tsx` (had two default exports, phantom imports)
  - Removed `FileCollectionProvider` from `_app.tsx` to prevent `fs` in client bundle

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

- c2f7867: feat: page-level SEO metadata from YAML (#164)

  Add `meta` block to page content and site config for `<title>`, `<meta description>`, Open Graph tags, canonical URLs, and noindex control. Metadata resolves with page-level overrides falling back to site-level defaults, with auto-generated titles from the first content heading. The `NextStackwrightHead` adapter renders tags via `next/head`; if no Head adapter is registered, SEO tags are silently omitted (graceful degradation). Image co-location works for `og_image` paths with zero special handling. 26 new test cases across core and nextjs packages.

### Patch Changes

- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- 6820928: Move JSON schema output from `dist/schemas/` to `schemas/` (committed to git) so CI can detect drift. Update package exports and `files` field. Update scaffold `.vscode/settings.json` to reference the new schema path.
- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys
- 505002f: feat(themes): dark mode support (#108)
  - Add optional `darkColors` field to theme schema (same shape as `colors`)
  - Extract `colorsSchema` as a reusable named constant
  - Add `ColorMode` type (`'light'` | `'dark'` | `'system'`) and `ThemeColors` type
  - `ThemeProvider` now manages color mode state with `prefers-color-scheme` media query detection
  - New context fields: `colorMode`, `setColorMode`, `resolvedColorMode`, `rawTheme`
  - Colors resolve transparently — zero changes required to existing component consumers
  - `ThemeStyleInjector` `theme` prop is now optional; reads from context by default (fixes latent reactivity bug where CSS vars didn't update on `setTheme()`)
  - New `useThemeOptional()` hook for optional-context components
  - Dark palettes added to built-in corporate and soft themes
  - `DynamicPage` refactored to consume resolved theme from context
  - JSON schemas regenerated with `darkColors` field
  - 16 new dark mode tests, 4 new theme loader tests

- f1e4b70: Dependency updates
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [94d556a]
- Updated dependencies [ff06128]
- Updated dependencies [7077f83]
- Updated dependencies [505002f]
- Updated dependencies [2e78e6f]
- Updated dependencies [f0fbf0c]
- Updated dependencies [a5c1ff4]
  - @stackwright/themes@0.5.0

## 1.0.0-alpha.7

### Major Changes

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

### Minor Changes

- 27c6083: ## Collections system, `collection_list` content type, dark mode toggle, and example app overhaul

  ### New: `@stackwright/collections` package
  - `CollectionProvider` interface for pluggable data backends
  - `FileCollectionProvider` — reads from prebuild JSON (filesystem, zero async)
  - `collectionProviderRegistry` in `@stackwright/core` for registration

  ### New: `collection_list` content type
  - YAML-driven listing of collection entries with `cards`, `list`, and `compact` layouts
  - Field mapping via `card` config (`title`, `subtitle`, `meta`, `tags`)
  - Prebuild injects `_entries` at build time — zero async at render time
  - Zod schemas: `collectionListContentSchema`, `collectionCardMappingSchema`, `entryPageConfigSchema`

  ### New: Dark mode toggle
  - `colorModeToggle` field added to `appBarContentSchema` and `appBarConfigSchema`
  - `TopAppBar` renders Sun/Moon toggle when enabled
  - Removed type intersection hack — both schemas now agree

  ### Prebuild pipeline changes
  - Collections now process **before** pages (so `collection_list` entries can be injected)
  - `injectCollectionEntries()` walks page JSON and embeds `_entries` from collection indexes
  - `collection_list` added to `KNOWN_CONTENT_TYPE_KEYS` for typo detection

  ### Icon additions
  - Added 20+ Lucide icons to the preset (BookOpen, Calendar, Tag, Bot, Paintbrush, etc.)

  ### Example app overhaul
  - Complete rewrite of home, about, getting-started, and showcase pages
  - Dark amber/charcoal theme with `colorModeToggle: true`
  - Blog index page using `collection_list` content type (pure YAML)
  - Blog entry pages with `[slug].tsx` dynamic routing
  - Removed broken `blog/index.tsx` (had two default exports, phantom imports)
  - Removed `FileCollectionProvider` from `_app.tsx` to prevent `fs` in client bundle

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

- c2f7867: feat: page-level SEO metadata from YAML (#164)

  Add `meta` block to page content and site config for `<title>`, `<meta description>`, Open Graph tags, canonical URLs, and noindex control. Metadata resolves with page-level overrides falling back to site-level defaults, with auto-generated titles from the first content heading. The `NextStackwrightHead` adapter renders tags via `next/head`; if no Head adapter is registered, SEO tags are silently omitted (graceful degradation). Image co-location works for `og_image` paths with zero special handling. 26 new test cases across core and nextjs packages.

### Patch Changes

- 505002f: feat(themes): dark mode support (#108)
  - Add optional `darkColors` field to theme schema (same shape as `colors`)
  - Extract `colorsSchema` as a reusable named constant
  - Add `ColorMode` type (`'light'` | `'dark'` | `'system'`) and `ThemeColors` type
  - `ThemeProvider` now manages color mode state with `prefers-color-scheme` media query detection
  - New context fields: `colorMode`, `setColorMode`, `resolvedColorMode`, `rawTheme`
  - Colors resolve transparently — zero changes required to existing component consumers
  - `ThemeStyleInjector` `theme` prop is now optional; reads from context by default (fixes latent reactivity bug where CSS vars didn't update on `setTheme()`)
  - New `useThemeOptional()` hook for optional-context components
  - Dark palettes added to built-in corporate and soft themes
  - `DynamicPage` refactored to consume resolved theme from context
  - JSON schemas regenerated with `darkColors` field
  - 16 new dark mode tests, 4 new theme loader tests

- 8d1a637: Dependency updates
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [7077f83]
- Updated dependencies [505002f]
- Updated dependencies [f0fbf0c]
- Updated dependencies [a5c1ff4]
  - @stackwright/themes@0.5.0-alpha.4

## 0.4.0-alpha.6

### Minor Changes

- Version dependencies

### Patch Changes

- 8d1a637: Dependency updates
- Updated dependencies
  - @stackwright/themes@0.5.0-alpha.3

## 0.4.0-alpha.5

### Patch Changes

- Updated dependencies [70f070c]
  - @stackwright/themes@0.4.2-alpha.2

## 0.4.0-alpha.4

### Patch Changes

- Updated dependencies [77836f7]
  - @stackwright/themes@0.4.2-alpha.1

## 0.4.0-alpha.3

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/themes@0.4.2-alpha.0

## 0.4.0-alpha.2

### Patch Changes

- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys

## 0.4.0-alpha.1

### Minor Changes

- a6c3fcf: Add alert/admonition content type with info, warning, success, danger, note, and tip variants. Replaces the dead Callout component with a proper implementation including Zod schema, themed React component, severity icons, unit tests, and example usage.

## 0.3.2-alpha.0

### Patch Changes

- 6820928: Move JSON schema output from `dist/schemas/` to `schemas/` (committed to git) so CI can detect drift. Update package exports and `files` field. Update scaffold `.vscode/settings.json` to reference the new schema path.

## 0.3.1

### Patch Changes

- Updated dependencies
  - @stackwright/themes@0.4.1

## 0.3.0

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- 750f84a: Patch bump for core package import fixes.
- ce372ed: fix(types): restore full Zod validation for buttonContentSchema.icon

  Extracts a media-primitives.ts leaf module (no imports from base.ts) that
  defines a standalone mediaItemSchema, breaking the circular initialisation
  between base.ts and media.ts. buttonContentSchema.icon is now validated as
  a proper discriminated union instead of z.any().

- Updated dependencies [750f84a]
- Updated dependencies [1c35939]
  - @stackwright/themes@0.4.0

## 0.3.0-alpha.2

### Patch Changes

- ce372ed: fix(types): restore full Zod validation for buttonContentSchema.icon

  Extracts a media-primitives.ts leaf module (no imports from base.ts) that
  defines a standalone mediaItemSchema, breaking the circular initialisation
  between base.ts and media.ts. buttonContentSchema.icon is now validated as
  a proper discriminated union instead of z.any().

## 0.3.0-alpha.1

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- Updated dependencies [1c35939]
  - @stackwright/themes@0.4.0-alpha.1

## 0.2.3-alpha.0

### Patch Changes

- Patch bump for core package import fixes.
- Updated dependencies
  - @stackwright/themes@0.3.4-alpha.0

## 0.2.2

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

## 0.2.2-alpha.0

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

## 0.2.1

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
  - @stackwright/themes@0.3.2

## 0.2.1-alpha.0

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
  - @stackwright/themes@0.3.2-alpha.0

## 0.2.0

### Minor Changes

- ae26492: Add icon_grid content type, MediaItem type discriminator, and fix icon hydration

  **@stackwright/types**
  - `IconContent` gains required `type: "icon"` discriminator field
  - `ImageContent` gains required `type: "image"` discriminator field
  - `MediaItem` union is now properly discriminated for TypeScript narrowing

  **@stackwright/core**
  - New `IconGrid` component renders a responsive grid of registry-keyed icons with labels
  - `icon_grid` registered in `componentRegistry`; removed unreachable special-case in `contentRenderer`
  - `Media` now dispatches on `type` field first; string heuristics kept as fallback with deprecation warning
  - `MainContentGrid`: removed unsafe `as ImageContent` cast; spreads `content.media` directly
  - Removed `require('@mui/icons-material')` dynamic require from `Media` (caused SSR/client hydration mismatch)

  **@stackwright/icons**
  - New `muiIcons.ts` preset with 20 statically imported MUI icons, merged into `registerDefaultIcons()`
  - Fixes hydration mismatch: icons now resolve identically on server and client via registry
  - `AGENTS.md` rewritten with icon registration workflow, hydration constraint explanation, and full registered-icon reference table
  - Fixed self-referencing `@stackwright/icons: link:` in package.json

### Patch Changes

- dc2db25: Adding null checks to core
- 51dbbc9: Refactor types out of core into own package.
- 46df7ac: Documentation updates
- e4fbf2f: Update all dependencies
- cc761ce: More version updates
- Updated dependencies [dc2db25]
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [51dbbc9]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
- Updated dependencies [46df7ac]
- Updated dependencies [e4fbf2f]
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1

## 0.1.1-alpha.4

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/themes@0.3.1-alpha.5

## 0.1.1-alpha.3

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1-alpha.4

## 0.1.1-alpha.2

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/themes@0.3.1-alpha.3

## 0.1.1-alpha.1

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/themes@0.3.1-alpha.2

## 0.1.1-alpha.0

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/themes@0.3.1-alpha.1
