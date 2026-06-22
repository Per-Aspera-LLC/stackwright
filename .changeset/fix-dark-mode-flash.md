---
"@stackwright/themes": patch
"@stackwright/nextjs": patch
---

Fix white flash during dark mode page transitions

The blocking `ColorModeScript` now accepts optional `lightBackground` / `darkBackground` props and sets `document.documentElement.style.backgroundColor` before React hydrates. `StackwrightLayout` reads theme colors from the prebuild output (`_site.json`) and feeds them in automatically.

At runtime, `ThemeProvider` keeps the `<html>` background in sync when the user toggles color mode or the OS preference changes — preventing the flash during client-side page transitions.
