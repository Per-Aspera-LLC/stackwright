# @stackwright/themes — Agent Guide

YAML-configurable theme system with first-class dark mode and cookie-based color preference persistence.

---

## What This Package Provides

| Export | Purpose |
|--------|---------|
| `ThemeProvider` | React context provider — manages theme state, color mode, and CSS variable injection |
| `ThemeStyleInjector` | Injects `--sw-color-*` and `--sw-font-*` CSS custom properties onto a wrapper element |
| `ColorModeScript` | Blocking `<script>` for `<head>` — reads `sw-color-mode` cookie before hydration to prevent flash |
| `useSafeTheme()` | Hook to read the resolved theme (colors already reflect the active light/dark mode) |
| `loadTheme()` / `loadThemes()` | Load themes from YAML strings or built-in presets |
| `colorsSchema`, `themeConfigSchema`, `themeSchema` | Zod schemas — source of truth for theme structure |
| `ColorMode` type | `'light'` | `'dark'` | `'system'` |

---

## Theme YAML Structure

```yaml
id: "corporate"
name: "Corporate"
colors:
  primary: "#1976d2"
  secondary: "#455a64"
  accent: "#f9a825"
  background: "#ffffff"
  surface: "#f5f5f5"
  text: "#212121"
  textSecondary: "#757575"
darkColors:                    # Optional — enables dark mode
  primary: "#fbbf24"
  secondary: "#94a3b8"
  accent: "#f59e0b"
  background: "#0f172a"
  surface: "#1e293b"
  text: "#f1f5f9"
  textSecondary: "#94a3b8"
typography:
  fontFamily:
    primary: "Inter"
    secondary: "Cinzel"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
```

### Color Palette Keys

All 7 keys are required in `colors`. `darkColors` is optional but uses the same shape:

| Key | Purpose |
|-----|---------|
| `primary` | Main brand color |
| `secondary` | Secondary brand color |
| `accent` | Accent/highlight color |
| `background` | Page background |
| `surface` | Card/panel background |
| `text` | Primary text color |
| `textSecondary` | Secondary/muted text color |

---

## Dark Mode Architecture

### How it works

1. `ThemeProvider` holds `colorMode` state (default: `'system'`, overridable via `initialColorMode` prop).
2. When `colorMode` is `'dark'` (or `'system'` resolves to dark via `matchMedia`), `theme.colors` is replaced with `theme.darkColors`. If no `darkColors` exists, `colors` is used as fallback.
3. **Components never need to know about dark mode.** They call `useSafeTheme()`, read `theme.colors.*`, and get the correct palette for the active mode.

### `defaultColorMode` — theme-file level preference

The `defaultColorMode` field on `stackwrightThemeFileSchema` (from `@stackwright/types`) lets a project declare its preferred initial color mode:

```yaml
# stackwright.theme.yml
defaultColorMode: dark  # 'light' | 'dark' | 'system' (default: 'system')
```

Resolution chain (highest wins):
1. **User cookie** (`sw-color-mode`) — explicit user preference
2. **`data-sw-color-mode` attribute** on `<html>` — set by `ColorModeScript` from the cookie
3. **`initialColorMode` prop** on `ThemeProvider` — threaded from `_theme.json.defaultColorMode` by `DynamicPage` and `StackwrightLayout`
4. **OS preference** (`matchMedia`) — only when `colorMode === 'system'`

This means `defaultColorMode: dark` makes dark the default for first-time visitors, but a user who has explicitly set their preference keeps it.

### Cookie persistence

- `setColorMode('dark')` writes `sw-color-mode=dark` cookie (365 days, `SameSite=Lax`).
- `setColorMode('system')` removes the cookie (falls back to OS preference).
- On mount, `ThemeProvider` reads the cookie and restores the saved preference.

### Flash prevention

`ColorModeScript` renders a blocking `<script>` that reads the `sw-color-mode` cookie and sets `data-sw-color-mode` on `<html>` **before** React hydrates. The `fallback` prop controls what color mode the script applies when no cookie is found — `StackwrightLayout` now passes `_theme.json.defaultColorMode` as this fallback automatically.

Use via `StackwrightDocument` from `@stackwright/nextjs` or place manually in `_document.tsx` `<Head>`.

### ThemeProvider props + context shape

```typescript
// Props
interface ThemeProviderProps {
  theme: Theme;
  initialColorMode?: ColorMode; // Default: 'system'. Seeded from _theme.json.defaultColorMode.
  children: React.ReactNode;
}

// Context
interface ThemeContextType {
  theme: Theme;                          // Resolved theme (effective colors for current mode)
  rawTheme: Theme;                       // Original theme with both colors and darkColors
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;                  // Current setting: 'light' | 'dark' | 'system'
  setColorMode: (mode: ColorMode) => void;
  resolvedColorMode: 'light' | 'dark';   // What's actually active
}
```

---

## CSS Custom Properties

`ThemeStyleInjector` (used internally by `DynamicPage`) injects:

- `--sw-color-primary`, `--sw-color-secondary`, etc. — from resolved `theme.colors`
- `--sw-font-primary`, `--sw-font-secondary` — from `theme.typography.fontFamily`

These CSS vars are consumed by `@stackwright/ui-shadcn` components. Core components read colors via `useSafeTheme()` directly.

`ThemeStyleInjector` consumes from `ThemeProvider` context by default. An optional `theme` prop override is supported for backwards compatibility.

---

## Built-in Themes

Two themes are embedded in `themeLoader.ts`: **corporate** and **soft**. Both include `darkColors`. Theme YAML files also exist in `src/themes/` for reference.

---

## Package Structure

```
src/
  ThemeProvider.tsx     — ThemeProvider, ThemeStyleInjector, useTheme, themeToCSSVars
  ColorModeScript.tsx   — Blocking script component for flash-free dark mode
  themeLoader.ts        — Built-in theme loading (corporate, soft)
  types.ts              — Zod schemas + TypeScript types (colorsSchema, themeConfigSchema, etc.)
  index.ts              — Public exports
  themes/               — YAML theme files (corporate.yaml, soft.yaml)
```

---

## Dependencies

- **React** ^19 (peer)
- **js-yaml** — YAML parsing
- **Zod** ^4 — Schema definitions

No MUI. No Emotion. No CSS framework dependencies.

---

## Testing

Tests in `packages/themes/test/`. Key areas:
- Color mode switching (light → dark → system)
- Cookie read/write on mode change
- `ThemeStyleInjector` CSS variable injection
- `ColorModeScript` output
- Theme loading and validation
- Fallback when `darkColors` is undefined

Run: `pnpm test` from monorepo root (or `vitest` from this package).
