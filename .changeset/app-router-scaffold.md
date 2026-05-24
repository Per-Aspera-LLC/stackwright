---
"@stackwright/cli": minor
---

Scaffold template now generates App Router project structure by default. New projects use `app/layout.tsx` (via `StackwrightLayout`), `app/_components/providers.tsx` (`'use client'` registration boundary), `app/page.tsx`, `app/[...slug]/page.tsx` (with `generateStaticParams`), and `app/not-found.tsx`. Pages Router files (`pages/_app.tsx`, `pages/_document.tsx`, `pages/[...slug].tsx`, `pages/index.ts`) removed from template. YAML content files remain in `pages/` (consumed by the prebuild pipeline).
