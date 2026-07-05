---
"@stackwright/types": minor
"@stackwright/themes": minor
"@stackwright/build-scripts": minor
"@stackwright/nextjs": minor
"@stackwright/core": minor
---

feat: split-file config — compile primitives + defaultColorMode (swp-xyia)

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
defaultColorMode: dark  # first-time visitors see dark mode
```
