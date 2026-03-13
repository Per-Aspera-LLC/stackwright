# @stackwright/core

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
