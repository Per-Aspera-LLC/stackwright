# @stackwright/nextjs — Agent Guide

Next.js adapter layer for Stackwright. Provides framework-specific implementations of Image, Link, Router, Head, and static generation helpers.

> **App Router is the recommended router for new Stackwright projects.** Pages Router exports are deprecated and will be removed in a future minor version.

---

## What This Package Provides

| Export | Router | Purpose |
|--------|--------|---------|
| `registerNextJSComponents()` | Both | Registers all Next.js adapter components into the `stackwrightRegistry` |
| `NextStackwrightImage` | Both | Next.js `Image` wrapper with blur placeholders and responsive sizing |
| `NextStackwrightLink` | Both | Next.js `Link` wrapper for client-side navigation |
| `NextStackwrightRouter` / `NextStackwrightRoute` | App Router | Next.js App Router routing integration (uses `next/navigation`) |
| `StackwrightLayout` | **App Router** | Root layout component — includes `ColorModeScript` + font links. Use in `app/layout.tsx`. |
| `generateStackwrightStaticParams` | **App Router** | Generates static params for all pages. Use as `generateStaticParams` in `app/[...slug]/page.tsx`. |
| `getStackwrightPageData` | **App Router** | Reads page JSON from prebuild output. Use in Server Component page files. |
| `getStackwrightSiteConfig` | **App Router** | Reads site config JSON from prebuild output. |
| `StackwrightDocument` | ~~Pages Router~~ **Deprecated** | Drop-in `_document.tsx` — use `StackwrightLayout` instead. |
| `NextStackwrightHead` | ~~Pages Router~~ **Deprecated** | SEO via `next/head` — use the Metadata API instead. |
| `createStackwrightNextConfig()` | Both | Next.js config helper |

---

## Registration (Required)

`registerNextJSComponents()` **must** be called explicitly before rendering — do not rely on import side effects:

```typescript
// app/layout.tsx (App Router) or pages/_app.tsx (Pages Router — deprecated)
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();
```

In App Router, wrap this in a `'use client'` component or call it from a client boundary since the registry uses client-side state.

---

## App Router Setup (Recommended)

### `app/layout.tsx`

```typescript
import { StackwrightLayout } from '@stackwright/nextjs';
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <StackwrightLayout>{children}</StackwrightLayout>;
}
```

### `app/[...slug]/page.tsx`

```typescript
import { DynamicPage } from '@stackwright/core';
import {
  generateStackwrightStaticParams,
  getStackwrightPageData,
} from '@stackwright/nextjs';
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
import { getStackwrightPageData } from '@stackwright/nextjs';
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
