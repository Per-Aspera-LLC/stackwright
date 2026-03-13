import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerCollectionProvider,
  getCollectionProvider,
} from '../../src/utils/collectionProviderRegistry';
import { clearCollectionProvider } from '../../src/utils/collectionProviderRegistry';
import type { CollectionProvider } from '@stackwright/collections';

function makeMockProvider(overrides: Partial<CollectionProvider> = {}): CollectionProvider {
  return {
    list: overrides.list ?? (async () => ({ entries: [], total: 0 })),
    get: overrides.get ?? (async () => null),
    collections: overrides.collections ?? (async () => []),
  };
}

describe('collectionProviderRegistry', () => {
  beforeEach(() => {
    clearCollectionProvider();
  });

  it('throws when no provider is registered', () => {
    expect(() => getCollectionProvider()).toThrow('No CollectionProvider registered');
  });

  it('returns the registered provider', () => {
    const mock = makeMockProvider();
    registerCollectionProvider(mock);
    expect(getCollectionProvider()).toBe(mock);
  });

  it('second registration replaces the first', () => {
    const first = makeMockProvider();
    const second = makeMockProvider();
    registerCollectionProvider(first);
    registerCollectionProvider(second);
    expect(getCollectionProvider()).toBe(second);
    expect(getCollectionProvider()).not.toBe(first);
  });

  it('clearCollectionProvider resets to unregistered state', () => {
    registerCollectionProvider(makeMockProvider());
    clearCollectionProvider();
    expect(() => getCollectionProvider()).toThrow();
  });
});
