---
"@stackwright/nextjs": patch
---

fix(nextjs): add `suppressHydrationWarning` to `<html>` in `StackwrightLayout` to prevent React 19 hydration mismatch from `ColorModeScript`; add explicit inline dimension styles to `NextStackwrightImage` to prevent Next.js aspect-ratio warnings when Tailwind preflight overrides `height: auto` on `<img>` elements
