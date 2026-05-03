# @stackwright/core

## 0.8.2-alpha.0

### Patch Changes

- Updated dependencies [4f71be4]
  - @stackwright/types@1.4.0-alpha.0

## 0.8.1

### Patch Changes

- 265bf87: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- 265bf87: fix(core): bundle prismjs to eliminate bare ESM sub-path imports

  `@stackwright/core`'s published ESM bundle contained bare imports such as
  `import 'prismjs/components/prism-javascript'` (no `.js` extension). Because
  `prismjs` is a legacy CJS package with no `exports` map, Node.js ESM strict
  resolver could not find these paths and threw `ERR_MODULE_NOT_FOUND`.

  Added `noExternal: ['prismjs']` to `tsup.config.ts` so that esbuild bundles
  prismjs inline at build time. All language grammar paths are resolved to real
  `.js` files before the bundle is published — no bare specifiers escape into
  the output.

- 265bf87: fix(core): prevent duplicate TopAppBar rendering that caused a double dark-mode toggle icon
- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
  - @stackwright/types@1.3.0

## 0.8.1-alpha.2

### Patch Changes

- fb3393e: fix(core): bundle prismjs to eliminate bare ESM sub-path imports

  `@stackwright/core`'s published ESM bundle contained bare imports such as
  `import 'prismjs/components/prism-javascript'` (no `.js` extension). Because
  `prismjs` is a legacy CJS package with no `exports` map, Node.js ESM strict
  resolver could not find these paths and threw `ERR_MODULE_NOT_FOUND`.

  Added `noExternal: ['prismjs']` to `tsup.config.ts` so that esbuild bundles
  prismjs inline at build time. All language grammar paths are resolved to real
  `.js` files before the bundle is published — no bare specifiers escape into
  the output.

## 0.8.1-alpha.1

### Patch Changes

- c036f5b: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- 5ad5035: fix(core): prevent duplicate TopAppBar rendering that caused a double dark-mode toggle icon
- Updated dependencies [bdf7fe0]
- Updated dependencies [68bdad5]
  - @stackwright/types@1.3.0-alpha.1

## 0.8.1-alpha.0

### Patch Changes

- c036f5b: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- 5ad5035: fix(core): prevent duplicate TopAppBar rendering that caused a double dark-mode toggle icon
- Updated dependencies [bdf7fe0]
- Updated dependencies [68bdad5]
  - @stackwright/types@1.3.0-alpha.0

## 0.8.0

### Minor Changes

- 8f34fd6: Add built-in full-text search to every Stackwright site.

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

- 8f34fd6: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

- 8f34fd6: feat(core): add page-level `navSidebar` override in `content.yml`

  Pages can now override the site-wide sidebar defined in `stackwright.yml` using the `navSidebar` field. This enables:
  - Dashboard pages to hide the sidebar (`navSidebar: null`) for full-width content
  - Documentation chapters to show page-specific navigation in the sidebar
  - Page Otter to customize sidebar behavior without editing the theme

  The resolution order is: page `navSidebar` > site `sidebar` (from Theme Otter) > no sidebar.

  Docs and AGENTS.md updated with examples and Otter responsibility notes.

- 8f34fd6: feat: add resolveBackground utility for dark-mode-aware section backgrounds

  All content components now resolve background values through resolveBackground().
  Theme color keys (e.g., 'surface', 'primary') are mapped to the current theme.colors,
  which is dark-mode-aware. Literal hex values pass through unchanged (backward compatible).

- 8f34fd6: Add text_block content type - a simpler alternative to main for heading + text + buttons without media-related fields. Perfect for text-heavy sections, announcements, and callouts within grid layouts.
- 8f34fd6: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- 46df0c5: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- 8f34fd6: docs: add architecture principles, ecosystem analogy, and CI philosophy

  Added to PHILOSOPHY.md:
  - "The Ecosystem Analogy" (Spring comparison table)
  - 4 constraints that must never be violated

  Added to CLAUDE.md:
  - "No Hard Dependencies" principle with type-only imports, interface contracts, and registration patterns

  Added to CONTRIBUTING.md:
  - "CI Hardening Philosophy" section explaining the "bugs drive CI" approach

- 8f34fd6: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)
- 8f34fd6: Fixed dark mode text colors and background handling for improved demo/hackathon quality:
  - **#252**: Verified ThemeProvider toggle updates correctly (no code changes needed)
  - **#251**: Added dark overlay for background images to ensure text contrast
  - **Alert component**: Added dark-mode-aware accent colors
  - **CodeBlock component**: Added dark mode syntax highlighting palette
  - **useSafeTheme hook**: Added `useSafeColorMode` hook for safe color mode access

- 115c658: Fix missing Lucide icons (Code2, Layout) and improve CodeBlock rendering for ASCII art diagrams

  ### Icon Registry Fixes
  - **Code2 icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)
  - **Layout icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)

  ### CodeBlock Improvements
  - Better monospace font stack for proper ASCII art alignment
  - Added font-variant-ligatures: none to prevent character transformation issues

  ### Architecture Page Fixes
  - Replaced problematic YAML/JSON code blocks with tabbed_content component
  - Fixed overflow issues caused by ASCII art alignment problems

- 199ca1c: Fix icon color prop to resolve theme tokens like 'accent' to CSS variables, enabling dark mode support
- 46df0c5: fix(core): prevent duplicate TopAppBar rendering that caused a double dark-mode toggle icon
- Updated dependencies [f365749]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [199ca1c]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/types@1.2.0
  - @stackwright/themes@0.5.2

## 0.7.1-alpha.1

### Patch Changes

- 115c658: Fix missing Lucide icons (Code2, Layout) and improve CodeBlock rendering for ASCII art diagrams

  ### Icon Registry Fixes
  - **Code2 icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)
  - **Layout icon**: Added direct import to lucideAllIcons.ts (was missing from barrel export)

  ### CodeBlock Improvements
  - Better monospace font stack for proper ASCII art alignment
  - Added font-variant-ligatures: none to prevent character transformation issues

  ### Architecture Page Fixes
  - Replaced problematic YAML/JSON code blocks with tabbed_content component
  - Fixed overflow issues caused by ASCII art alignment problems

## 0.7.1-alpha.0

### Patch Changes

- 8f34fd6: docs: add architecture principles, ecosystem analogy, and CI philosophy

  Added to PHILOSOPHY.md:
  - "The Ecosystem Analogy" (Spring comparison table)
  - 4 constraints that must never be violated

  Added to CLAUDE.md:
  - "No Hard Dependencies" principle with type-only imports, interface contracts, and registration patterns

  Added to CONTRIBUTING.md:
  - "CI Hardening Philosophy" section explaining the "bugs drive CI" approach

## 0.7.0

### Minor Changes

- f5d7ec2: Add built-in full-text search to every Stackwright site.

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

- b14b0d2: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

- a662f0c: feat(core): add page-level `navSidebar` override in `content.yml`

  Pages can now override the site-wide sidebar defined in `stackwright.yml` using the `navSidebar` field. This enables:
  - Dashboard pages to hide the sidebar (`navSidebar: null`) for full-width content
  - Documentation chapters to show page-specific navigation in the sidebar
  - Page Otter to customize sidebar behavior without editing the theme

  The resolution order is: page `navSidebar` > site `sidebar` (from Theme Otter) > no sidebar.

  Docs and AGENTS.md updated with examples and Otter responsibility notes.

- 6cda0f0: feat: add resolveBackground utility for dark-mode-aware section backgrounds

  All content components now resolve background values through resolveBackground().
  Theme color keys (e.g., 'surface', 'primary') are mapped to the current theme.colors,
  which is dark-mode-aware. Literal hex values pass through unchanged (backward compatible).

- b14b0d2: Add text_block content type - a simpler alternative to main for heading + text + buttons without media-related fields. Perfect for text-heavy sections, announcements, and callouts within grid layouts.
- a5b331f: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- 6cda0f0: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)
- 53623f6: Fixed dark mode text colors and background handling for improved demo/hackathon quality:
  - **#252**: Verified ThemeProvider toggle updates correctly (no code changes needed)
  - **#251**: Added dark overlay for background images to ensure text contrast
  - **Alert component**: Added dark-mode-aware accent colors
  - **CodeBlock component**: Added dark mode syntax highlighting palette
  - **useSafeTheme hook**: Added `useSafeColorMode` hook for safe color mode access

- Updated dependencies [f5d7ec2]
- Updated dependencies [f714fff]
- Updated dependencies [6cda0f0]
- Updated dependencies [b14b0d2]
- Updated dependencies [b14b0d2]
- Updated dependencies [a662f0c]
- Updated dependencies [b14b0d2]
- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0
  - @stackwright/themes@0.5.1

## 0.7.0-alpha.7

### Patch Changes

- 167b5bb: Fixed dark mode text colors and background handling for improved demo/hackathon quality:
  - **#252**: Verified ThemeProvider toggle updates correctly (no code changes needed)
  - **#251**: Added dark overlay for background images to ensure text contrast
  - **Alert component**: Added dark-mode-aware accent colors
  - **CodeBlock component**: Added dark mode syntax highlighting palette
  - **useSafeTheme hook**: Added `useSafeColorMode` hook for safe color mode access

## 0.7.0-alpha.6

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

- a662f0c: feat(core): add page-level `navSidebar` override in `content.yml`

  Pages can now override the site-wide sidebar defined in `stackwright.yml` using the `navSidebar` field. This enables:
  - Dashboard pages to hide the sidebar (`navSidebar: null`) for full-width content
  - Documentation chapters to show page-specific navigation in the sidebar
  - Page Otter to customize sidebar behavior without editing the theme

  The resolution order is: page `navSidebar` > site `sidebar` (from Theme Otter) > no sidebar.

  Docs and AGENTS.md updated with examples and Otter responsibility notes.

### Patch Changes

- Updated dependencies [02638c9]
- Updated dependencies [a662f0c]
  - @stackwright/types@1.1.0-alpha.6

## 0.7.0-alpha.5

### Minor Changes

- 6cda0f0: feat: add resolveBackground utility for dark-mode-aware section backgrounds

  All content components now resolve background values through resolveBackground().
  Theme color keys (e.g., 'surface', 'primary') are mapped to the current theme.colors,
  which is dark-mode-aware. Literal hex values pass through unchanged (backward compatible).

### Patch Changes

- 6cda0f0: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)
- Updated dependencies [6cda0f0]
  - @stackwright/themes@0.5.1-alpha.0
  - @stackwright/types@1.1.0-alpha.5

## 0.7.0-alpha.4

### Minor Changes

- 3663c96: Add map adapter system with MapLibre GL free tier - Phases 1 & 2 of geospatial visualization support

  **Phase 1: Map Adapter Interface and Registry**
  - Create MapAdapter interface following Image/Link/Router adapter pattern
  - Add map registry with setMapAdapter/getMapAdapter functions
  - Export map adapter types and utilities from @stackwright/core

  **Phase 2: MapLibre GL Implementation**
  - Create @stackwright/maplibre package with MapLibreAdapter
  - Support map initialization with center, zoom, pitch, bearing controls
  - Handle marker placement with simple format and GeoJSON FeatureCollections
  - Add camera animation for smooth transitions
  - Use MapLibre GL JS v4.7.1 for OSM-based vector tile rendering

  **Content Type Support**
  - Add MapContent schema with Zod validation
  - Support declarative map configuration through YAML content files
  - Generate JSON schema for MCP tool introspection

  **Examples**
  - Add comprehensive /maps showcase page to hellostackwright example
  - Demonstrate simple maps, markers, custom styles, animations, 3D terrain, and GeoJSON layers

  This establishes the foundation for pluggable map providers (MapLibre, Cesium, etc.) without coupling the core framework to any specific implementation. Phase 3 (Cesium ion integration) awaits OpenAPI work in pro repo.

### Patch Changes

- Updated dependencies [3663c96]
  - @stackwright/types@1.1.0-alpha.4

## 0.7.0-alpha.3

### Minor Changes

- e8dcbc0: Add text_block content type - a simpler alternative to main for heading + text + buttons without media-related fields. Perfect for text-heavy sections, announcements, and callouts within grid layouts.

### Patch Changes

- Updated dependencies [e8dcbc0]
  - @stackwright/types@1.1.0-alpha.3

## 0.7.0-alpha.2

### Patch Changes

- Updated dependencies [ec21b1f]
  - @stackwright/types@1.1.0-alpha.2

## 0.7.0-alpha.1

### Minor Changes

- a5b331f: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0-alpha.1

## 0.6.1-alpha.0

### Patch Changes

- Updated dependencies [87bd24d]
  - @stackwright/types@1.1.0-alpha.0

## 0.6.0

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

- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys
- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

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

- 8086e12: Add syntax highlighting to CodeBlock component using Prism.js. Supports JavaScript, TypeScript, Python, YAML, HTML, CSS, JSON, bash, JSX, and TSX with inline-styled tokens. Unsupported languages fall back gracefully to plain text.
- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool
  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool

### Patch Changes

- 8f052e1: Add Playwright E2E tests covering the full YAML → prebuild → Next.js build → browser pipeline. CI now runs smoke tests against the example app on every PR.
- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- ff06128: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
- a4c573a: Add keyboard navigation and accessibility to Carousel component. Arrow keys navigate between slides, proper ARIA attributes (role, aria-roledescription, aria-live, aria-label) support screen readers, and a visible focus indicator aids keyboard users.
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
- 2e78e6f: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.
- 2ce66eb: Fix layout regressions: MainContentGrid side-by-side layout, Carousel overflow card widths, and Media aspectRatio passthrough
- 1b2eef6: Fix mobile responsiveness for FeatureList, TestimonialGrid, MainContentGrid, TopAppBar, ContactFormStub, and CompressedMenu. Grid components now use `auto-fill minmax()` for natural responsive columns. MainContentGrid uses `flex-wrap` with `calc()`-adjusted flex-basis to maintain text/image split at desktop and stack vertically on narrow screens. TopAppBar shows a hamburger menu on mobile (`isSmDown`) via `useBreakpoints()`. CompressedMenu generalized to accept generic item types. Also fixes `useBreakpoints` hook to gracefully handle missing `window.matchMedia` in JSDOM/SSR environments.
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- 138b604: Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms. A built-in SSE server notifies the browser to auto-reload when content changes, enabling the live authoring loop where AI agents or humans can edit content and see changes appear without restarting the dev server or manually refreshing.
- fa497e1: Wire up theme spacing tokens to all components. Components now use `theme.spacing` values (xs through 2xl) from the theme config instead of hardcoded pixel values. Customizing spacing in your theme YAML now affects all component padding, margin, and gap values. Also adds spacing and typography to the `useSafeTheme` fallback so components work correctly outside a ThemeProvider.
- Updated dependencies [a6c3fcf]
- Updated dependencies [94d556a]
- Updated dependencies [ff06128]
- Updated dependencies [6820928]
- Updated dependencies [27c6083]
- Updated dependencies [62a97d5]
- Updated dependencies [7077f83]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [f1e4b70]
- Updated dependencies [2e78e6f]
- Updated dependencies [f0fbf0c]
- Updated dependencies [a5c1ff4]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
  - @stackwright/types@1.0.0
  - @stackwright/themes@0.5.0
  - @stackwright/collections@0.1.0

## 0.6.0-alpha.15

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

- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

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
  - @stackwright/collections@0.1.0-alpha.2
  - @stackwright/themes@0.5.0-alpha.4

## 0.6.0-alpha.14

### Minor Changes

- Version dependencies

### Patch Changes

- 8d1a637: Dependency updates
- Updated dependencies [8d1a637]
- Updated dependencies
  - @stackwright/types@0.4.0-alpha.6
  - @stackwright/themes@0.5.0-alpha.3

## 0.6.0-alpha.13

### Patch Changes

- 70f070c: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
- Updated dependencies [70f070c]
  - @stackwright/themes@0.4.2-alpha.2
  - @stackwright/types@0.4.0-alpha.5

## 0.6.0-alpha.12

### Patch Changes

- 717f530: Wire up theme spacing tokens to all components. Components now use `theme.spacing` values (xs through 2xl) from the theme config instead of hardcoded pixel values. Customizing spacing in your theme YAML now affects all component padding, margin, and gap values. Also adds spacing and typography to the `useSafeTheme` fallback so components work correctly outside a ThemeProvider.

## 0.6.0-alpha.11

### Patch Changes

- 77836f7: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.
- Updated dependencies [77836f7]
  - @stackwright/themes@0.4.2-alpha.1
  - @stackwright/types@0.4.0-alpha.4

## 0.6.0-alpha.10

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/types@0.4.0-alpha.3
  - @stackwright/themes@0.4.2-alpha.0

## 0.6.0-alpha.9

### Patch Changes

- d1ecb6b: Add `--watch` mode to `stackwright-prebuild` for hot recompilation of YAML content and co-located images during development. Changes to page content files, site config, and images are detected via `fs.watch` and trigger an automatic rebuild within ~150ms. A built-in SSE server notifies the browser to auto-reload when content changes, enabling the live authoring loop where AI agents or humans can edit content and see changes appear without restarting the dev server or manually refreshing.

## 0.6.0-alpha.8

### Minor Changes

- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool
  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool

## 0.6.0-alpha.7

### Patch Changes

- a4c573a: Add keyboard navigation and accessibility to Carousel component. Arrow keys navigate between slides, proper ARIA attributes (role, aria-roledescription, aria-live, aria-label) support screen readers, and a visible focus indicator aids keyboard users.

## 0.6.0-alpha.6

### Minor Changes

- 8086e12: Add syntax highlighting to CodeBlock component using Prism.js. Supports JavaScript, TypeScript, Python, YAML, HTML, CSS, JSON, bash, JSX, and TSX with inline-styled tokens. Unsupported languages fall back gracefully to plain text.

## 0.6.0-alpha.5

### Patch Changes

- 1b2eef6: Fix mobile responsiveness for FeatureList, TestimonialGrid, MainContentGrid, TopAppBar, ContactFormStub, and CompressedMenu. Grid components now use `auto-fill minmax()` for natural responsive columns. MainContentGrid uses `flex-wrap` with `calc()`-adjusted flex-basis to maintain text/image split at desktop and stack vertically on narrow screens. TopAppBar shows a hamburger menu on mobile (`isSmDown`) via `useBreakpoints()`. CompressedMenu generalized to accept generic item types. Also fixes `useBreakpoints` hook to gracefully handle missing `window.matchMedia` in JSDOM/SSR environments.

## 0.6.0-alpha.4

### Minor Changes

- 62a97d5: Add error handling for unknown content types: visible inline warnings instead of silent nulls, item-level error boundaries, and prebuild detection of unrecognized content type keys

### Patch Changes

- Updated dependencies [62a97d5]
  - @stackwright/types@0.4.0-alpha.2

## 0.6.0-alpha.3

### Minor Changes

- a6c3fcf: Add alert/admonition content type with info, warning, success, danger, note, and tip variants. Replaces the dead Callout component with a proper implementation including Zod schema, themed React component, severity icons, unit tests, and example usage.

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1

## 0.5.2-alpha.2

### Patch Changes

- 8f052e1: Add Playwright E2E tests covering the full YAML → prebuild → Next.js build → browser pipeline. CI now runs smoke tests against the example app on every PR.

## 0.5.2-alpha.1

### Patch Changes

- 2ce66eb: Fix layout regressions: MainContentGrid side-by-side layout, Carousel overflow card widths, and Media aspectRatio passthrough

## 0.5.2-alpha.0

### Patch Changes

- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0

## 0.5.1

### Patch Changes

- Updated dependencies
  - @stackwright/themes@0.4.1
  - @stackwright/types@0.3.1

## 0.5.0

### Minor Changes

- 2643e8b: Add `registerContentType(key, schema, component)` API for first-class content type extensibility. A single call in `_app.tsx` registers both the React component and its Zod schema — no framework source modifications needed. Custom types render through the existing pipeline; invalid props are warned in development. `getRegisteredContentTypes()` and `getContentTypeSchema()` are exported for MCP and CLI introspection.

### Patch Changes

- 750f84a: Patch bump for core package import fixes.
- 7587c14: fix(core): clearContentTypeRegistry now also deregisters components from componentRegistry, eliminating the need for manual `delete componentRegistry[key]` workarounds in tests
- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [1c35939]
  - @stackwright/themes@0.4.0
  - @stackwright/types@0.3.0

## 0.5.0-alpha.3

### Patch Changes

- Updated dependencies [ce372ed]
  - @stackwright/types@0.3.0-alpha.2

## 0.5.0-alpha.2

### Patch Changes

- 7587c14: fix(core): clearContentTypeRegistry now also deregisters components from componentRegistry, eliminating the need for manual `delete componentRegistry[key]` workarounds in tests

## 0.5.0-alpha.1

### Minor Changes

- 2643e8b: Add `registerContentType(key, schema, component)` API for first-class content type extensibility. A single call in `_app.tsx` registers both the React component and its Zod schema — no framework source modifications needed. Custom types render through the existing pipeline; invalid props are warned in development. `getRegisteredContentTypes()` and `getContentTypeSchema()` are exported for MCP and CLI introspection.

### Patch Changes

- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0-alpha.1
  - @stackwright/themes@0.4.0-alpha.1

## 0.4.4-alpha.0

### Patch Changes

- Patch bump for core package import fixes.
- Updated dependencies
  - @stackwright/themes@0.3.4-alpha.0
  - @stackwright/types@0.2.3-alpha.0

## 0.4.3

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

## 0.4.3-alpha.0

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

## 0.4.2

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

## 0.4.2-alpha.0

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

## 0.4.1

### Patch Changes

- 4c964f1: fix(sprint2): reliability and silent failure modes
  - Add React error boundary to `DynamicPage` so a single bad component
    shows degraded UI instead of crashing the whole page
  - Move `ShimmerOverlay` styled component to module scope in `DynamicPage`
    to prevent a new CSS class being generated on every render
  - Fix image filename collisions in prebuild: include the slug in the
    destination path so pages with identically-named images no longer
    silently overwrite each other in `public/images/`

## 0.4.0

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
- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- 51dbbc9: Refactor types out of core into own package.
- f195337: Adding test dependencies to all packages.
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

- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
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
- Updated dependencies [ae26492]
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1
  - @stackwright/types@0.2.0

## 0.3.1-alpha.6

### Patch Changes

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

## 0.3.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/themes@0.3.1-alpha.5
  - @stackwright/types@0.1.1-alpha.4

## 0.3.1-alpha.4

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1-alpha.4
  - @stackwright/types@0.1.1-alpha.3

## 0.3.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/themes@0.3.1-alpha.3
  - @stackwright/types@0.1.1-alpha.2

## 0.3.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/themes@0.3.1-alpha.2
  - @stackwright/types@0.1.1-alpha.1

## 0.3.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/themes@0.3.1-alpha.1
  - @stackwright/types@0.1.1-alpha.0

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

## 0.2.2

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
- Updated dependencies [78a02d1]
- Updated dependencies [d66fda6]
  - @stackwright/themes@0.2.1

## 0.2.1

### Patch Changes

- dcbbb62: Fixing MUI Grid import issues for down stream applications
