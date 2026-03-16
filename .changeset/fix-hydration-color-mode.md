---
'@stackwright/themes': patch
---

Fix hydration mismatch in ThemeProvider color mode initialisation. The server always rendered light mode but the client could initialise to dark mode from the ColorModeScript DOM attribute, causing a React hydration error. Now both server and client start with light mode and the real preference is synced via useLayoutEffect before the browser paints.
