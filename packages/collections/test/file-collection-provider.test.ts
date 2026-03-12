import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { FileCollectionProvider } from '../src/file-collection-provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpCollections(): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-collections-test-'));
  return base;
}

function writeIndex(base: string, collection: string, entries: object[]): void {
  const dir = path.join(base, collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_index.json'), JSON.stringify(entries));
}

function writeEntry(base: string, collection: string, slug: string, data: object): void {
  const dir = path.join(base, collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.json`), JSON.stringify(data));
}

function makeSamplePosts(base: string): void {
  const entries = [
    { slug: 'alpha', title: 'Alpha Post', date: '2026-01-01', author: 'Alice', tags: ['a'] },
    { slug: 'beta', title: 'Beta Post', date: '2026-02-01', author: 'Bob', tags: ['b'] },
    { slug: 'gamma', title: 'Gamma Post', date: '2026-03-01', author: 'Alice', tags: ['a', 'c'] },
    { slug: 'delta', title: 'Delta Post', date: '2026-04-01', author: 'Charlie', tags: ['b'] },
    { slug: 'epsilon', title: 'Epsilon Post', date: '2026-05-01', author: 'Bob', tags: ['a'] },
  ];

  writeIndex(base, 'posts', entries);
  for (const entry of entries) {
    writeEntry(base, 'posts', entry.slug, { ...entry, body: `Full body of ${entry.title}` });
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FileCollectionProvider', () => {
  let basePath: string;
  let provider: FileCollectionProvider;

  beforeEach(() => {
    basePath = makeTmpCollections();
    provider = new FileCollectionProvider(basePath);
  });

  // -- collections() --------------------------------------------------------

  describe('collections()', () => {
    it('returns empty array when basePath does not exist', async () => {
      const missing = new FileCollectionProvider('/tmp/does-not-exist-ever');
      const result = await missing.collections();
      expect(result).toEqual([]);
    });

    it('lists available collection names', async () => {
      makeSamplePosts(basePath);
      writeIndex(basePath, 'docs', [{ slug: 'readme', title: 'README' }]);

      const result = await provider.collections();
      expect(result.sort()).toEqual(['docs', 'posts']);
    });
  });

  // -- list() ---------------------------------------------------------------

  describe('list()', () => {
    it('returns all entries from manifest', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts');
      expect(result.entries).toHaveLength(5);
      expect(result.total).toBe(5);
    });

    it('returns empty result for unknown collection', async () => {
      const result = await provider.list('nonexistent');
      expect(result.entries).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('respects limit', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { limit: 2 });
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('respects offset', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { offset: 3 });
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('respects limit + offset together', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { offset: 1, limit: 2 });
      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.entries[0].slug).toBe('beta');
      expect(result.entries[1].slug).toBe('gamma');
    });

    it('sorts by specified field ascending', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { sort: 'title' });
      const titles = result.entries.map((e) => e.title);
      expect(titles).toEqual([
        'Alpha Post',
        'Beta Post',
        'Delta Post',
        'Epsilon Post',
        'Gamma Post',
      ]);
    });

    it('sorts descending with - prefix', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { sort: '-date' });
      const dates = result.entries.map((e) => e.date);
      expect(dates).toEqual(['2026-05-01', '2026-04-01', '2026-03-01', '2026-02-01', '2026-01-01']);
    });

    it('filters by exact field match', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { filter: { author: 'Alice' } });
      expect(result.entries).toHaveLength(2);
      expect(result.entries.every((e) => e.author === 'Alice')).toBe(true);
      expect(result.total).toBe(2);
    });

    it('filters on array fields (tag contains value)', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', { filter: { tags: 'a' } });
      expect(result.entries).toHaveLength(3);
      expect(result.entries.map((e) => e.slug).sort()).toEqual(['alpha', 'epsilon', 'gamma']);
    });

    it('combines filter + sort + limit', async () => {
      makeSamplePosts(basePath);
      const result = await provider.list('posts', {
        filter: { author: 'Bob' },
        sort: '-date',
        limit: 1,
      });
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].slug).toBe('epsilon');
      expect(result.total).toBe(2);
    });
  });

  // -- get() ----------------------------------------------------------------

  describe('get()', () => {
    it('returns full entry by slug', async () => {
      makeSamplePosts(basePath);
      const entry = await provider.get('posts', 'alpha');
      expect(entry).not.toBeNull();
      expect(entry!.slug).toBe('alpha');
      expect(entry!.title).toBe('Alpha Post');
      expect(entry!.body).toBe('Full body of Alpha Post');
    });

    it('returns null for unknown slug', async () => {
      makeSamplePosts(basePath);
      const entry = await provider.get('posts', 'nonexistent');
      expect(entry).toBeNull();
    });

    it('sanitizes slug to prevent path traversal', async () => {
      makeSamplePosts(basePath);
      const entry = await provider.get('posts', '../../../etc/passwd');
      expect(entry).toBeNull();
    });
  });

  // -- constructor ----------------------------------------------------------

  describe('constructor', () => {
    it('uses custom basePath', async () => {
      const custom = makeTmpCollections();
      writeIndex(custom, 'widgets', [{ slug: 'w1', name: 'Widget One' }]);
      const customProvider = new FileCollectionProvider(custom);
      const result = await customProvider.list('widgets');
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].name).toBe('Widget One');
    });
  });
});
