---
'@stackwright/core': minor
'@stackwright/themes': minor
'@stackwright/nextjs': minor
---

First-class cookie & preference persistence support (#162)

- **@stackwright/core**: New `getCookie`, `setCookie`, `removeCookie` utilities for SSR-safe cookie handling. New `getConsentState`, `setConsentState`, `hasConsent` for IAB TCF-style consent management.
- **@stackwright/themes**: `ThemeProvider` now persists color mode preference in a `sw-color-mode` cookie. Return visitors get their preferred theme on first paint. New `ColorModeScript` blocking script component eliminates flash-of-wrong-theme for SSG dark mode.
- **@stackwright/nextjs**: New `StackwrightDocument` component for `pages/_document.tsx` — includes `ColorModeScript` automatically. Two-line setup for flash-free dark mode.
