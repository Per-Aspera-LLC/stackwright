---
"@stackwright/core": patch
---

Wire up theme spacing tokens to all components. Components now use `theme.spacing` values (xs through 2xl) from the theme config instead of hardcoded pixel values. Customizing spacing in your theme YAML now affects all component padding, margin, and gap values. Also adds spacing and typography to the `useSafeTheme` fallback so components work correctly outside a ThemeProvider.
