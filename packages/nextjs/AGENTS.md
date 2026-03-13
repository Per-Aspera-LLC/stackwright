# @stackwright/nextjs — Agent Guide

Next.js adapter layer for Stackwright. Provides framework-specific implementations of Image, Link, Router, Head, and static generation helpers.

---

## What This Package Provides

| Export | Purpose |
|--------|---------|
| `registerNextJSComponents()` | Registers all Next.js adapter components into the `stackwrightRegistry` |
| `NextStackwrightImage` | Next.js `Image` wrapper with blur placeholders and responsive sizing |
| `NextStackwrightLink` | Next.js `Link` wrapper for client-side navigation |
| `NextStackwrightRouter` / `NextStackwrightRoute` | Next.js router integration for programmatic navigation |
| `NextStackwrightHead` | SEO metadata injection via `next/head` (title, description, OpenGraph, etc.) |
| `StackwrightDocument` | Drop-in `_document.tsx` — includes `ColorModeScript` for flash-free dark mode |
| `createStackwrightNextConfig()` | Next.js config helper — handles webpack configuration for Stackwright packages |

---

## Registration (Required)

`registerNextJSComponents()` **must** be called explicitly before rendering — do not rely on import side effects:

```typescript
// pages/_app.tsx (Pages Router) or app/layout.tsx (App Router)
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();
```

This registers: `Image`, `Link`, `Router`, `Route`, `Head` into the `stackwrightRegistry`.

---

## StackwrightDocument

Drop-in `_document.tsx` that includes the `ColorModeScript` blocking script for flash-free dark mode:

```typescript
// pages/_document.tsx
import { StackwrightDocument } from '@stackwright/nextjs';
export default StackwrightDocument;
```

The `ColorModeScript` reads the `sw-color-mode` cookie before React hydrates and sets `data-sw-color-mode` on `<html>`. See `@stackwright/themes` AGENTS.md for details.

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

## Static Generation

The package provides helpers for `getStaticProps` and `getStaticPaths` that read from the prebuild JSON output in `public/stackwright-content/`:

```typescript
// pages/[slug].tsx
import { DynamicPage } from '@stackwright/core';
import { getStaticPropsForSlug, getStaticPathsForSlugs } from '@stackwright/nextjs';

export default DynamicPage;
export const getStaticProps = getStaticPropsForSlug;
export const getStaticPaths = getStaticPathsForSlugs;
```

---

## Package Structure

```
src/
  components/
    NextStackwrightImage.tsx    — Next.js Image with blur placeholder
    NextStackwrightLink.tsx     — Next.js Link wrapper
    NextStackwrightRouter.tsx   — Router + Route components
    NextStackwrightHead.tsx     — SEO metadata via next/head
    StackwrightDocument.tsx     — _document.tsx with ColorModeScript
  config/
    NextStackwrightConfig.ts    — createStackwrightNextConfig()
  index.ts                      — Public exports + registerNextJSComponents()
```

---

## Dependencies

- **@stackwright/core** — Component registry, framework interfaces
- **@stackwright/themes** — `ColorModeScript` (used by `StackwrightDocument`)
- **next** / **react** / **react-dom** — Peer dependencies

---

## Testing

When modifying adapter components, verify:
1. `pnpm build:nextjs` succeeds
2. `pnpm dev:hellostackwright` renders pages correctly
3. E2E tests pass (`pnpm test:e2e`)
