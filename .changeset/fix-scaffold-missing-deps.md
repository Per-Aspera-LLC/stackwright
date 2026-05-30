---
"@stackwright/cli": patch
"@stackwright/nextjs": patch
---

fix(scaffold): remove Node-only FileCollectionProvider from client component; exclude _icon-manifest.json from static params

Three layered bugs caused `next build` to fail on freshly scaffolded projects:

1. **`lucide-react` missing from generated `package.json`** — `stackwright-generated/icons.ts`
   (produced by `stackwright-prebuild`) imports from `lucide-react`, but it was absent from
   the scaffold-generated `package.json`. Added `lucide-react` to `buildPackageJson` deps.

2. **`FileCollectionProvider` in a `'use client'` component** — `providers.tsx` imported
   `FileCollectionProvider` from `@stackwright/collections`, a Node.js-only module (`fs`,
   `path`). Turbopack tried to bundle it for the browser and failed. The registration was
   also dead code: `getCollectionProvider()` is never called; `CollectionList` receives data
   via the prebuild-injected `_entries` prop. Removed the import and call entirely.

3. **`_icon-manifest.json` not excluded from static params** — `stackwright-prebuild` writes
   `_icon-manifest.json` into `public/stackwright-content/`. `walkContentDir()` in
   `static-generation.ts` was missing it from `RESERVED_FILES`, so Next.js tried to prerender
   `/_icon-manifest` as a page and crashed with `TypeError: Cannot read properties of
   undefined (reading 'meta')`. Added `_icon-manifest.json` to `RESERVED_FILES`.

Fixes bead stackwright-1ec.
