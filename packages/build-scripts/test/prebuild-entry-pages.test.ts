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

  it('does not generate entry pages when entryPage is absent', async () => {
    writeCollectionConfig(root, 'posts', 'sort: -date\n');
    writeCollectionEntry(root, 'posts', 'hello.yaml', 'title: Hello\nbody: Hello world\n');
    await runPrebuild(root);
    // Should NOT have blog/ directory in stackwright-content
    expect(entryPageExists(root, 'blog')).toBe(false);
  });

  it('generates entry page JSON when entryPage config is present', async () => {
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
    await runPrebuild(root);
    expect(entryPageExists(root, 'blog', 'hello.json')).toBe(true);
  });

  it('generates valid PageContent structure', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(
      root,
      'posts',
      'test-post.yaml',
      'title: Test Post\nbody: Some content here\n'
    );
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'test-post.json');
    expect(page).toHaveProperty('content');
    expect(page.content).toHaveProperty('content_items');
    expect(Array.isArray(page.content.content_items)).toBe(true);
    expect(page.content.content_items.length).toBeGreaterThan(0);
  });

  it('uses title field from entry as heading', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'my-post.yaml', 'title: My Great Post\nbody: Content\n');
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'my-post.json');
    const mainItem = page.content.content_items[0];
    expect(mainItem.type).toBe('main');
    expect(mainItem.heading.text).toBe('My Great Post');
  });

  it('falls back to slug when title field is missing', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'no-title.yaml', 'body: Just body content\n');
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'no-title.json');
    expect(page.content.content_items[0].heading.text).toBe('no-title');
  });

  it('renders body field as body1 text block', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(
      root,
      'posts',
      'post.yaml',
      'title: Post\nbody: This is the body content.\n'
    );
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const bodyBlock = textBlocks.find((b: any) => b.textSize === 'body1');
    expect(bodyBlock).toBeDefined();
    expect(bodyBlock.text).toBe('This is the body content.');
  });

  it('renders meta fields as subtitle2 text block', async () => {
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
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const metaBlock = textBlocks.find((b: any) => b.textSize === 'subtitle2');
    expect(metaBlock).toBeDefined();
    // Should contain formatted date and author
    expect(metaBlock.text).toContain('Charles');
    expect(metaBlock.text).toContain('2025'); // date should be formatted
  });

  it('renders tags in meta line', async () => {
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
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'tagged.json');
    const textBlocks = page.content.content_items[0].textBlocks;
    const metaBlock = textBlocks.find((b: any) => b.textSize === 'subtitle2');
    expect(metaBlock).toBeDefined();
    expect(metaBlock.text).toContain('javascript');
    expect(metaBlock.text).toContain('react');
  });

  it('includes back button with basePath href', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'post.json');
    const buttons = page.content.content_items[0].buttons;
    expect(buttons).toBeDefined();
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0].href).toBe('/blog');
    expect(buttons[0].variant).toBe('text');
  });

  it('generates pages for multiple entries', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'first.yaml', 'title: First\nbody: First post\n');
    writeCollectionEntry(root, 'posts', 'second.yaml', 'title: Second\nbody: Second post\n');
    writeCollectionEntry(root, 'posts', 'third.yaml', 'title: Third\nbody: Third post\n');
    await runPrebuild(root);

    expect(entryPageExists(root, 'blog', 'first.json')).toBe(true);
    expect(entryPageExists(root, 'blog', 'second.json')).toBe(true);
    expect(entryPageExists(root, 'blog', 'third.json')).toBe(true);
  });

  it('handles basePath without trailing slash', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /articles\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    await runPrebuild(root);

    expect(entryPageExists(root, 'articles', 'post.json')).toBe(true);
  });

  it('handles nested basePath', async () => {
    writeCollectionConfig(root, 'docs', 'entryPage:\n  basePath: /docs/api/\n  body: content\n');
    writeCollectionEntry(root, 'docs', 'users.yaml', 'title: Users API\ncontent: User endpoints\n');
    await runPrebuild(root);

    expect(entryPageExists(root, 'docs', 'api', 'users.json')).toBe(true);
  });

  it('uses first indexField as title when indexFields is configured', async () => {
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
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'shop', 'widget.json');
    expect(page.content.content_items[0].heading.text).toBe('Super Widget');
  });

  it('still generates collection index and entry JSON alongside entry pages', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\nbody: Content\n');
    await runPrebuild(root);

    // Entry page should exist
    expect(entryPageExists(root, 'blog', 'post.json')).toBe(true);
    // Collection data should also still exist
    const collectionsDir = path.join(root, 'public', 'stackwright-content', 'collections', 'posts');
    expect(fs.existsSync(path.join(collectionsDir, '_index.json'))).toBe(true);
    expect(fs.existsSync(path.join(collectionsDir, 'post.json'))).toBe(true);
  });

  it('rejects path-traversal basePath', async () => {
    writeCollectionConfig(
      root,
      'evil',
      'entryPage:\n  basePath: "/../../../tmp/pwned/"\n  body: body\n'
    );
    writeCollectionEntry(root, 'evil', 'payload.yaml', 'title: Pwned\nbody: gotcha\n');
      await expect(runPrebuild(root)).rejects.toThrow(/outside.*content output/i);
  });

  it('ignores slug field in YAML that would cause path traversal', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    // Write a YAML file with a malicious slug field
    writeCollectionEntry(
      root,
      'posts',
      'safe-name.yaml',
      'slug: "../../../tmp/evil"\ntitle: Sneaky\nbody: gotcha\n'
    );
    await runPrebuild(root);

    // The entry page should use the filename-derived slug, not the YAML slug
    expect(entryPageExists(root, 'blog', 'safe-name.json')).toBe(true);
    // The traversal path should NOT exist
    expect(fs.existsSync(path.join(root, 'tmp'))).toBe(false);
  });
  it('sets content item label to collectionName-entry-slug', async () => {
    writeCollectionConfig(root, 'posts', 'entryPage:\n  basePath: /blog/\n  body: body\n');
    writeCollectionEntry(root, 'posts', 'my-post.yaml', 'title: My Post\nbody: Content\n');
    await runPrebuild(root);

    const page = readEntryPageOutput(root, 'blog', 'my-post.json');
    expect(page.content.content_items[0].label).toBe('posts-entry-my-post');
  });

  describe('template-based entry pages', () => {
    it('resolves {{field}} placeholders in template', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: "{{slug}}-entry"',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textBlocks:',
          '          - text: "{{body}}"',
          '            textSize: body1',
        ].join('\n')
      );
      writeCollectionEntry(
        root,
        'posts',
        'hello.yaml',
        'title: Hello World\nbody: This is the body.\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'hello.json');
      expect(page.content.content_items[0].heading.text).toBe('Hello World');
      expect(page.content.content_items[0].textBlocks[0].text).toBe('This is the body.');
      expect(page.content.content_items[0].label).toBe('hello-entry');
    });

    it('interpolates multiple {{fields}} in a single string', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textBlocks:',
          '          - text: "{{date}} \u00b7 {{author}}"',
          '            textSize: subtitle2',
        ].join('\n')
      );
      writeCollectionEntry(
        root,
        'posts',
        'post.yaml',
        'title: Post\ndate: "2025-06-15"\nauthor: Charles\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'post.json');
      const metaBlock = page.content.content_items[0].textBlocks[0];
      expect(metaBlock.text).toBe('2025-06-15 \u00b7 Charles');
    });

    it('resolves {{tags}} array to comma-separated string in interpolation', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textBlocks:',
          '          - text: "Tags: {{tags}}"',
          '            textSize: caption',
        ].join('\n')
      );
      writeCollectionEntry(
        root,
        'posts',
        'tagged.yaml',
        'title: Tagged\ntags:\n  - javascript\n  - react\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'tagged.json');
      expect(page.content.content_items[0].textBlocks[0].text).toBe('Tags: javascript, react');
    });

    it('omits text blocks when {{field}} resolves to null (missing field)', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textBlocks:',
          '          - text: "{{subtitle}}"',
          '            textSize: subtitle1',
          '          - text: "{{body}}"',
          '            textSize: body1',
        ].join('\n')
      );
      // Entry has body but NOT subtitle
      writeCollectionEntry(
        root,
        'posts',
        'no-subtitle.yaml',
        'title: No Subtitle\nbody: Has body though\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'no-subtitle.json');
      const textBlocks = page.content.content_items[0].textBlocks;
      // Only the body block should remain; subtitle was omitted
      expect(textBlocks).toHaveLength(1);
      expect(textBlocks[0].text).toBe('Has body though');
      expect(textBlocks[0].textSize).toBe('body1');
    });

    it('omits interpolated string when ALL fields are missing', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textBlocks:',
          '          - text: "{{date}} \u00b7 {{author}}"',
          '            textSize: subtitle2',
          '          - text: "{{body}}"',
          '            textSize: body1',
        ].join('\n')
      );
      // Entry has title and body but NOT date or author
      writeCollectionEntry(root, 'posts', 'minimal.yaml', 'title: Minimal\nbody: Just the body\n');
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'minimal.json');
      const textBlocks = page.content.content_items[0].textBlocks;
      // The "{{date}} · {{author}}" block should be omitted since both fields are missing
      expect(textBlocks).toHaveLength(1);
      expect(textBlocks[0].text).toBe('Just the body');
    });

    it('passes through literal strings without {{}} unchanged', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: blog-entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        buttons:',
          '          - text: "\u2190 Back to Blog"',
          '            textSize: body1',
          '            variant: text',
          '            href: /blog',
        ].join('\n')
      );
      writeCollectionEntry(root, 'posts', 'post.yaml', 'title: My Post\n');
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'post.json');
      const buttons = page.content.content_items[0].buttons;
      expect(buttons[0].text).toBe('\u2190 Back to Blog');
      expect(buttons[0].href).toBe('/blog');
    });

    it('supports multiple content items in template', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: header',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h2',
          '      - type: main',
          '        label: body-section',
          '        heading:',
          '          text: Content',
          '          textSize: h4',
          '        textBlocks:',
          '          - text: "{{body}}"',
          '            textSize: body1',
          '      - type: main',
          '        label: footer',
          '        heading:',
          '          text: "Written by {{author}}"',
          '          textSize: h6',
        ].join('\n')
      );
      writeCollectionEntry(
        root,
        'posts',
        'multi.yaml',
        'title: Multi Section\nauthor: Alice\nbody: The main content\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'multi.json');
      expect(page.content.content_items).toHaveLength(3);
      expect(page.content.content_items[0].heading.text).toBe('Multi Section');
      expect(page.content.content_items[1].textBlocks[0].text).toBe('The main content');
      expect(page.content.content_items[2].heading.text).toBe('Written by Alice');
    });

    it('supports media blocks with {{field}} src', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        media:',
          '          type: image',
          '          src: "{{cover_image}}"',
          '          label: "{{title}}"',
        ].join('\n')
      );
      writeCollectionEntry(
        root,
        'posts',
        'with-image.yaml',
        'title: Has Image\ncover_image: /images/hero.png\n'
      );
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'with-image.json');
      const mainItem = page.content.content_items[0];
      expect(mainItem.media.src).toBe('/images/hero.png');
      expect(mainItem.media.label).toBe('Has Image');
    });

    it('omits media object keys when {{field}} is missing', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        media:',
          '          type: image',
          '          src: "{{cover_image}}"',
          '          label: "{{title}}"',
        ].join('\n')
      );
      // Entry does NOT have cover_image
      writeCollectionEntry(root, 'posts', 'no-image.yaml', 'title: No Image\n');
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'no-image.json');
      const mainItem = page.content.content_items[0];
      // media object should be present but without src (since it resolved to null and was omitted)
      // The media object has type: "image" and label: "No Image" but no src
      expect(mainItem.media?.src).toBeUndefined();
    });

    it('preserves numeric and boolean values in template', async () => {
      writeCollectionConfig(
        root,
        'posts',
        [
          'entryPage:',
          '  basePath: /blog/',
          '  template:',
          '    content_items:',
          '      - type: main',
          '        label: entry',
          '        heading:',
          '          text: "{{title}}"',
          '          textSize: h3',
          '        textToGraphic: 65',
        ].join('\n')
      );
      writeCollectionEntry(root, 'posts', 'post.yaml', 'title: Post\n');
      await runPrebuild(root);

      const page = readEntryPageOutput(root, 'blog', 'post.json');
      expect(page.content.content_items[0].textToGraphic).toBe(65);
    });
  });
});
