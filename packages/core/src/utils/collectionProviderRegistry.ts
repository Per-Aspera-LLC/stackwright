import type { CollectionProvider } from '@stackwright/collections';

let provider: CollectionProvider | null = null;

/**
 * Register the active CollectionProvider.
 *
 * Call this in `_app.tsx` (Pages Router) or `layout.tsx` (App Router)
 * alongside `registerNextJSComponents()`:
 *
 * ```ts
 * import { registerCollectionProvider } from '@stackwright/core';
 * import { FileCollectionProvider } from '@stackwright/collections';
 *
 * registerCollectionProvider(new FileCollectionProvider());
 * ```
 *
 * Swapping backends (e.g. to a Contentful-backed provider) is a one-line
 * change here — the rest of the application stays the same.
 */
export function registerCollectionProvider(p: CollectionProvider): void {
  provider = p;
}

/**
 * Retrieve the registered CollectionProvider.
 *
 * Throws if no provider has been registered — this is intentional.
 * Registration must be explicit, not implicit via import side effects.
 */
export function getCollectionProvider(): CollectionProvider {
  if (!provider) {
    throw new Error(
      'No CollectionProvider registered. ' +
        'Call registerCollectionProvider() in _app.tsx or layout.tsx before use.'
    );
  }
  return provider;
}

/** Clear the registered provider. Intended for use in tests only. */
export function clearCollectionProvider(): void {
  provider = null;
}
