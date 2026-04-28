# @stackwright/icons

## 0.5.1-alpha.0

### Patch Changes

- c036f5b: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

## 0.5.0

### Minor Changes

- 8f34fd6: Register the full Lucide icon set (~1,500+ icons) by default. `registerDefaultIcons()` now includes every Lucide icon — YAML authors can use any icon by PascalCase name without code changes. Added `registerAllLucideIcons()` and `lucideAllIconsPreset` exports. The curated ~40-icon preset remains available via `registerLucideIcons()` for bundle-conscious apps.

### Patch Changes

- 8f34fd6: Add Code2 and Layout icons to Lucide preset for docs site compatibility
- 46df0c5: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

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

## 0.4.1-alpha.0

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

## 0.4.0

### Minor Changes

- 06e97c0: Register the full Lucide icon set (~1,500+ icons) by default. `registerDefaultIcons()` now includes every Lucide icon — YAML authors can use any icon by PascalCase name without code changes. Added `registerAllLucideIcons()` and `lucideAllIconsPreset` exports. The curated ~40-icon preset remains available via `registerLucideIcons()` for bundle-conscious apps.

### Patch Changes

- e00084f: Add Code2 and Layout icons to Lucide preset for docs site compatibility

## 0.4.0-alpha.1

### Patch Changes

- 5c3999d: Add Code2 and Layout icons to Lucide preset for docs site compatibility

## 0.4.0-alpha.0

### Minor Changes

- 06e97c0: Register the full Lucide icon set (~1,500+ icons) by default. `registerDefaultIcons()` now includes every Lucide icon — YAML authors can use any icon by PascalCase name without code changes. Added `registerAllLucideIcons()` and `lucideAllIconsPreset` exports. The curated ~40-icon preset remains available via `registerLucideIcons()` for bundle-conscious apps.

## 0.3.0

### Patch Changes

- a6c3fcf: Add alert/admonition content type with info, warning, success, danger, note, and tip variants. Replaces the dead Callout component with a proper implementation including Zod schema, themed React component, severity icons, unit tests, and example usage.
- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- ff06128: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
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

- f1e4b70: Dependency updates
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.

## 0.3.0-alpha.4

### Patch Changes

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

- 8d1a637: Dependency updates
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.

## 0.3.0-alpha.3

### Minor Changes

- Version dependencies

### Patch Changes

- 8d1a637: Dependency updates

## 0.2.4-alpha.2

### Patch Changes

- 70f070c: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).

## 0.2.4-alpha.1

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.

## 0.2.4-alpha.0

### Patch Changes

- a6c3fcf: Add alert/admonition content type with info, warning, success, danger, note, and tip variants. Replaces the dead Callout component with a proper implementation including Zod schema, themed React component, severity icons, unit tests, and example usage.

## 0.2.3

### Patch Changes

- 750f84a: Patch bump for core package import fixes.

## 0.2.3-alpha.0

### Patch Changes

- Patch bump for core package import fixes.

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
