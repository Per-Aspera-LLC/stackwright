import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-entry-pages-test-'));
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

function readEntryPageOutput(root: string, ...segments: string[]): any {
  const filePath = path.join(root, 'public', 'stackwright-content', ...segments);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function entryPageExists(root: string, ...segments: string[]): boolean {
  return fs.existsSync(path.join(root, 'public', 'stackwright-content', ...segments));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runPrebuild — entry page generation', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('does not generate entry pages when entryPage is absent', () => {
    writeCollectionConfig(root, 'posts', 'sort: -date\n');
    writeCollectionEntry(root, 'posts', 'hello.yaml', 'title: Hello\nbody: Hello world\n');
    runPrebuild(root);
    // Should NOT have blog/ directory in stackwright-content
    expect(entryPageExists(root, 'blog')).toBe(false);
  });

  it('generates entry page JSON when entryPage config is present', () => {
    writeCollectionConfig(
      root,
      'posts',
      'sort: -date\nentryPage:\n  basePath: /blog/\n  body: body\n  meta:\n    - date\n'
    );
    writeCollectionEntry(
      root,
      'posts',
      'hello.yaml',
      'title: Hello\ndate: "2025-06-01"\nbody: Hello world\n'
    );
    runPrebuild(root);
    expect(entryPageExists(root, 'blog', 'hello.json')).toBe(true);
  });

  it('generates valid PageContent structure', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(
      root,
      'posts',
      'test-post.yaml',
      'title: Test Post\nbody: Some content here\n'
    );
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'test-post.json');
    expect(page).toHaveProperty('content');
    expect(page.content).toHaveProperty('content_items');
    expect(Array.isArray(page.content.content_items)).toBe(true);
    expect(page.content.content_items.length).toBeGreaterThan(0);
  });

  it('uses title field from entry as heading', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'my-post.yaml', 'title: My Great Post\nbody: Content\n');
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'my-post.json');
    const mainItem = page.content.content_items[0];
    expect(mainItem.type).toBe('main');
    expect(mainItem.heading.text).toBe('My Great Post');
  });

  it('falls back to slug when title field is missing', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'no-title.yaml', 'body: Just body content\n');
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'no-title.json');
    expect(page.content.content_items[0].heading.text).toBe('no-title');
  });

  it('renders body field as body1 text block', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(
      root,
      'posts',
      'post.yaml',
      'title: Post\nbody: This is the body content.\n'
    );
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const bodyBlock = textBlocks.find((b: any) => b.textSize === 'body1');
    expect(bodyBlock).toBeDefined();
    expect(bodyBlock.text).toBe('This is the body content.');
  });

  it('renders meta fields as subtitle2 text block', () => {
    writeCollectionConfig(
      root,
      'posts',
      'entryPage:\n  basePath: /blog/\n  body: body\n  meta:\n    - date\n    - author\n'
    );
    writeCollectionEntry(
      root,
      'posts',
      'post.yaml',
      'title: Post\ndate: "2025-06-15"\nauthor: Charles\nbody: Content\n'
    );
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const metaBlock = textBlocks.find((b: any) => b.textSize === 'subtitle2');
    expect(metaBlock).toBeDefined();
    // Should contain formatted date and author
    expect(metaBlock.text).toContain('Charles');
    expect(metaBlock.text).toContain('2025'); // date should be formatted
  });

  it('renders tags in meta line', () => {
    writeCollectionConfig(
      root,
      'posts',
      'entryPage:\n  basePath: /blog/\n  body: body\n  tags: tags\n'
    );
    writeCollectionEntry(
      root,
      'posts',
      'tagged.yaml',
      'title: Tagged Post\nbody: Content\ntags:\n  - javascript\n  - react\n'
    );
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'tagged.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const metaBlock = textBlocks.find((b: any) => b.textSize === 'subtitle2');
    expect(metaBlock).toBeDefined();
    expect(metaBlock.text).toContain('javascript');
    expect(metaBlock.text).toContain('react');
  });

  it('includes back button with basePath href', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const buttons = page.content.content_items[0].buttons;
    expect(buttons).toBeDefined();
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0].href).toBe('/blog');
    expect(buttons[0].variant).toBe('text');
  });

  it('generates pages for multiple entries', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'first.yaml', 'title: First\nbody: First post\n');
    writeCollectionEntry(root, 'posts', 'second.yaml', 'title: Second\nbody: Second post\n');
    writeCollectionEntry(root, 'posts', 'third.yaml', 'title: Third\nbody: Third post\n');
    runPrebuild(root);

    expect(entryPageExists(root, 'blog', 'first.json')).toBe(true);
    expect(entryPageExists(root, 'blog', 'second.json')).toBe(true);
    expect(entryPageExists(root, 'blog', 'third.json')).toBe(true);
  });

  it('handles basePath without trailing slash', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /articles\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    runPrebuild(root);

    expect(entryPageExists(root, 'articles', 'post.json')).toBe(true);
  });

  it('handles nested basePath', () => {
    writeCollectionConfig(root, 'docs', 'entryPage:\n  basePath: /docs/api/\n  body: content\n');
    writeCollectionEntry(root, 'docs', 'users.yaml', 'title: Users API\ncontent: User endpoints\n');
    runPrebuild(root);

    expect(entryPageExists(root, 'docs', 'api', 'users.json')).toBe(true);
  });

  it('uses first indexField as title when indexFields is configured', () => {
    writeCollectionConfig(
      root,
      'products',
      'indexFields:\n  - name\n  - price\nentryPage:\n  basePath: /shop/\n  body: description\n'
    );
    writeCollectionEntry(
      root,
      'products',
      'widget.yaml',
      'name: Super Widget\nprice: 9.99\ndescription: A great widget\n'
    );
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'shop', 'widget.json');
    expect(page.content.content_items[0].heading.text).toBe('Super Widget');
  });

  it('still generates collection index and entry JSON alongside entry pages', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    runPrebuild(root);

    // Entry page should exist
    expect(entryPageExists(root, 'blog', 'post.json')).toBe(true);
    // Collection data should also still exist
    const collectionsDir = path.join(root, 'public', 'stackwright-content', 'collections', 'posts');
    expect(fs.existsSync(path.join(collectionsDir, '_index.json'))).toBe(true);
    expect(fs.existsSync(path.join(collectionsDir, 'post.json'))).toBe(true);
  });

  it('rejects path-traversal basePath', () => {
    writeCollectionConfig(
      root,
      'evil',
      'entryPage:\n  basePath: "/../../../tmp/pwned/"\n  body: body\n'
    );
    writeCollectionEntry(root, 'evil', 'payload.yaml', 'title: Pwned\nbody: gotcha\n');
    expect(() => runPrebuild(root)).toThrow(/outside.*content output/i);
  });

  it('ignores slug field in YAML that would cause path traversal', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    // Write a YAML file with a malicious slug field
    writeCollectionEntry(
      root,
      'posts',
      'safe-name.yaml',
      'slug: "../../../tmp/evil"\ntitle: Sneaky\nbody: gotcha\n'
    );
    runPrebuild(root);

    // The entry page should use the filename-derived slug, not the YAML slug
    expect(entryPageExists(root, 'blog', 'safe-name.json')).toBe(true);
    // The traversal path should NOT exist
    expect(fs.existsSync(path.join(root, 'tmp'))).toBe(false);
  });
  it('sets content item label to collectionName-entry-slug', () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'my-post.yaml', 'title: My Post\nbody: Content\n');
    runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'my-post.json');
    expect(page.content.content_items[0].label).toBe('posts-entry-my-post');
  });
});
