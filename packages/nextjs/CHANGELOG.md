# @stackwright/nextjs

## 0.4.0

### Minor Changes

- 46df0c5: Add security headers (CSP, HSTS, COOP/CORP/COEP) to Next.js integration with customizable configuration

### Patch Changes

- 46df0c5: chore: consolidate dependabot dependency updates
  - `lucide-react`: `^0.525.0` → `^1.8.0` (icons, ui-shadcn) — includes icon rename fixes for v1 API (`CheckCircle` → `CircleCheck`, `Code2`/`Layout` backward-compat aliases)
  - `@swc/core`: `^1.15.18` → `^1.15.26` (core, nextjs)
  - `jsdom`: `^28.1.0` → `^29.0.2` (maplibre)
  - `react-dom`: `19.2.4` → `19.2.5` (pnpm.overrides)
  - `prettier`: `^3.8.1` → `^3.8.3` (devDependencies)

- Updated dependencies [f365749]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [199ca1c]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [115c658]
- Updated dependencies [199ca1c]
- Updated dependencies [46df0c5]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/types@1.2.0
  - @stackwright/core@0.8.0
  - @stackwright/themes@0.5.2

## 0.3.2-alpha.1

### Patch Changes

- Updated dependencies [115c658]
  - @stackwright/core@0.7.1-alpha.1

## 0.3.2-alpha.0

### Patch Changes

- Updated dependencies [8f34fd6]
  - @stackwright/core@0.7.1-alpha.0

## 0.3.1

### Patch Changes

- Updated dependencies [f5d7ec2]
- Updated dependencies [f714fff]
- Updated dependencies [6cda0f0]
- Updated dependencies [53623f6]
- Updated dependencies [b14b0d2]
- Updated dependencies [b14b0d2]
- Updated dependencies [a662f0c]
- Updated dependencies [6cda0f0]
- Updated dependencies [b14b0d2]
- Updated dependencies [a5b331f]
  - @stackwright/core@0.7.0
  - @stackwright/types@1.1.0
  - @stackwright/themes@0.5.1

## 0.3.1-alpha.7

### Patch Changes

- Updated dependencies [167b5bb]
  - @stackwright/core@0.7.0-alpha.7

## 0.3.1-alpha.6

### Patch Changes

- Updated dependencies [02638c9]
- Updated dependencies [a662f0c]
  - @stackwright/core@0.7.0-alpha.6
  - @stackwright/types@1.1.0-alpha.6

## 0.3.1-alpha.5

### Patch Changes

- Updated dependencies [6cda0f0]
- Updated dependencies [6cda0f0]
  - @stackwright/core@0.7.0-alpha.5
  - @stackwright/themes@0.5.1-alpha.0
  - @stackwright/types@1.1.0-alpha.5

## 0.3.1-alpha.4

### Patch Changes

- Updated dependencies [3663c96]
  - @stackwright/core@0.7.0-alpha.4
  - @stackwright/types@1.1.0-alpha.4

## 0.3.1-alpha.3

### Patch Changes

- Updated dependencies [e8dcbc0]
  - @stackwright/types@1.1.0-alpha.3
  - @stackwright/core@0.7.0-alpha.3

## 0.3.1-alpha.2

### Patch Changes

- Updated dependencies [ec21b1f]
  - @stackwright/types@1.1.0-alpha.2
  - @stackwright/core@0.7.0-alpha.2

## 0.3.1-alpha.1

### Patch Changes

- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0-alpha.1
  - @stackwright/core@0.7.0-alpha.1

## 0.3.1-alpha.0

### Patch Changes

- Updated dependencies [87bd24d]
  - @stackwright/types@1.1.0-alpha.0
  - @stackwright/core@0.6.1-alpha.0

## 0.3.0

### Minor Changes

- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

- c2f7867: feat: page-level SEO metadata from YAML (#164)

  Add `meta` block to page content and site config for `<title>`, `<meta description>`, Open Graph tags, canonical URLs, and noindex control. Metadata resolves with page-level overrides falling back to site-level defaults, with auto-generated titles from the first content heading. The `NextStackwrightHead` adapter renders tags via `next/head`; if no Head adapter is registered, SEO tags are silently omitted (graceful degradation). Image co-location works for `og_image` paths with zero special handling. 26 new test cases across core and nextjs packages.

### Patch Changes

- 94d556a: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- ff06128: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
- 2e78e6f: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.
- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
- Updated dependencies [a6c3fcf]
- Updated dependencies [8f052e1]
- Updated dependencies [94d556a]
- Updated dependencies [ff06128]
- Updated dependencies [a4c573a]
- Updated dependencies [6820928]
- Updated dependencies [27c6083]
- Updated dependencies [62a97d5]
- Updated dependencies [7077f83]
- Updated dependencies [505002f]
- Updated dependencies [c0fc647]
- Updated dependencies [f1e4b70]
- Updated dependencies [2e78e6f]
- Updated dependencies [f0fbf0c]
- Updated dependencies [2ce66eb]
- Updated dependencies [1b2eef6]
- Updated dependencies [a5c1ff4]
- Updated dependencies [138b604]
- Updated dependencies [b1f3a30]
- Updated dependencies [c2f7867]
- Updated dependencies [8086e12]
- Updated dependencies [fa497e1]
- Updated dependencies [163e3b1]
  - @stackwright/types@1.0.0
  - @stackwright/core@0.6.0
  - @stackwright/themes@0.5.0

## 0.3.0-alpha.15

### Minor Changes

- 7077f83: First-class cookie & preference persistence support (#162)
  - **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
  - **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
  - **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.

- c2f7867: feat: page-level SEO metadata from YAML (#164)

  Add `meta` block to page content and site config for `<title>`, `<meta description>`, Open Graph tags, canonical URLs, and noindex control. Metadata resolves with page-level overrides falling back to site-level defaults, with auto-generated titles from the first content heading. The `NextStackwrightHead` adapter renders tags via `next/head`; if no Head adapter is registered, SEO tags are silently omitted (graceful degradation). Image co-location works for `og_image` paths with zero special handling. 26 new test cases across core and nextjs packages.

### Patch Changes

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
  - @stackwright/core@0.6.0-alpha.15
  - @stackwright/themes@0.5.0-alpha.4

## 0.3.0-alpha.14

### Minor Changes

- Version dependencies

### Patch Changes

- Updated dependencies [8d1a637]
- Updated dependencies
  - @stackwright/types@0.4.0-alpha.6
  - @stackwright/core@0.6.0-alpha.14

## 0.2.8-alpha.13

### Patch Changes

- 70f070c: Add 87 unit tests across four packages that previously had zero or incomplete test coverage. Covers the Next.js adapter layer (Image, Link, Router, config), icon registry and presets, ThemeProvider and CSS variable injection, and five core content type components (IconGrid, TextGrid, Timeline, TabbedContentGrid, UnknownContentType).
- Updated dependencies [70f070c]
  - @stackwright/core@0.6.0-alpha.13
  - @stackwright/types@0.4.0-alpha.5

## 0.2.8-alpha.12

### Patch Changes

- Updated dependencies [717f530]
  - @stackwright/core@0.6.0-alpha.12

## 0.2.8-alpha.11

### Patch Changes

- 77836f7: Remove unconditional console.log calls from NextStackwrightImage and ThemeLoader, fix aspect_ratio DOM prop leak, and clean up Carousel setTimeout on unmount.
- Updated dependencies [77836f7]
  - @stackwright/core@0.6.0-alpha.11
  - @stackwright/types@0.4.0-alpha.4

## 0.2.8-alpha.10

### Patch Changes

- 681d5d4: Add monorepo-wide ESLint and Prettier with CI enforcement. Auto-formatted all source files to consistent style. No runtime behavior changes.
- Updated dependencies [681d5d4]
  - @stackwright/core@0.6.0-alpha.10
  - @stackwright/types@0.4.0-alpha.3

## 0.2.8-alpha.9

### Patch Changes

- Updated dependencies [d1ecb6b]
  - @stackwright/core@0.6.0-alpha.9

## 0.2.8-alpha.8

### Patch Changes

- Updated dependencies [163e3b1]
  - @stackwright/core@0.6.0-alpha.8

## 0.2.8-alpha.7

### Patch Changes

- Updated dependencies [a4c573a]
  - @stackwright/core@0.6.0-alpha.7

## 0.2.8-alpha.6

### Patch Changes

- Updated dependencies [8086e12]
  - @stackwright/core@0.6.0-alpha.6

## 0.2.8-alpha.5

### Patch Changes

- Updated dependencies [1b2eef6]
  - @stackwright/core@0.6.0-alpha.5

## 0.2.8-alpha.4

### Patch Changes

- Updated dependencies [62a97d5]
  - @stackwright/core@0.6.0-alpha.4
  - @stackwright/types@0.4.0-alpha.2

## 0.2.8-alpha.3

### Patch Changes

- Updated dependencies [a6c3fcf]
  - @stackwright/types@0.4.0-alpha.1
  - @stackwright/core@0.6.0-alpha.3

## 0.2.8-alpha.2

### Patch Changes

- Updated dependencies [8f052e1]
  - @stackwright/core@0.5.2-alpha.2

## 0.2.8-alpha.1

### Patch Changes

- Updated dependencies [2ce66eb]
  - @stackwright/core@0.5.2-alpha.1

## 0.2.8-alpha.0

### Patch Changes

- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0
  - @stackwright/core@0.5.2-alpha.0

## 0.2.7

### Patch Changes

- @stackwright/core@0.5.1
- @stackwright/types@0.3.1

## 0.2.6

### Patch Changes

- 750f84a: Patch bump for core package import fixes.
- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [7587c14]
- Updated dependencies [2643e8b]
- Updated dependencies [1c35939]
  - @stackwright/types@0.3.0
  - @stackwright/core@0.5.0

## 0.2.6-alpha.3

### Patch Changes

- Updated dependencies [ce372ed]
  - @stackwright/types@0.3.0-alpha.2
  - @stackwright/core@0.5.0-alpha.3

## 0.2.6-alpha.2

### Patch Changes

- Updated dependencies [7587c14]
  - @stackwright/core@0.5.0-alpha.2

## 0.2.6-alpha.1

### Patch Changes

- Updated dependencies [2643e8b]
- Updated dependencies [1c35939]
  - @stackwright/core@0.5.0-alpha.1
  - @stackwright/types@0.3.0-alpha.1

## 0.2.6-alpha.0

### Patch Changes

- Patch bump for core package import fixes.
- Updated dependencies
  - @stackwright/types@0.2.3-alpha.0
  - @stackwright/core@0.4.4-alpha.0

## 0.2.5

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
  - @stackwright/core@0.4.3
  - @stackwright/types@0.2.2

## 0.2.5-alpha.0

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
  - @stackwright/core@0.4.3-alpha.0
  - @stackwright/types@0.2.2-alpha.0

## 0.2.4

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
  - @stackwright/core@0.4.2
  - @stackwright/types@0.2.1

## 0.2.4-alpha.0

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
  - @stackwright/core@0.4.2-alpha.0
  - @stackwright/types@0.2.1-alpha.0

## 0.2.3

### Patch Changes

- fef2637: Raise minimum Next.js peer dependency from `>=15` to `>=15.2.3` to exclude versions with critical CVEs (authorization bypass in middleware, RCE in React flight protocol).

## 0.2.2

### Patch Changes

- Updated dependencies [4c964f1]
  - @stackwright/core@0.4.1

## 0.2.1

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
- Updated dependencies [8910585]
- Updated dependencies [5ff20a6]
- Updated dependencies [46df7ac]
- Updated dependencies [e4fbf2f]
- Updated dependencies [ae26492]
- Updated dependencies [cc761ce]
  - @stackwright/types@0.2.0
  - @stackwright/core@0.4.0

## 0.2.1-alpha.6

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

- Updated dependencies [8910585]
  - @stackwright/core@0.3.1-alpha.6

## 0.2.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/core@0.3.1-alpha.5

## 0.2.1-alpha.4

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/core@0.3.1-alpha.4

## 0.2.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/core@0.3.1-alpha.3

## 0.2.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/core@0.3.1-alpha.2

## 0.2.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/core@0.3.1-alpha.1

## 0.2.1-alpha.0

### Patch Changes

- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
  - @stackwright/core@0.3.1-alpha.0

## 0.1.2

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
- Updated dependencies [78a02d1]
- Updated dependencies [d66fda6]
  - @stackwright/core@0.2.2

## 0.1.1

### Patch Changes

- Updated dependencies [dcbbb62]
  - @stackwright/core@0.2.1
