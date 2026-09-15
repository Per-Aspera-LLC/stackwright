---
'@stackwright/themes': minor
'@stackwright/core': patch
'@stackwright/build-scripts': patch
---

Foreground color slots, alias-safe `resolveColor()`, and a build-time guard
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
