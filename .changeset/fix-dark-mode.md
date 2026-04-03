---
"@stackwright/core": patch
---

Fixed dark mode text colors and background handling for improved demo/hackathon quality:

- **#252**: Verified ThemeProvider toggle updates correctly (no code changes needed)
- **#251**: Added dark overlay for background images to ensure text contrast
- **Alert component**: Added dark-mode-aware accent colors
- **CodeBlock component**: Added dark mode syntax highlighting palette
- **useSafeTheme hook**: Added `useSafeColorMode` hook for safe color mode access
