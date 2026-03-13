---
'@stackwright/themes': minor
'@stackwright/core': patch
'@stackwright/types': patch
---

feat(themes): dark mode support (#108)

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
