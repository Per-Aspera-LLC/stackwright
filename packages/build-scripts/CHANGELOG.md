# @stackwright/build-scripts

## 0.4.0-alpha.7

### Minor Changes

- 24fed0f: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

### Patch Changes

- Updated dependencies [24fed0f]
- Updated dependencies [24fed0f]
  - @stackwright/sbom-generator@0.1.0-alpha.0

## 0.4.0-alpha.6

### Minor Changes

- 02638c9: Add built-in full-text search to every Stackwright site.

  **New feature (`@stackwright/core`):**
  - Client-side search using Fuse.js with fuzzy matching
  - Search modal triggered by clicking search button or pressing `/`
  - Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
  - Accessible: proper ARIA labels, focus trapping, screen reader announcements
  - SSR-safe: no hydration mismatches

  **Prebuild changes (`@stackwright/build-scripts`):**
  - Generate search index JSON during prebuild containing all page content
  - Index includes page slugs, headings, and text content
  - Index placed in public folder for client-side fetching

  **Type updates (`@stackwright/types`):**
  - Add `searchIndexPath` option to SiteConfig

  **E2E tests (`@stackwright/e2e`):**
  - Add accessibility and interaction tests for search functionality

### Patch Changes

- Updated dependencies [02638c9]
- Updated dependencies [a662f0c]
  - @stackwright/types@1.1.0-alpha.6

## 0.4.0-alpha.5

### Patch Changes

- @stackwright/types@1.1.0-alpha.5

## 0.4.0-alpha.4

### Patch Changes

- Updated dependencies [3663c96]
  - @stackwright/types@1.1.0-alpha.4

## 0.4.0-alpha.3

### Patch Changes

- Updated dependencies [e8dcbc0]
  - @stackwright/types@1.1.0-alpha.3

## 0.4.0-alpha.2

### Patch Changes

- Updated dependencies [ec21b1f]
  - @stackwright/types@1.1.0-alpha.2

## 0.4.0-alpha.1

### Minor Changes

- a5b331f: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0-alpha.1

## 0.4.0-alpha.0

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
  - @stackwright/types@1.1.0-alpha.0

## 0.3.0

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

- 138b604: Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms. A built-in SSE server notifies the browser to auto-reload when content changes, enabling the live authoring loop where AI agents or humans can edit content and see changes appear without restarting the dev server or manually refreshing.

### Patch Changes

- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [a6c3fcf]
- Updated dependencies [94d556a]
- Updated dependencies [6820928]
- Updated dependencies [27c6083]
- Updated dependencies [62a97d5]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [f1e4b70]
- Updated dependencies [a5c1ff4]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
  - @stackwright/types@1.0.0

## 0.3.0-alpha.8

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

### Patch Changes

- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [27c6083]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [8d1a637]
- Updated dependencies [a5c1ff4]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
  - @stackwright/types@1.0.0-alpha.7

## 0.3.0-alpha.7

### Minor Changes

- Version dependencies

### Patch Changes

- Updated dependencies [8d1a637]
- Updated dependencies
  - @stackwright/types@0.4.0-alpha.6

## 0.3.0-alpha.6

### Patch Changes

- @stackwright/types@0.4.0-alpha.5

## 0.3.0-alpha.5

### Patch Changes

- @stackwright/types@0.4.0-alpha.4

## 0.3.0-alpha.4

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/types@0.4.0-alpha.3

## 0.3.0-alpha.3

### Minor Changes

- d1ecb6b: Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms. A built-in SSE server notifies the browser to auto-reload when content changes, enabling the live authoring loop where AI agents or humans can edit content and see changes appear without restarting the dev server or manually refreshing.

## 0.2.2-alpha.2

### Patch Changes

- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys
- Updated dependencies [62a97d5]
  - @stackwright/types@0.4.0-alpha.2

## 0.2.2-alpha.1

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1

## 0.2.2-alpha.0

### Patch Changes

- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0

## 0.2.1

### Patch Changes

- @stackwright/types@0.3.1

## 0.2.0

### Minor Changes

- 36dd46c: Add Zod schema validation to the prebuild pipeline. Both `stackwright.yml` and each page `content.yml` are now validated against their schemas after YAML parsing. Invalid content fails loudly with structured field-level error messages before image processing runs, closing the gap between "schema exists for IDE hints" and "schema is enforced before execution".

### Patch Changes

- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0

## 0.2.0-alpha.1

### Patch Changes

- Updated dependencies [ce372ed]
  - @stackwright/types@0.3.0-alpha.2

## 0.2.0-alpha.0

### Minor Changes

- 36dd46c: Add Zod schema validation to the prebuild pipeline. Both `stackwright.yml` and each page `content.yml` are now validated against their schemas after YAML parsing. Invalid content fails loudly with structured field-level error messages before image processing runs, closing the gap between "schema exists for IDE hints" and "schema is enforced before execution".

### Patch Changes

- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0-alpha.1

## 0.1.2

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

## 0.1.2-alpha.0

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

## 0.1.1

### Patch Changes

- 4c964f1: fix(sprint2): reliability and silent failure modes
  - Add React error boundary to `DynamicPage` so a single bad component
    shows degraded UI instead of crashing the whole page
  - Move `ShimmerOverlay` styled component to module scope in `DynamicPage`
    to prevent a new CSS class being generated on every render
  - Fix image filename collisions in prebuild: include the slug in the
    destination path so pages with identically-named images no longer
    silently overwrite each other in `public/images/`

## 0.1.0-alpha.1

### Minor Changes

- 8910585: Next.js 16 / Turbopack compatibility and prebuild pipeline

  **New package: `@stackwright/build-scripts`**
  - Introduces `stackwright-prebuild` CLI binary for build-time YAML processing
  - Scans `pages/` for `content.yml` files, copies co-located images to `public/images/`, and writes processed JSON to `public/stackwright-content/`
  - Eliminates all `fs`/`path` usage from `@stackwright/nextjs`, resolving Turbopack browser-bundle conflicts
  - Add `"prebuild": "stackwright-prebuild"` and `"predev": "stackwright-prebuild"` to your `package.json` scripts; `getStaticProps` then reads from `public/stackwright-content/*.json`

  **`@stackwright/nextjs`**
  - `NextStackwrightStaticGeneration` removed — static generation is now handled by the prebuild pipeline above
  - `createStackwrightNextConfig` adds `turbopack: {}` for Next.js 16+ (silences webpack-without-turbopack warning)
  - Remove `shallow` prop from `StackwrightLinkProps` and `NextStackwrightLink` (removed from `next/link` in Next.js 13)
  - Widen peer dependency to `next: ">=15"` to cover Next.js 16+

  **`@stackwright/core`**
  - Remove `shallow` from `StackwrightLinkProps` interface
  - Pin workspace `csstype` to `^3.2.0` via pnpm override to resolve DTS build conflict
