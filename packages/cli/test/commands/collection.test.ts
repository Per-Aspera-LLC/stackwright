import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { listCollections, addCollection } from '../../src/commands/collection';

function makeTmpContentDir(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-coll-test-'));
  const contentDir = path.join(root, 'content');
  fs.mkdirSync(contentDir, { recursive: true });
  return contentDir;
}

function writeCollectionEntry(
  contentDir: string,
  collection: string,
  filename: string,
  data: Record<string, unknown>
): void {
  const dir = path.join(contentDir, collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), yaml.dump(data), 'utf8');
}

function writeCollectionConfig(
  contentDir: string,
  collection: string,
  config: Record<string, unknown>
): void {
  const dir = path.join(contentDir, collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_collection.yaml'), yaml.dump(config), 'utf8');
}

describe('listCollections', () => {
  let contentDir: string;

  beforeEach(() => {
    contentDir = makeTmpContentDir();
  });

  it('returns empty when content dir does not exist', () => {
    const result = listCollections('/nonexistent/path');
    expect(result.collections).toEqual([]);
  });

  it('returns empty when content dir has no collections', () => {
    const result = listCollections(contentDir);
    expect(result.collections).toEqual([]);
  });

  it('lists collections with entry counts', () => {
    writeCollectionEntry(contentDir, 'posts', 'a.yaml', { title: 'A' });
    writeCollectionEntry(contentDir, 'posts', 'b.yaml', { title: 'B' });
    writeCollectionEntry(contentDir, 'docs', 'intro.yaml', { title: 'Intro' });

    const result = listCollections(contentDir);
    expect(result.collections).toHaveLength(2);

    const posts = result.collections.find((c) => c.name === 'posts');
    const docs = result.collections.find((c) => c.name === 'docs');
    expect(posts).toBeDefined();
    expect(posts!.entryCount).toBe(2);
    expect(docs).toBeDefined();
    expect(docs!.entryCount).toBe(1);
  });

  it('excludes _collection.yaml from entry count', () => {
    writeCollectionConfig(contentDir, 'posts', { sort: '-date' });
    writeCollectionEntry(contentDir, 'posts', 'a.yaml', { title: 'A' });

    const result = listCollections(contentDir);
    expect(result.collections[0].entryCount).toBe(1);
  });

  it('detects entryPage configuration', () => {
    writeCollectionConfig(contentDir, 'posts', {
      entryPage: { basePath: '/blog/', body: 'body' },
    });
    writeCollectionEntry(contentDir, 'posts', 'a.yaml', { title: 'A' });

    const result = listCollections(contentDir);
    expect(result.collections[0].hasEntryPage).toBe(true);
    expect(result.collections[0].basePath).toBe('/blog/');
  });

  it('reports hasEntryPage as false when no entryPage config', () => {
    writeCollectionConfig(contentDir, 'posts', { sort: '-date' });
    writeCollectionEntry(contentDir, 'posts', 'a.yaml', { title: 'A' });

    const result = listCollections(contentDir);
    expect(result.collections[0].hasEntryPage).toBe(false);
    expect(result.collections[0].basePath).toBeUndefined();
  });
});

describe('addCollection', () => {
  let contentDir: string;

  beforeEach(() => {
    contentDir = makeTmpContentDir();
  });

  it('creates collection directory', () => {
    const result = addCollection(contentDir, 'posts');
    expect(fs.existsSync(result.path)).toBe(true);
  });

  it('creates _collection.yaml config', () => {
    const result = addCollection(contentDir, 'posts');
    expect(fs.existsSync(result.configPath)).toBe(true);
    const config = yaml.load(fs.readFileSync(result.configPath, 'utf8')) as Record<string, any>;
    expect(config.indexFields).toBeDefined();
  });

  it('creates sample entry', () => {
    const result = addCollection(contentDir, 'posts');
    expect(fs.existsSync(result.sampleEntryPath)).toBe(true);
    const entry = yaml.load(fs.readFileSync(result.sampleEntryPath, 'utf8')) as Record<string, any>;
    expect(entry.title).toContain('Posts');
    expect(entry.body).toBeDefined();
  });

  it('includes entryPage config when --entry-page is set', () => {
    const result = addCollection(contentDir, 'posts', { entryPage: true });
    expect(result.entryPage).toBe(true);
    const config = yaml.load(fs.readFileSync(result.configPath, 'utf8')) as Record<string, any>;
    expect(config.entryPage).toBeDefined();
    expect(config.entryPage.basePath).toBe('/posts/');
    expect(config.entryPage.body).toBe('body');
  });

  it('uses custom basePath when provided', () => {
    addCollection(contentDir, 'articles', {
      entryPage: true,
      basePath: '/blog/',
    });
    const config = yaml.load(
      fs.readFileSync(path.join(contentDir, 'articles', '_collection.yaml'), 'utf8')
    ) as Record<string, any>;
    expect(config.entryPage.basePath).toBe('/blog/');
  });

  it('uses custom sort field', () => {
    addCollection(contentDir, 'posts', { sort: '-date' });
    const config = yaml.load(
      fs.readFileSync(path.join(contentDir, 'posts', '_collection.yaml'), 'utf8')
    ) as Record<string, any>;
    expect(config.sort).toBe('-date');
  });

  it('uses custom body field', () => {
    addCollection(contentDir, 'docs', {
      entryPage: true,
      bodyField: 'content',
    });
    const config = yaml.load(
      fs.readFileSync(path.join(contentDir, 'docs', '_collection.yaml'), 'utf8')
    ) as Record<string, any>;
    expect(config.entryPage.body).toBe('content');
  });


  it('rejects names with path traversal characters', () => {
    expect(() => addCollection(contentDir, '../../../evil')).toThrow(/Invalid collection name/);
  });

  it('rejects names starting with special characters', () => {
    expect(() => addCollection(contentDir, '.hidden')).toThrow(/Invalid collection name/);
    expect(() => addCollection(contentDir, '-dash')).toThrow(/Invalid collection name/);
  });

  it('accepts valid collection names', () => {
    expect(() => addCollection(contentDir, 'my-posts')).not.toThrow();
    expect(() => addCollection(contentDir, 'docs_v2')).not.toThrow();
    expect(() => addCollection(contentDir, 'Blog123')).not.toThrow();
  });
  it('throws when collection already exists', () => {
    addCollection(contentDir, 'posts');
    expect(() => addCollection(contentDir, 'posts')).toThrow(/already exists/);
  });

  it('sets error code COLLECTION_EXISTS on duplicate', () => {
    addCollection(contentDir, 'posts');
    try {
      addCollection(contentDir, 'posts');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('COLLECTION_EXISTS');
    }
  });
});
