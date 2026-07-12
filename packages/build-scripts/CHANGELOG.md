# @stackwright/build-scripts

## 0.10.0

### Minor Changes

- 4e10537: Add lucide-react export existence validator to `generateIconManifest()`.

  Previously, YAML content could reference icon names that don't exist in
  `lucide-react` (e.g. `icon: bridge`). The generated `icons.ts` would emit
  a broken import that caused Turbopack to 500 every route at dev-server start.

  This change ships:
  - `LUCIDE_REACT_EXPORTS` — a compile-time Set of all importable lucide-react
    names (canonical exports + deprecated aliases), generated from
    `lucide-react/dist/lucide-react.d.ts` and committed as
    `src/compile/lucide-exports.json`.
  - `isValidLucideExport(name)` — pure exported utility; returns `true` if
    `name` is a real lucide-react export.
  - `mapToValidLucideName(yamlSrc)` — exported utility; applies
    `LEGACY_MUI_ICON_ALIASES` + `lucideExportName()` then validates. On miss,
    emits a `console.warn` and returns `HelpCircle` (the fallback).
  - `generateIconManifest()` now validates every resolved icon name against the
    allow-list. Unknown icons fall back to `HelpCircle` with a per-icon warning
    and a summary count at the end. The original YAML key is preserved in the
    `siteIconPreset` object so runtime lookup continues to work. Hard failures
    are never emitted — a broken icon name should not take down the dev server.

- 4e10537: Image optimization pipeline with sharp in prebuild (ri2)

  During `stackwright-prebuild`, co-located images are now automatically processed through sharp:
  - **WebP/AVIF variants** generated alongside originals in `public/images/`
  - **Blur placeholders** (tiny base64 data URIs) injected into page content JSON as `blurDataURL`
  - **Image manifest** (`_image-manifest.json`) emitted for tooling/debugging
  - **Automatic downscaling** when images exceed `maxWidth` (default: 1920px)

  Configuration via `stackwright.yml`:

  ```yaml
  imageOptimization:
    enabled: true # default: true
    formats: [webp] # options: webp, avif
    quality: 80 # 1-100
    maxWidth: 1920 # pixels
    blur: true # generate blur placeholders
    blurSize: 10 # blur placeholder width in px
  ```

  Disable via CLI: `stackwright-prebuild --no-image-optimization`

  The `<Media>` component (core) automatically passes `placeholder="blur"` and `blurDataURL` to `<NextStackwrightImage>` when blur data is present in the content JSON. No user-side changes required — existing sites get blur placeholders automatically.

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

- 4e10537: Fix icon generator to handle kebab-case and lowercase YAML icon names per
  lucide.dev's URL-slug naming convention.

  The icon manifest generator previously emitted YAML icon names verbatim into
  the TypeScript import statement, which fails for kebab-case names (`alert-triangle`
  parses as `alert minus triangle`) and produces undefined imports for lowercase
  single-word names (`activity` is valid TS but lucide-react only exports
  PascalCase `Activity`).

  Generator now normalizes YAML names to lucide-react's PascalCase export
  convention while preserving the kebab-case keys in the runtime registry
  (`'alert-triangle': AlertTriangle`). Existing PascalCase YAML names and the
  LEGACY_MUI_ICON_ALIASES map continue to work unchanged.

  Empirical fixture: kennel drawer 815 (stackwright-pro repo, planning session
  2026-06-25) — the bxps verification raft generated a full Storm Surge app
  with YAML using `icon: alert-triangle` etc., which then failed `pnpm dev` on
  TypeScript parse error in the generated `stackwright-generated/icons.ts`.

- Updated dependencies [4e10537]
- Updated dependencies [4e10537]
- Updated dependencies [4e10537]
  - @stackwright/types@1.9.0

## 0.10.0-alpha.2

### Minor Changes

- d1484ca: Add lucide-react export existence validator to `generateIconManifest()`.

  Previously, YAML content could reference icon names that don't exist in
  `lucide-react` (e.g. `icon: bridge`). The generated `icons.ts` would emit
  a broken import that caused Turbopack to 500 every route at dev-server start.

  This change ships:
  - `LUCIDE_REACT_EXPORTS` — a compile-time Set of all importable lucide-react
    names (canonical exports + deprecated aliases), generated from
    `lucide-react/dist/lucide-react.d.ts` and committed as
    `src/compile/lucide-exports.json`.
  - `isValidLucideExport(name)` — pure exported utility; returns `true` if
    `name` is a real lucide-react export.
  - `mapToValidLucideName(yamlSrc)` — exported utility; applies
    `LEGACY_MUI_ICON_ALIASES` + `lucideExportName()` then validates. On miss,
    emits a `console.warn` and returns `HelpCircle` (the fallback).
  - `generateIconManifest()` now validates every resolved icon name against the
    allow-list. Unknown icons fall back to `HelpCircle` with a per-icon warning
    and a summary count at the end. The original YAML key is preserved in the
    `siteIconPreset` object so runtime lookup continues to work. Hard failures
    are never emitted — a broken icon name should not take down the dev server.

## 0.10.0-alpha.1

### Patch Changes

- Fix icon generator to handle kebab-case and lowercase YAML icon names per
  lucide.dev's URL-slug naming convention.

  The icon manifest generator previously emitted YAML icon names verbatim into
  the TypeScript import statement, which fails for kebab-case names (`alert-triangle`
  parses as `alert minus triangle`) and produces undefined imports for lowercase
  single-word names (`activity` is valid TS but lucide-react only exports
  PascalCase `Activity`).

  Generator now normalizes YAML names to lucide-react's PascalCase export
  convention while preserving the kebab-case keys in the runtime registry
  (`'alert-triangle': AlertTriangle`). Existing PascalCase YAML names and the
  LEGACY_MUI_ICON_ALIASES map continue to work unchanged.

  Empirical fixture: kennel drawer 815 (stackwright-pro repo, planning session
  2026-06-25) — the bxps verification raft generated a full Storm Surge app
  with YAML using `icon: alert-triangle` etc., which then failed `pnpm dev` on
  TypeScript parse error in the generated `stackwright-generated/icons.ts`.

## 0.10.0-alpha.0

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

### Patch Changes

- Updated dependencies [98bc1f7]
  - @stackwright/types@1.9.0-alpha.0

## 0.9.0

### Minor Changes

- 5e6d487: Image optimization pipeline with sharp in prebuild (ri2)

  During `stackwright-prebuild`, co-located images are now automatically processed through sharp:
  - **WebP/AVIF variants** generated alongside originals in `public/images/`
  - **Blur placeholders** (tiny base64 data URIs) injected into page content JSON as `blurDataURL`
  - **Image manifest** (`_image-manifest.json`) emitted for tooling/debugging
  - **Automatic downscaling** when images exceed `maxWidth` (default: 1920px)

  Configuration via `stackwright.yml`:

  ```yaml
  imageOptimization:
    enabled: true # default: true
    formats: [webp] # options: webp, avif
    quality: 80 # 1-100
    maxWidth: 1920 # pixels
    blur: true # generate blur placeholders
    blurSize: 10 # blur placeholder width in px
  ```

  Disable via CLI: `stackwright-prebuild --no-image-optimization`

  The `<Media>` component (core) automatically passes `placeholder="blur"` and `blurDataURL` to `<NextStackwrightImage>` when blur data is present in the content JSON. No user-side changes required — existing sites get blur placeholders automatically.

### Patch Changes

- Updated dependencies [5e6d487]
- Updated dependencies [5e6d487]
  - @stackwright/types@1.8.0

## 0.9.0-alpha.1

### Minor Changes

- 3bac6b8: Image optimization pipeline with sharp in prebuild (ri2)

  During `stackwright-prebuild`, co-located images are now automatically processed through sharp:
  - **WebP/AVIF variants** generated alongside originals in `public/images/`
  - **Blur placeholders** (tiny base64 data URIs) injected into page content JSON as `blurDataURL`
  - **Image manifest** (`_image-manifest.json`) emitted for tooling/debugging
  - **Automatic downscaling** when images exceed `maxWidth` (default: 1920px)

  Configuration via `stackwright.yml`:

  ```yaml
  imageOptimization:
    enabled: true # default: true
    formats: [webp] # options: webp, avif
    quality: 80 # 1-100
    maxWidth: 1920 # pixels
    blur: true # generate blur placeholders
    blurSize: 10 # blur placeholder width in px
  ```

  Disable via CLI: `stackwright-prebuild --no-image-optimization`

  The `<Media>` component (core) automatically passes `placeholder="blur"` and `blurDataURL` to `<NextStackwrightImage>` when blur data is present in the content JSON. No user-side changes required — existing sites get blur placeholders automatically.

### Patch Changes

- Updated dependencies [3bac6b8]
  - @stackwright/types@1.8.0-alpha.1

## 0.8.2-alpha.0

### Patch Changes

- Updated dependencies [803e6ea]
  - @stackwright/types@1.7.1-alpha.0

## 0.8.1

### Patch Changes

- Updated dependencies [7fc040f]
- Updated dependencies [7fc040f]
  - @stackwright/types@1.7.0

## 0.8.0

### Minor Changes

- cd5403d: Add font loading strategy (bundle/local) to prebuild: bundle downloads fonts at build time, local uses pre-provided files for air-gapped environments
- a931eb3: feat(prebuild): support `stackwright.theme.yml` sidecar config for isolated theme configuration — merges `themeName`, `customTheme`, and `fonts` on top of `stackwright.yml`, preventing multi-otter clobbering between Theme Otter and Page Otter
- f0bd272: feat: SEO Autopilot — auto-generate sitemap.xml, robots.txt, and JSON-LD structured data

  Prebuild now generates `sitemap.xml` and `robots.txt` in `public/` when `meta.base_url` is set in `stackwright.yml`. Pages with `noindex: true` are excluded from the sitemap. Locale variants get `xhtml:link` alternate entries.

  Content types with natural schema.org mappings now emit `<script type="application/ld+json">` tags:
  - `faq` → FAQPage schema
  - `pricing_table` → Product with AggregateOffer schema

  New exports:
  - `@stackwright/build-scripts`: `generateSitemap`, `generateRobotsTxt`, `collectPageMeta`
  - `@stackwright/core`: `generatePageJsonLd`, `generateFaqJsonLd`, `generatePricingJsonLd`, `generateArticleJsonLd`, `JsonLdScript`

### Patch Changes

- a931eb3: fix(sbom): write SBOM files to `.stackwright/sbom/` instead of project root; fix pnpm lockfile v9 parsing that produced 0 dependencies in all SBOMs
- cd5403d: Add `Layout → LayoutTemplate` to `LEGACY_MUI_ICON_ALIASES` in the icon manifest generator. `Layout` was renamed to `LayoutTemplate` in lucide-react v1.x; without this alias the prebuild emitted `import { Layout } from 'lucide-react'` which does not exist and crashes the build.
- a931eb3: feat(core): implement `layoutMode: app-shell` layout mode

  Dashboard Otter pages that emit `layoutMode: app-shell` now render
  correctly in the Stackwright framework.

  **What's new:**
  - **`@stackwright/types`**: `PageContent` gains an optional top-level
    `layoutMode` field (`'page' | 'app-shell'`). Fully backward-compatible —
    existing pages without the field continue to validate and render as before.
  - **`@stackwright/core`**: New `AppShellLayout` component — a locked-chrome
    layout where `TopAppBar` and `NavSidebar` are sticky and only the content
    viewport scrolls (`height: 100vh / overflow: hidden` root, `overflowY: auto`
    on the content column). `DynamicPage` routes to `AppShellLayout` when
    `pageContent.layoutMode === 'app-shell'`, and to the existing `PageLayout`
    otherwise.
  - **`@stackwright/build-scripts`**: `normalizePageContent()` now handles the
    Dashboard Otter flat-array format (`content: [...]`) by normalizing it to
    `{ content: { content_items: [...] } }` before validation and JSON output.
    `layoutMode` is preserved at the top level through the `...page` spread.

  Closes swp-0rz.

- Updated dependencies [cd5403d]
- Updated dependencies [f0bd272]
- Updated dependencies [cd5403d]
- Updated dependencies [a931eb3]
- Updated dependencies [a931eb3]
  - @stackwright/types@1.6.0
  - @stackwright/sbom-generator@0.2.2

## 0.8.0-alpha.7

### Patch Changes

- 510517c: feat(core): implement `layoutMode: app-shell` layout mode

  Dashboard Otter pages that emit `layoutMode: app-shell` now render
  correctly in the Stackwright framework.

  **What's new:**
  - **`@stackwright/types`**: `PageContent` gains an optional top-level
    `layoutMode` field (`'page' | 'app-shell'`). Fully backward-compatible —
    existing pages without the field continue to validate and render as before.
  - **`@stackwright/core`**: New `AppShellLayout` component — a locked-chrome
    layout where `TopAppBar` and `NavSidebar` are sticky and only the content
    viewport scrolls (`height: 100vh / overflow: hidden` root, `overflowY: auto`
    on the content column). `DynamicPage` routes to `AppShellLayout` when
    `pageContent.layoutMode === 'app-shell'`, and to the existing `PageLayout`
    otherwise.
  - **`@stackwright/build-scripts`**: `normalizePageContent()` now handles the
    Dashboard Otter flat-array format (`content: [...]`) by normalizing it to
    `{ content: { content_items: [...] } }` before validation and JSON output.
    `layoutMode` is preserved at the top level through the `...page` spread.

  Closes swp-0rz.

- Updated dependencies [510517c]
  - @stackwright/types@1.6.0-alpha.4

## 0.8.0-alpha.6

### Minor Changes

- 2eba549: feat(prebuild): support `stackwright.theme.yml` sidecar config for isolated theme configuration — merges `themeName`, `customTheme`, and `fonts` on top of `stackwright.yml`, preventing multi-otter clobbering between Theme Otter and Page Otter

### Patch Changes

- 2eba549: fix(sbom): write SBOM files to `.stackwright/sbom/` instead of project root; fix pnpm lockfile v9 parsing that produced 0 dependencies in all SBOMs
- Updated dependencies [2eba549]
  - @stackwright/sbom-generator@0.2.2-alpha.0

## 0.8.0-alpha.5

### Minor Changes

- 85075cd: feat: SEO Autopilot — auto-generate sitemap.xml, robots.txt, and JSON-LD structured data

  Prebuild now generates `sitemap.xml` and `robots.txt` in `public/` when `meta.base_url` is set in `stackwright.yml`. Pages with `noindex: true` are excluded from the sitemap. Locale variants get `xhtml:link` alternate entries.

  Content types with natural schema.org mappings now emit `<script type="application/ld+json">` tags:
  - `faq` → FAQPage schema
  - `pricing_table` → Product with AggregateOffer schema

  New exports:
  - `@stackwright/build-scripts`: `generateSitemap`, `generateRobotsTxt`, `collectPageMeta`
  - `@stackwright/core`: `generatePageJsonLd`, `generateFaqJsonLd`, `generatePricingJsonLd`, `generateArticleJsonLd`, `JsonLdScript`

## 0.8.0-alpha.4

### Patch Changes

- Updated dependencies [ed64fab]
  - @stackwright/types@1.6.0-alpha.3

## 0.8.0-alpha.3

### Patch Changes

- @stackwright/types@1.6.0-alpha.2

## 0.8.0-alpha.2

### Patch Changes

- 9bd288f: Add `Layout → LayoutTemplate` to `LEGACY_MUI_ICON_ALIASES` in the icon manifest generator. `Layout` was renamed to `LayoutTemplate` in lucide-react v1.x; without this alias the prebuild emitted `import { Layout } from 'lucide-react'` which does not exist and crashes the build.

## 0.8.0-alpha.1

### Minor Changes

- af4a166: Add font loading strategy (bundle/local) to prebuild: bundle downloads fonts at build time, local uses pre-provided files for air-gapped environments

### Patch Changes

- Updated dependencies [af4a166]
  - @stackwright/types@1.6.0-alpha.1

## 0.7.3-alpha.0

### Patch Changes

- Updated dependencies [be7f767]
  - @stackwright/types@1.5.1-alpha.0

## 0.7.2

### Patch Changes

- f1637a6: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- d4a06ff: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

- Updated dependencies [d4a06ff]
- Updated dependencies [d4a06ff]
- Updated dependencies [f1637a6]
- Updated dependencies [d4a06ff]
- Updated dependencies [d4a06ff]
- Updated dependencies [d4a06ff]
  - @stackwright/types@1.5.0
  - @stackwright/sbom-generator@0.2.1

## 0.7.2-alpha.3

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- Updated dependencies [adb13ae]
  - @stackwright/sbom-generator@0.2.1-alpha.1
  - @stackwright/types@1.5.0-alpha.3

## 0.7.2-alpha.2

### Patch Changes

- Updated dependencies [b9a482b]
  - @stackwright/types@1.5.0-alpha.2

## 0.7.2-alpha.1

### Patch Changes

- Updated dependencies [496aebb]
  - @stackwright/types@1.5.0-alpha.1

## 0.7.2-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

- Updated dependencies [c18b6a1]
  - @stackwright/sbom-generator@0.2.1-alpha.0
  - @stackwright/types@1.4.2-alpha.0

## 0.7.1

### Patch Changes

- Updated dependencies [8616cd5]
- Updated dependencies [8616cd5]
  - @stackwright/types@1.4.1

## 0.7.1-alpha.1

### Patch Changes

- Updated dependencies [21ed937]
  - @stackwright/types@1.4.1-alpha.1

## 0.7.1-alpha.0

### Patch Changes

- Updated dependencies [5cfa88e]
  - @stackwright/types@1.4.1-alpha.0

## 0.7.0

### Minor Changes

- 1c432e6: Add plugin-type warnings and `unknownContentTypes` option to prebuild

  **Gap 1 — plugin-declared types now emit a warning**: When a page uses a content type allowed via a plugin's `knownContentTypeKeys`, the prebuild now logs a warning reminding you to call `registerContentType()` at runtime.

  **Gap 2 — `unknownContentTypes` option**: `PrebuildOptions` gains `unknownContentTypes?: 'error' | 'warn' | 'ignore'` (default `'error'`). Allows demo projects or WIP builds to downgrade content validation failures from hard errors to warnings or silence.

### Patch Changes

- Updated dependencies [1c432e6]
  - @stackwright/types@1.4.0

## 0.6.0

### Minor Changes

- 265bf87: Add content format normalization (mapping-key YAML format → type-field format) to prebuild pipeline.
  Plugin `contentItemSchemas` and `knownContentTypeKeys` are now applied during page validation.

### Patch Changes

- 265bf87: Add configSchema field to PrebuildPlugin for plugin config validation
- 265bf87: fix(executePluginHook): preserve `this` binding when calling plugin lifecycle hooks

  `executePluginHook` was extracting hook methods as unbound references
  (`const hookFn = plugin[hook]`) and calling them as plain functions
  (`hookFn(context)`). In strict-mode ES classes, this strips `this`,
  causing any plugin that calls a private/instance method from `beforeBuild`
  or `afterBuild` to throw `Cannot read properties of undefined`.

  Fix: use `hookFn.call(plugin, context)` so the plugin instance is always
  the receiver.

- Updated dependencies [265bf87]
- Updated dependencies [265bf87]
  - @stackwright/types@1.3.0

## 0.6.0-alpha.0

### Minor Changes

- bdf7fe0: Add content format normalization (mapping-key YAML format → type-field format) to prebuild pipeline.
  Plugin `contentItemSchemas` and `knownContentTypeKeys` are now applied during page validation.

### Patch Changes

- 68bdad5: Add configSchema field to PrebuildPlugin for plugin config validation
- 83ba70c: fix(executePluginHook): preserve `this` binding when calling plugin lifecycle hooks

  `executePluginHook` was extracting hook methods as unbound references
  (`const hookFn = plugin[hook]`) and calling them as plain functions
  (`hookFn(context)`). In strict-mode ES classes, this strips `this`,
  causing any plugin that calls a private/instance method from `beforeBuild`
  or `afterBuild` to throw `Cannot read properties of undefined`.

  Fix: use `hookFn.call(plugin, context)` so the plugin instance is always
  the receiver.

- Updated dependencies [bdf7fe0]
- Updated dependencies [68bdad5]
  - @stackwright/types@1.3.0-alpha.1

## 0.5.1

### Patch Changes

- 2fab531: fix(build-scripts): create parent directory before writing nested page slug output files

## 0.5.0

### Minor Changes

- 46df0c5: Add content format normalization (mapping-key YAML format → type-field format) to prebuild pipeline.
  Plugin `contentItemSchemas` and `knownContentTypeKeys` are now applied during page validation.
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

- 199ca1c: Add environment variable resolution for integration secrets

  This PR introduces support for referencing secrets from environment variables in integration configurations. Key changes include:
  - New `SecretReference` type for env var secret resolution
  - `SecretDetection` utilities for runtime secret validation
  - Updated site config schema with integration secret support
  - Prebuild script updates for env var substitution

- 8f34fd6: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

- 8f34fd6: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- 46df0c5: Add configSchema field to PrebuildPlugin for plugin config validation
- db1ab10: fix(executePluginHook): preserve `this` binding when calling plugin lifecycle hooks

  `executePluginHook` was extracting hook methods as unbound references
  (`const hookFn = plugin[hook]`) and calling them as plain functions
  (`hookFn(context)`). In strict-mode ES classes, this strips `this`,
  causing any plugin that calls a private/instance method from `beforeBuild`
  or `afterBuild` to throw `Cannot read properties of undefined`.

  Fix: use `hookFn.call(plugin, context)` so the plugin instance is always
  the receiver.

- Updated dependencies [f365749]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [199ca1c]
- Updated dependencies [46df0c5]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
- Updated dependencies [8f34fd6]
  - @stackwright/types@1.2.0
  - @stackwright/sbom-generator@0.2.0

## 0.4.0

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

- c1ca6ed: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

- a5b331f: Add video media type support to the Stackwright framework.
  - New `video` discriminator in the `MediaItem` union (`@stackwright/types`)
  - `VideoContent` type with `src`, `autoplay`, `loop`, `muted`, `controls`, and `poster` fields
  - `Media` component renders `<video>` elements for video media items (`@stackwright/core`)
  - Prebuild pipeline recognizes and copies video files alongside images (`@stackwright/build-scripts`)

### Patch Changes

- Updated dependencies [f5d7ec2]
- Updated dependencies [f714fff]
- Updated dependencies [b14b0d2]
- Updated dependencies [b14b0d2]
- Updated dependencies [a662f0c]
- Updated dependencies [c1ca6ed]
- Updated dependencies [c1ca6ed]
- Updated dependencies [b14b0d2]
- Updated dependencies [a5b331f]
  - @stackwright/types@1.1.0
  - @stackwright/sbom-generator@0.1.0

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
