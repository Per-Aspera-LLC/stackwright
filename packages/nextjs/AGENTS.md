# @stackwright/nextjs — Agent Guide

Next.js adapter layer for Stackwright. Provides framework-specific implementations of Image, Link, Router, Head, and static generation helpers.

> **App Router is the recommended router for new Stackwright projects.** Pages Router exports are deprecated and will be removed in a future minor version.

---

## What This Package Provides

| Export | Import path | Router | Purpose |
|--------|------------|--------|---------|
| `registerAppRouterComponents()` | **`@stackwright/nextjs/app-router`** | **App Router** | Registers Image, Link, Router, Route (no `next/head`) — use in `app/_components/providers.tsx` |
| `registerNextJSComponents()` | `@stackwright/nextjs` | Pages Router | Registers all Next.js adapter components including deprecated Head |
| `appRouterComponents` | **`@stackwright/nextjs/app-router`** | **App Router** | Named component map (Image, Link, Router, Route) |
| `NextStackwrightImage` | `@stackwright/nextjs` | Both | Next.js `Image` wrapper with blur placeholders and responsive sizing |
| `NextStackwrightLink` | `@stackwright/nextjs` | Both | Next.js `Link` wrapper for client-side navigation |
| `NextStackwrightRouter` / `NextStackwrightRoute` | `@stackwright/nextjs` | App Router | Next.js App Router routing integration (uses `next/navigation`) |
| `StackwrightLayout` | **`@stackwright/nextjs/server`** | **App Router** | Root layout component — includes `ColorModeScript` + font links. Use in `app/layout.tsx`. |
| `generateStackwrightStaticParams` | **`@stackwright/nextjs/server`** | **App Router** | Generates static params for all pages. Use as `generateStaticParams` in `app/[...slug]/page.tsx`. |
| `getStackwrightPageData` | **`@stackwright/nextjs/server`** | **App Router** | Reads page JSON from prebuild output. Use in Server Component page files. |
| `getStackwrightSiteConfig` | **`@stackwright/nextjs/server`** | **App Router** | Reads site config JSON from prebuild output. |
| `StackwrightDocument` | `@stackwright/nextjs` | ~~Pages Router~~ **Deprecated** | Drop-in `_document.tsx` — use `StackwrightLayout` instead. |
| `NextStackwrightHead` | `@stackwright/nextjs` | ~~Pages Router~~ **Deprecated** | SEO via `next/head` — use the Metadata API instead. |
| `createStackwrightNextConfig()` | `@stackwright/nextjs` | Both | Next.js config helper |

---

## Registration (Required)

**App Router:** Use `registerAppRouterComponents` from `@stackwright/nextjs/app-router`. This omits `next/head` (Pages Router API) and avoids Turbopack bundling issues.

```typescript
// app/_components/providers.tsx (App Router)
'use client';
import { registerAppRouterComponents } from '@stackwright/nextjs/app-router';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerAppRouterComponents();
registerDefaultIcons();
registerShadcnComponents();

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Pages Router (deprecated):** Use `registerNextJSComponents` from `@stackwright/nextjs`:

```typescript
// pages/_app.tsx (Pages Router — deprecated)
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';

registerNextJSComponents();
registerDefaultIcons();
```

---

## App Router Setup (Recommended)

> **Import path:** Server-only exports (`StackwrightLayout`, static generation helpers) must be imported from `@stackwright/nextjs/server`, not from `@stackwright/nextjs`. The `/server` entry is excluded from browser bundles by bundlers.

### `app/layout.tsx`

```typescript
import { StackwrightLayout } from '@stackwright/nextjs/server';
import { Providers } from './_components/providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <StackwrightLayout><Providers>{children}</Providers></StackwrightLayout>;
}
```

And `app/_components/providers.tsx` (see Registration section above).

### `app/[...slug]/page.tsx`

```typescript
import { DynamicPage } from '@stackwright/core';
import {
  generateStackwrightStaticParams,
  getStackwrightPageData,
} from '@stackwright/nextjs/server';
import { notFound } from 'next/navigation';

export const generateStaticParams = generateStackwrightStaticParams;

export default async function Page({ params }: { params: { slug: string[] } }) {
  const pageData = await getStackwrightPageData(params.slug);
  if (!pageData) notFound();
  return <DynamicPage content={pageData as any} />;
}
```

### `app/page.tsx` (root/home page)

```typescript
import { DynamicPage } from '@stackwright/core';
import { getStackwrightPageData } from '@stackwright/nextjs/server';
import { notFound } from 'next/navigation';

export default async function HomePage() {
  const pageData = await getStackwrightPageData(undefined);
  if (!pageData) notFound();
  return <DynamicPage content={pageData as any} />;
}
```

---

## Pages Router (Deprecated)

> ⚠️ Pages Router support is deprecated. Use App Router patterns above for new projects.

### `pages/_document.tsx`

```typescript
import { StackwrightDocument } from '@stackwright/nextjs';
export default StackwrightDocument;
```

### `pages/[slug].tsx`

```typescript
import { DynamicPage } from '@stackwright/core';
import { getStaticPropsForSlug, getStaticPathsForSlugs } from '@stackwright/nextjs';

export default DynamicPage;
export const getStaticProps = getStaticPropsForSlug;
export const getStaticPaths = getStaticPathsForSlugs;
```

---

## Next.js Configuration

Use `createStackwrightNextConfig()` in `next.config.js` instead of manual webpack configuration:

```javascript
// next.config.js
const { createStackwrightNextConfig } = require('@stackwright/nextjs');
module.exports = createStackwrightNextConfig({
  // Your standard Next.js config options here
});
```

---

## Package Structure

```
src/
  components/
    NextStackwrightImage.tsx    — Next.js Image with blur placeholder
    NextStackwrightLink.tsx     — Next.js Link wrapper
    NextStackwrightRouter.tsx   — Router + Route components (App Router, 'use client')
    NextStackwrightHead.tsx     — SEO metadata via next/head (DEPRECATED)
    StackwrightDocument.tsx     — _document.tsx with ColorModeScript (DEPRECATED)
    StackwrightLayout.tsx       — App Router root layout (NEW)
  config/
    NextStackwrightConfig.ts    — createStackwrightNextConfig()
  static-generation.ts          — App Router static generation helpers (NEW)
  index.ts                      — Public exports + registerNextJSComponents()
```

---

## Dependencies

- **@stackwright/core** — Component registry, framework interfaces
- **@stackwright/themes** — `ColorModeScript` (used by `StackwrightLayout` and `StackwrightDocument`)
- **next** / **react** / **react-dom** — Peer dependencies

---

## Testing

When modifying adapter components, verify:
1. `pnpm build:nextjs` succeeds
2. E2E tests pass (`pnpm test:e2e`)
