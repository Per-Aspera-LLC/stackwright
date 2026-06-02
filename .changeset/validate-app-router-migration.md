---
"@stackwright/themes": minor
"@stackwright/nextjs": patch
---

Add server-safe `@stackwright/themes/color-mode-script` entry point for App Router Server Components.

`StackwrightLayout` (a Server Component) needs `ColorModeScript` but must not import `ThemeProvider` and its client-only React hooks. The new `@stackwright/themes/color-mode-script` export provides exactly `ColorModeScript` without pulling in any client code.

- **@stackwright/themes**: New `./color-mode-script` export path (server-safe, no React hooks)
- **@stackwright/nextjs**: `StackwrightLayout` now imports from `@stackwright/themes/color-mode-script`
