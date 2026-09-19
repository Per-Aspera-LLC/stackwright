# @stackwright/themes

## 0.10.0

### Minor Changes

- 8632e98: Foreground color slots, alias-safe `resolveColor()`, and a build-time guard
  against unresolvable `stackwright.yml` color references (stackwright-819 /
  swp-rlih).

  Root cause: `colorsSchema` was a strict 7-key object, so a legal
  Pro-generated token like `appBar.textColor: primary-foreground` was
  silently stripped during validation instead of being rejected or resolved.
  `resolveColor()` then fell through (`themeColors[colorValue] || colorValue`)
  and returned the raw, unparseable string, which the browser ignored —
  producing inherited/default text color on top of a themed background (a
  1.43:1 contrast failure on every authenticated route in the field case).

  **`@stackwright/themes` (minor — new optional schema fields, non-breaking):**
  - `colorsSchema` gains 5 optional foreground slots: `primaryForeground`,
    `secondaryForeground`, `accentForeground`, `surfaceForeground`,
    `backgroundForeground`. Existing 7-key configs continue to validate
    unchanged.
  - New `withDerivedForegrounds(colors)` fills in any missing foreground slot
    with a WCAG-AA-contrast-safe default computed against its base color
    (`primary` -> `primaryForeground`, etc.), without overriding explicit
    slots.
  - `ThemeProvider`'s `themeToCSSVars` now emits 5 additional CSS custom
    properties (`--sw-color-primary-foreground`, `--sw-color-bg-foreground`,
    etc.) for both light and dark palettes.
  - New single-source-of-truth exports: `THEME_COLOR_KEYS`,
    `REQUIRED_THEME_COLOR_KEYS`, `FOREGROUND_THEME_COLOR_KEYS`,
    `FOREGROUND_TO_BASE_KEY`, `KEBAB_COLOR_ALIASES`.

  **`@stackwright/core` (patch):**
  - `resolveColor(colorValue, themeColors, opts?)` now accepts kebab-case
    aliases (`primary-foreground`, `bg`, `text-secondary`, ...), derives
    absent foreground slots on the fly, and — critically — **never returns
    the raw input string for an unrecognized token**. It warns once per
    token and falls back to a contrast-safe hex, using `opts.background`
    when the caller has one.
  - All internal callers (`TopAppBar`, `BottomAppBar`, `NavSidebar`,
    `CollectionList`, `ThemedButton`, and the base content-block grids) now
    pass their resolved background through `opts.background` so the
    contrast-safe fallback is actually informed by what's behind the text.

  **`@stackwright/build-scripts` (patch):**
  - New build-time guard: `stackwright.yml`'s `appBar`/`footer`/`sidebar`
    `textColor`/`backgroundColor` fields are validated against hex colors,
    `ThemeColors` keys + kebab aliases, and any additional `--sw-color-*`
    tokens declared in the project's compiled `_theme-tokens.css` (if one
    exists). An unrecognized token is now a **BUILD-FATAL** error naming the
    offending config path, the value, and the full allowed list — instead of
    silently reaching the browser as invalid CSS. Runs from `compileSite()`,
    so it covers both `stackwright-prebuild` and `stackwright-prebuild
--watch`.

## 0.9.0

### Minor Changes

- 54a490b: feat: split-file config — compile primitives + defaultColorMode (swp-xyia)

  ## What changed

  ### `@stackwright/types`
  - New `stackwrightThemeFileSchema` — Zod schema for `stackwright.theme.yml` (`themeName`, `customTheme`, `fonts`, `defaultColorMode`)
  - New `StackwrightThemeFile` TypeScript type
  - `PrebuildPlugin` gains optional `additionalSinks` field — array of named compile sinks that Pro plugins use to emit `_collections.json`, `_auth.json`, `_integrations.json`

  ### `@stackwright/themes`
  - `themeConfigSchema` gains optional `defaultColorMode: z.enum(['light', 'dark', 'system'])`
  - `ThemeProvider` `initialColorMode` prop (already accepted) is now the documented seeding mechanism for `defaultColorMode`

  ### `@stackwright/build-scripts`
  - **`_theme.json` emitted as a separate sink** (no longer merged into `_site.json`)
  - Refactored into `compile/` sub-directory with individually-callable primitives:
    - `compileSite(ctx)`, `compileTheme(ctx)`, `compilePages(ctx)`, `compilePage(slug, ctx)`, `compileIcons(ctx)`, `compileFonts(ctx)`, `compileFileCollections(ctx)`
    - `compileAll(ctx)` — runs all in topological order including plugin `additionalSinks`
    - `createCompileContext(opts)` — builds a `CompileContext` from `PrebuildOptions`
  - `runPrebuild()` remains as a thin wrapper — no breaking change
  - Path 1: `stackwright.theme.yml` → validates, emits `_theme.json`
  - Path 2: no theme file → extracts `{themeName, customTheme, fonts, defaultColorMode}` from `stackwright.yml` root, emits `_theme.json` silently
  - Path 3: no theme info → emits `_theme.json: {}`

  ### `@stackwright/nextjs`
  - `StackwrightLayout` reads `_theme.json` at render time via `getThemeFile()`
  - Passes `_theme.json.defaultColorMode` as `fallback` to `ColorModeScript` (previously hardcoded `'system'`)
  - Falls back to `_site.json.customTheme` backgrounds when `_theme.json` has no `customTheme` (backcompat for legacy setups)

  ### `@stackwright/core`
  - `DynamicPage` reads `theme.defaultColorMode` and passes it as `initialColorMode` to `ThemeProvider`
  - Ensures the initial server render matches the `ColorModeScript` fallback — no color-mode flash for `defaultColorMode: dark` projects

  ## Upgrade guide

  **Projects with `stackwright.theme.yml`:** No action required. `_theme.json` is emitted automatically.

  **Projects with inline `customTheme` in `stackwright.yml`:** No action required. Path 2 extracts theme keys silently. `_site.json` still contains the legacy keys until Bead 4 (a future release) strips them.

  **To opt into a non-system default color mode:**

  ```yaml
  # stackwright.theme.yml
  defaultColorMode: dark # first-time visitors see dark mode
  ```

### Patch Changes

- ad123cd: Fix white flash during dark mode page transitions

  The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

  At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.

## 0.8.0

### Minor Changes

- 97da06f: feat: split-file config — compile primitives + defaultColorMode (swp-xyia)

  ## What changed

  ### `@stackwright/types`
  - New `stackwrightThemeFileSchema` — Zod schema for `stackwright.theme.yml` (`themeName`, `customTheme`, `fonts`, `defaultColorMode`)
  - New `StackwrightThemeFile` TypeScript type
  - `PrebuildPlugin` gains optional `additionalSinks` field — array of named compile sinks that Pro plugins use to emit `_collections.json`, `_auth.json`, `_integrations.json`

  ### `@stackwright/themes`
  - `themeConfigSchema` gains optional `defaultColorMode: z.enum(['light', 'dark', 'system'])`
  - `ThemeProvider` `initialColorMode` prop (already accepted) is now the documented seeding mechanism for `defaultColorMode`

  ### `@stackwright/build-scripts`
  - **`_theme.json` emitted as a separate sink** (no longer merged into `_site.json`)
  - Refactored into `compile/` sub-directory with individually-callable primitives:
    - `compileSite(ctx)`, `compileTheme(ctx)`, `compilePages(ctx)`, `compilePage(slug, ctx)`, `compileIcons(ctx)`, `compileFonts(ctx)`, `compileFileCollections(ctx)`
    - `compileAll(ctx)` — runs all in topological order including plugin `additionalSinks`
    - `createCompileContext(opts)` — builds a `CompileContext` from `PrebuildOptions`
  - `runPrebuild()` remains as a thin wrapper — no breaking change
  - Path 1: `stackwright.theme.yml` → validates, emits `_theme.json`
  - Path 2: no theme file → extracts `{themeName, customTheme, fonts, defaultColorMode}` from `stackwright.yml` root, emits `_theme.json` silently
  - Path 3: no theme info → emits `_theme.json: {}`

  ### `@stackwright/nextjs`
  - `StackwrightLayout` reads `_theme.json` at render time via `getThemeFile()`
  - Passes `_theme.json.defaultColorMode` as `fallback` to `ColorModeScript` (previously hardcoded `'system'`)
  - Falls back to `_site.json.customTheme` backgrounds when `_theme.json` has no `customTheme` (backcompat for legacy setups)

  ### `@stackwright/core`
  - `DynamicPage` reads `theme.defaultColorMode` and passes it as `initialColorMode` to `ThemeProvider`
  - Ensures the initial server render matches the `ColorModeScript` fallback — no color-mode flash for `defaultColorMode: dark` projects

  ## Upgrade guide

  **Projects with `stackwright.theme.yml`:** No action required. `_theme.json` is emitted automatically.

  **Projects with inline `customTheme` in `stackwright.yml`:** No action required. Path 2 extracts theme keys silently. `_site.json` still contains the legacy keys until Bead 4 (a future release) strips them.

  **To opt into a non-system default color mode:**

  ```yaml
  # stackwright.theme.yml
  defaultColorMode: dark # first-time visitors see dark mode
  ```

### Patch Changes

- 97da06f: Fix white flash during dark mode page transitions

  The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

  At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.

## 0.7.0

### Minor Changes

- 4e10537: feat: split-file config — compile primitives + defaultColorMode (swp-xyia)

  ## What changed

  ### `@stackwright/types`
  - New `stackwrightThemeFileSchema` — Zod schema for `stackwright.theme.yml` (`themeName`, `customTheme`, `fonts`, `defaultColorMode`)
  - New `StackwrightThemeFile` TypeScript type
  - `PrebuildPlugin` gains optional `additionalSinks` field — array of named compile sinks that Pro plugins use to emit `_collections.json`, `_auth.json`, `_integrations.json`

  ### `@stackwright/themes`
  - `themeConfigSchema` gains optional `defaultColorMode: z.enum(['light', 'dark', 'system'])`
  - `ThemeProvider` `initialColorMode` prop (already accepted) is now the documented seeding mechanism for `defaultColorMode`

  ### `@stackwright/build-scripts`
  - **`_theme.json` emitted as a separate sink** (no longer merged into `_site.json`)
  - Refactored into `compile/` sub-directory with individually-callable primitives:
    - `compileSite(ctx)`, `compileTheme(ctx)`, `compilePages(ctx)`, `compilePage(slug, ctx)`, `compileIcons(ctx)`, `compileFonts(ctx)`, `compileFileCollections(ctx)`
    - `compileAll(ctx)` — runs all in topological order including plugin `additionalSinks`
    - `createCompileContext(opts)` — builds a `CompileContext` from `PrebuildOptions`
  - `runPrebuild()` remains as a thin wrapper — no breaking change
  - Path 1: `stackwright.theme.yml` → validates, emits `_theme.json`
  - Path 2: no theme file → extracts `{themeName, customTheme, fonts, defaultColorMode}` from `stackwright.yml` root, emits `_theme.json` silently
  - Path 3: no theme info → emits `_theme.json: {}`

  ### `@stackwright/nextjs`
  - `StackwrightLayout` reads `_theme.json` at render time via `getThemeFile()`
  - Passes `_theme.json.defaultColorMode` as `fallback` to `ColorModeScript` (previously hardcoded `'system'`)
  - Falls back to `_site.json.customTheme` backgrounds when `_theme.json` has no `customTheme` (backcompat for legacy setups)

  ### `@stackwright/core`
  - `DynamicPage` reads `theme.defaultColorMode` and passes it as `initialColorMode` to `ThemeProvider`
  - Ensures the initial server render matches the `ColorModeScript` fallback — no color-mode flash for `defaultColorMode: dark` projects

  ## Upgrade guide

  **Projects with `stackwright.theme.yml`:** No action required. `_theme.json` is emitted automatically.

  **Projects with inline `customTheme` in `stackwright.yml`:** No action required. Path 2 extracts theme keys silently. `_site.json` still contains the legacy keys until Bead 4 (a future release) strips them.

  **To opt into a non-system default color mode:**

  ```yaml
  # stackwright.theme.yml
  defaultColorMode: dark # first-time visitors see dark mode
  ```

### Patch Changes

- 4e10537: Fix white flash during dark mode page transitions

  The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

  At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.

## 0.7.0-alpha.0

### Minor Changes

- 98bc1f7: feat: split-file config — compile primitives + defaultColorMode (swp-xyia)

  ## What changed

  ### `@stackwright/types`
  - New `stackwrightThemeFileSchema` — Zod schema for `stackwright.theme.yml` (`themeName`, `customTheme`, `fonts`, `defaultColorMode`)
  - New `StackwrightThemeFile` TypeScript type
  - `PrebuildPlugin` gains optional `additionalSinks` field — array of named compile sinks that Pro plugins use to emit `_collections.json`, `_auth.json`, `_integrations.json`

  ### `@stackwright/themes`
  - `themeConfigSchema` gains optional `defaultColorMode: z.enum(['light', 'dark', 'system'])`
  - `ThemeProvider` `initialColorMode` prop (already accepted) is now the documented seeding mechanism for `defaultColorMode`

  ### `@stackwright/build-scripts`
  - **`_theme.json` emitted as a separate sink** (no longer merged into `_site.json`)
  - Refactored into `compile/` sub-directory with individually-callable primitives:
    - `compileSite(ctx)`, `compileTheme(ctx)`, `compilePages(ctx)`, `compilePage(slug, ctx)`, `compileIcons(ctx)`, `compileFonts(ctx)`, `compileFileCollections(ctx)`
    - `compileAll(ctx)` — runs all in topological order including plugin `additionalSinks`
    - `createCompileContext(opts)` — builds a `CompileContext` from `PrebuildOptions`
  - `runPrebuild()` remains as a thin wrapper — no breaking change
  - Path 1: `stackwright.theme.yml` → validates, emits `_theme.json`
  - Path 2: no theme file → extracts `{themeName, customTheme, fonts, defaultColorMode}` from `stackwright.yml` root, emits `_theme.json` silently
  - Path 3: no theme info → emits `_theme.json: {}`

  ### `@stackwright/nextjs`
  - `StackwrightLayout` reads `_theme.json` at render time via `getThemeFile()`
  - Passes `_theme.json.defaultColorMode` as `fallback` to `ColorModeScript` (previously hardcoded `'system'`)
  - Falls back to `_site.json.customTheme` backgrounds when `_theme.json` has no `customTheme` (backcompat for legacy setups)

  ### `@stackwright/core`
  - `DynamicPage` reads `theme.defaultColorMode` and passes it as `initialColorMode` to `ThemeProvider`
  - Ensures the initial server render matches the `ColorModeScript` fallback — no color-mode flash for `defaultColorMode: dark` projects

  ## Upgrade guide

  **Projects with `stackwright.theme.yml`:** No action required. `_theme.json` is emitted automatically.

  **Projects with inline `customTheme` in `stackwright.yml`:** No action required. Path 2 extracts theme keys silently. `_site.json` still contains the legacy keys until Bead 4 (a future release) strips them.

  **To opt into a non-system default color mode:**

  ```yaml
  # stackwright.theme.yml
  defaultColorMode: dark # first-time visitors see dark mode
  ```

## 0.6.1

### Patch Changes

- 5e6d487: Fix white flash during dark mode page transitions

  The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

  At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.

## 0.6.1-alpha.0

### Patch Changes

- 9aeb5d5: Fix white flash during dark mode page transitions

  The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

  At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.

## 0.6.0

### Minor Changes

- f0bd272: Add server-safe `@stackwright/themes/color-mode-script` entry point for App Router Server Components.

  `StackwrightLayout` (a Server Component) needs `ColorModeScript` but must not import `ThemeProvider` and its client-only React hooks. The new `@stackwright/themes/color-mode-script` export provides exactly `ColorModeScript` without pulling in any client code.
  - **@stackwright/themes**: New `./color-mode-script` export path (server-safe, no React hooks)
  - **@stackwright/nextjs**: `StackwrightLayout` now imports from `@stackwright/themes/color-mode-script`

## 0.6.0-alpha.0

### Minor Changes

- a72f3ad: Add server-safe `@stackwright/themes/color-mode-script` entry point for App Router Server Components.

  `StackwrightLayout` (a Server Component) needs `ColorModeScript` but must not import `ThemeProvider` and its client-only React hooks. The new `@stackwright/themes/color-mode-script` export provides exactly `ColorModeScript` without pulling in any client code.
  - **@stackwright/themes**: New `./color-mode-script` export path (server-safe, no React hooks)
  - **@stackwright/nextjs**: `StackwrightLayout` now imports from `@stackwright/themes/color-mode-script`

## 0.5.3

### Patch Changes

- f1637a6: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- d4a06ff: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.5.3-alpha.1

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.

## 0.5.3-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.5.2

### Patch Changes

- 8f34fd6: fix: dark mode toggle now updates in real-time (#252) and background images no longer override dark background color (#251)

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
