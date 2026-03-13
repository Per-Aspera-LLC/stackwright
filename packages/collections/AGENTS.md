# @stackwright/collections — Agent Guide

Defines the `CollectionProvider` interface and ships a file-backed reference implementation. This is the OSS foundation that all Stackwright Pro providers (Contentful, Sanity, Shopify, OpenAPI) will implement.

---

## CollectionProvider Interface

```typescript
interface CollectionProvider {
  list(collection: string, opts?: CollectionListOptions): Promise<CollectionListResult>;
  get(collection: string, slug: string): Promise<CollectionEntry | null>;
  collections(): Promise<string[]>;
}
```

- `CollectionEntry`: `{ slug: string; [key: string]: unknown }`
- `CollectionListOptions`: `limit`, `offset`, `sort` (prefix `-` for descending), `filter` (exact match)
- `CollectionListResult`: `{ entries: CollectionEntry[]; total: number }`

All methods are async — pro providers need this for API calls; the file-backed provider stays consistent.

---

## FileCollectionProvider

Reads from the prebuild output in `public/stackwright-content/collections/`:

- `list()` reads `_index.json` (manifest) — one file read per call, fast
- `get()` reads individual `<slug>.json` for full content
- `collections()` lists subdirectories

---

## Registration

Register a provider in `_app.tsx` or `layout.tsx` via `@stackwright/core`:

```typescript
import { registerCollectionProvider } from '@stackwright/core';
import { FileCollectionProvider } from '@stackwright/collections';

registerCollectionProvider(new FileCollectionProvider());
```

Swapping to a pro provider is a one-line change — replace `FileCollectionProvider` with, e.g., `ContentfulCollectionProvider`.

---

## Package Structure

```
src/
  types.ts                    — CollectionProvider interface + related types
  file-collection-provider.ts — File-backed implementation
  index.ts                    — Public exports
```

## Dependencies

Zero runtime dependencies. Only dev dependencies for build/test tooling.
