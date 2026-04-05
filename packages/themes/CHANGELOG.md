# @stackwright/themes

## 0.5.1

### Patch Changes

- 6cda0f0: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)

## 0.5.1-alpha.0

### Patch Changes

- 6cda0f0: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)

## 0.5.0

### Minor Changes

- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

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

### Patch Changes

- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- ff06128: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
- 2e78e6f: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.
- f0fbf0c: Fix hydration mismatch in ThemeProvider color mode initialisation. The server always rendered light mode but the client could initialise to dark mode from the ColorModeScript DOM attribute, causing a React hydration error. Now both server and client start with light mode and the real preference is synced via useLayoutEffect before the browser paints.
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.

## 0.5.0-alpha.4

### Minor Changes

- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

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

### Patch Changes

- f0fbf0c: Fix hydration mismatch in ThemeProvider color mode initialisation. The server always rendered light mode but the client could initialise to dark mode from the ColorModeScript DOM attribute, causing a React hydration error. Now both server and client start with light mode and the real preference is synced via useLayoutEffect before the browser paints.
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.

## 0.5.0-alpha.3

### Minor Changes

- Version dependencies

## 0.4.2-alpha.2

### Patch Changes

- 70f070c: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).

## 0.4.2-alpha.1

### Patch Changes

- 77836f7: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.

## 0.4.2-alpha.0

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.

## 0.4.1

### Patch Changes

- Fix broken 0.4.0 publish: add missing `files` field so only `dist/` is included in the npm tarball. Without it, `src/` was included and consumers resolved the broken multi-file structure instead of the bundled output, causing `themeSchema` to not be exported.

## 0.4.0

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- 750f84a: Patch bump for core package import fixes.

## 0.4.0-alpha.1

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

## 0.3.4-alpha.0

### Patch Changes

- Patch bump for core package import fixes.

## 0.3.3

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor
  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

## 0.3.3-alpha.0

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor
  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

## 0.3.2

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

## 0.3.2-alpha.0

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

## 0.3.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core

## 0.3.1-alpha.4

### Patch Changes

- cc761ce: More version updates

## 0.3.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies

## 0.3.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates

## 0.3.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.

## 0.3.1-alpha.0

### Patch Changes

- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup

## 0.2.1

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
