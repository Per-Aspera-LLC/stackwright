---
"@stackwright/nextjs": minor
---

Add App Router support. New exports: `StackwrightLayout` (root layout component replacing `StackwrightDocument`), `generateStackwrightStaticParams`, `getStackwrightPageData`, `getStackwrightSiteConfig` (static generation helpers replacing `getStaticProps`/`getStaticPaths` patterns). `NextStackwrightRouter` now uses `next/navigation` (App Router) — Pages Router (`next/router`) support is removed. `StackwrightDocument` and `NextStackwrightHead` are deprecated; use `StackwrightLayout` and the Metadata API respectively. Scaffold template now generates App Router structure (`app/` directory) by default.

Server-only exports (`StackwrightLayout`, `generateStackwrightStaticParams`, `getStackwrightPageData`, `getStackwrightSiteConfig`) are available from `@stackwright/nextjs/server` — a dedicated subpath entry that is excluded from browser bundles. The main `@stackwright/nextjs` entry remains fully browser-safe and Pages Router compatible.
