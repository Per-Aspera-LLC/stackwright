import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-collections-prebuild-'));
  // Minimal valid site config
  fs.writeFileSync(
    path.join(root, 'stackwright.yml'),
    'title: Test Site\nnavigation: []\nappBar:\n  titleText: Test Site\n'
  );
  fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
  return root;
}

function writeCollectionEntry(
  root: string,
  collection: string,
  filename: string,
  content: string
): void {
  const dir = path.join(root, 'content', collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

function writeCollectionConfig(root: string, collection: string, content: string): void {
  const dir = path.join(root, 'content', collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, '_collection.yaml'), content, 'utf8');
}

function readCollectionOutput(root: string, collection: string, file: string): any {
  const filePath = path.join(
    root,
    'public',
    'stackwright-content',
    'collections',
    collection,
    file
  );
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectionOutputExists(root: string, collection: string, file: string): boolean {
  return fs.existsSync(
    path.join(root, 'public', 'stackwright-content', 'collections', collection, file)
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runPrebuild -- collections', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('does not crash when content/ directory does not exist', () => {
    expect(() => runPrebuild(root)).not.toThrow();
  });

  it('does not crash when content/ exists but is empty', () => {
    fs.mkdirSync(path.join(root, 'content'), { recursive: true });
    expect(() => runPrebuild(root)).not.toThrow();
  });

  it('creates collection output directory structure', () => {
    writeCollectionEntry(root, 'posts', 'hello.yaml', 'title: Hello\n');
    runPrebuild(root);
    expect(collectionOutputExists(root, 'posts', '_index.json')).toBe(true);
  });

  it('writes _index.json manifest with correct slugs', () => {
    writeCollectionEntry(root, 'posts', 'first.yaml', 'title: First Post\n');
    writeCollectionEntry(root, 'posts', 'second.yml', 'title: Second Post\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index).toHaveLength(2);
    const slugs = index.map((e: any) => e.slug).sort();
    expect(slugs).toEqual(['first', 'second']);
  });

  it('writes individual entry JSON files', () => {
    writeCollectionEntry(root, 'posts', 'my-post.yaml', 'title: My Post\nauthor: Charles\n');
    runPrebuild(root);

    const entry = readCollectionOutput(root, 'posts', 'my-post.json');
    expect(entry.slug).toBe('my-post');
    expect(entry.title).toBe('My Post');
    expect(entry.author).toBe('Charles');
  });

  it('adds slug field derived from filename', () => {
    writeCollectionEntry(root, 'docs', 'getting-started.yaml', 'title: Getting Started\n');
    runPrebuild(root);

    const entry = readCollectionOutput(root, 'docs', 'getting-started.json');
    expect(entry.slug).toBe('getting-started');
  });

  it('respects _collection.yaml sort field', () => {
    writeCollectionConfig(root, 'posts', 'sort: -date\n');
    writeCollectionEntry(root, 'posts', 'old.yaml', 'title: Old\ndate: "2025-01-01"\n');
    writeCollectionEntry(root, 'posts', 'new.yaml', 'title: New\ndate: "2026-06-01"\n');
    writeCollectionEntry(root, 'posts', 'mid.yaml', 'title: Mid\ndate: "2025-06-01"\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    const dates = index.map((e: any) => e.date);
    expect(dates).toEqual(['2026-06-01', '2025-06-01', '2025-01-01']);
  });

  it('respects _collection.yaml indexFields', () => {
    writeCollectionConfig(root, 'posts', 'indexFields:\n  - title\n  - date\n');
    writeCollectionEntry(
      root,
      'posts',
      'full.yaml',
      'title: Full Post\ndate: "2026-01-01"\nauthor: Charles\nbody: "Long content here"\n'
    );
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index[0]).toHaveProperty('slug');
    expect(index[0]).toHaveProperty('title');
    expect(index[0]).toHaveProperty('date');
    expect(index[0]).not.toHaveProperty('author');
    expect(index[0]).not.toHaveProperty('body');
  });

  it('defaults to all scalar fields when no indexFields specified', () => {
    writeCollectionEntry(
      root,
      'posts',
      'entry.yaml',
      'title: Entry\ncount: 42\nactive: true\ntags:\n  - a\n  - b\nmeta:\n  nested: value\n'
    );
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index[0]).toHaveProperty('title', 'Entry');
    expect(index[0]).toHaveProperty('count', 42);
    expect(index[0]).toHaveProperty('active', true);
    expect(index[0]).toHaveProperty('tags', ['a', 'b']); // scalar arrays included
    expect(index[0]).not.toHaveProperty('meta'); // objects excluded
  });

  it('skips _collection.yaml as an entry', () => {
    writeCollectionConfig(root, 'posts', 'sort: title\n');
    writeCollectionEntry(root, 'posts', 'real-entry.yaml', 'title: Real Entry\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index).toHaveLength(1);
    expect(index[0].slug).toBe('real-entry');
    expect(collectionOutputExists(root, 'posts', '_collection.json')).toBe(false);
  });

  it('skips _collection.yml as an entry', () => {
    const dir = path.join(root, 'content', 'posts');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '_collection.yml'), 'sort: title\n');
    writeCollectionEntry(root, 'posts', 'entry.yaml', 'title: Entry\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index).toHaveLength(1);
  });

  it('handles empty collection directory gracefully', () => {
    fs.mkdirSync(path.join(root, 'content', 'empty'), { recursive: true });
    expect(() => runPrebuild(root)).not.toThrow();
  });

  it('skips entries that are not YAML objects', () => {
    // A YAML file containing just a string or array
    writeCollectionEntry(root, 'posts', 'bad.yaml', '"just a string"\n');
    writeCollectionEntry(root, 'posts', 'good.yaml', 'title: Good\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    expect(index).toHaveLength(1);
    expect(index[0].slug).toBe('good');
  });

  it('rewrites ./relative image paths in entries', () => {
    writeCollectionEntry(
      root,
      'posts',
      'with-image.yaml',
      'title: Post With Image\ncover: "./hero.png"\n'
    );
    // Write a fake image file
    const entryDir = path.join(root, 'content', 'posts');
    fs.writeFileSync(path.join(entryDir, 'hero.png'), 'FAKE_PNG');

    runPrebuild(root);

    const entry = readCollectionOutput(root, 'posts', 'with-image.json');
    expect(entry.cover).toBe('/images/collections/posts/with-image/hero.png');
    expect(entry.cover).not.toContain('./');

    // Verify the image was actually copied
    const imageDest = path.join(
      root,
      'public',
      'images',
      'collections',
      'posts',
      'with-image',
      'hero.png'
    );
    expect(fs.existsSync(imageDest)).toBe(true);
    expect(fs.readFileSync(imageDest, 'utf8')).toBe('FAKE_PNG');
  });

  it('sorts alphabetically by slug when no sort config', () => {
    writeCollectionEntry(root, 'posts', 'charlie.yaml', 'title: Charlie\n');
    writeCollectionEntry(root, 'posts', 'alpha.yaml', 'title: Alpha\n');
    writeCollectionEntry(root, 'posts', 'bravo.yaml', 'title: Bravo\n');
    runPrebuild(root);

    const index = readCollectionOutput(root, 'posts', '_index.json');
    const slugs = index.map((e: any) => e.slug);
    expect(slugs).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('supports multiple collections in one project', () => {
    writeCollectionEntry(root, 'posts', 'post1.yaml', 'title: Post 1\n');
    writeCollectionEntry(root, 'docs', 'doc1.yaml', 'title: Doc 1\n');
    writeCollectionEntry(root, 'changelog', 'v1.yaml', 'version: "1.0"\n');
    runPrebuild(root);

    expect(collectionOutputExists(root, 'posts', '_index.json')).toBe(true);
    expect(collectionOutputExists(root, 'docs', '_index.json')).toBe(true);
    expect(collectionOutputExists(root, 'changelog', '_index.json')).toBe(true);
  });
});
