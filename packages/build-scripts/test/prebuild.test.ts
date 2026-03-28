import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-prebuild-test-'));
  // Minimal valid site config (satisfies siteConfigSchema: title, navigation, appBar required)
  fs.writeFileSync(
    path.join(root, 'stackwright.yml'),
    `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
`
  );
  fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
  return root;
}

function writePageContent(root: string, slug: string, content: string): void {
  const dir = path.join(root, 'pages', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), content, 'utf8');
}

function _writeFakeImage(dir: string, filename: string): void {
  fs.mkdirSync(dir, { recursive: true });
  // Write a minimal 1x1 PNG header (enough to be non-empty)
  fs.writeFileSync(path.join(dir, filename), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
}

// ---------------------------------------------------------------------------
// Basic output
// ---------------------------------------------------------------------------

describe('runPrebuild — basic output', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('creates public/stackwright-content/_site.json from stackwright.yml', async () => {
    await runPrebuild(root);
    const siteJson = path.join(root, 'public', 'stackwright-content', '_site.json');
    expect(fs.existsSync(siteJson)).toBe(true);
  });

  it('_site.json is valid JSON', async () => {
    await runPrebuild(root);
    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', '_site.json'),
      'utf8'
    );
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('creates a slug JSON file for each page', async () => {
    writePageContent(root, 'about', `content:\n  content_items: []\n`);
    await runPrebuild(root);
    const aboutJson = path.join(root, 'public', 'stackwright-content', 'about.json');
    expect(fs.existsSync(aboutJson)).toBe(true);
  });

  it('produces valid JSON for each page', async () => {
    writePageContent(root, 'contact', `content:\n  content_items: []\n`);
    await runPrebuild(root);
    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'contact.json'),
      'utf8'
    );
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('exits with error when stackwright.yml is missing', async () => {
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-no-config-'));
    fs.mkdirSync(path.join(emptyRoot, 'pages'), { recursive: true });
    await expect(runPrebuild(emptyRoot)).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Image collision prevention
// ---------------------------------------------------------------------------

describe('runPrebuild — image collision prevention', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('writes images from different pages to different destination paths (no collision)', async () => {
    // Two pages each with a hero.png — they must not overwrite each other.
    const pageADir = path.join(root, 'pages', 'page-a');
    const pageBDir = path.join(root, 'pages', 'page-b');
    const pageWithImage = (label: string) =>
      `content:\n  content_items:\n    - type: main\n      label: "${label}"\n      heading:\n        text: "Heading"\n        textSize: "h1"\n      textBlocks: []\n      media:\n        label: "${label}-img"\n        src: "./hero.png"\n        type: "image"\n`;
    writePageContent(root, 'page-a', pageWithImage('page-a'));
    writePageContent(root, 'page-b', pageWithImage('page-b'));

    // Write distinct image content so we can tell them apart after copy
    fs.writeFileSync(path.join(pageADir, 'hero.png'), 'IMAGE_A');
    fs.writeFileSync(path.join(pageBDir, 'hero.png'), 'IMAGE_B');

    await runPrebuild(root);

    const destA = path.join(root, 'public', 'images', 'page-a', 'hero.png');
    const destB = path.join(root, 'public', 'images', 'page-b', 'hero.png');

    expect(fs.existsSync(destA)).toBe(true);
    expect(fs.existsSync(destB)).toBe(true);

    // Contents must be different — no collision
    const contentA = fs.readFileSync(destA, 'utf8');
    const contentB = fs.readFileSync(destB, 'utf8');
    expect(contentA).toBe('IMAGE_A');
    expect(contentB).toBe('IMAGE_B');
  });

  it('rewrites relative image paths to /images/<slug>/filename in output JSON', async () => {
    const pageDir = path.join(root, 'pages', 'blog');
    writePageContent(
      root,
      'blog',
      `content:\n  content_items:\n    - type: main\n      label: "blog-hero"\n      heading:\n        text: "Blog"\n        textSize: "h1"\n      textBlocks: []\n      media:\n        label: "blog-thumb"\n        src: "./thumb.png"\n        type: "image"\n`
    );
    fs.writeFileSync(path.join(pageDir, 'thumb.png'), 'THUMB_DATA');

    await runPrebuild(root);

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'blog.json'),
      'utf8'
    );
    const json = JSON.parse(raw);
    const jsonStr = JSON.stringify(json);
    // Path should be rewritten to include /images/blog/
    expect(jsonStr).toContain('/images/blog/thumb.png');
    // Original relative path should no longer appear
    expect(jsonStr).not.toContain('./thumb.png');
  });
});

// ---------------------------------------------------------------------------
// Missing images
// ---------------------------------------------------------------------------

describe('runPrebuild — missing images', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('does not throw when a referenced image file is missing', async () => {
    writePageContent(
      root,
      'missing-img',
      `content:\n  content_items:\n    - type: main\n      label: "missing-hero"\n      heading:\n        text: "Missing"\n        textSize: "h1"\n      textBlocks: []\n      media:\n        label: "missing-img"\n        src: "./does-not-exist.png"\n        type: "image"\n`
    );
    // Should warn but not crash
    await expect(runPrebuild(root)).resolves.not.toThrow();
  });

  it('leaves the original path unchanged when image is missing', async () => {
    writePageContent(
      root,
      'missing-img',
      `content:\n  content_items:\n    - type: main\n      label: "missing-hero"\n      heading:\n        text: "Missing"\n        textSize: "h1"\n      textBlocks: []\n      media:\n        label: "missing-img"\n        src: "./does-not-exist.png"\n        type: "image"\n`
    );
    await runPrebuild(root);
    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'missing-img.json'),
      'utf8'
    );
    expect(raw).toContain('./does-not-exist.png');
  });
});

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('runPrebuild — schema validation', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('exits when stackwright.yml is missing required fields', async () => {
    // Write a site config that omits required fields (title, appBar)
    fs.writeFileSync(path.join(root, 'stackwright.yml'), `navigation: []\n`);
    await expect(runPrebuild(root)).rejects.toThrow();
  });

  it('exits when a page content file has an invalid structure', async () => {
    // content_items is required inside content; omitting it should fail
    writePageContent(root, 'bad-page', `content:\n  heading: "oops"\n`);
    await expect(runPrebuild(root)).rejects.toThrow();
  });

  it('accepts a valid site config and valid page without throwing', async () => {
    writePageContent(root, 'valid', `content:\n  content_items: []\n`);
    await expect(runPrebuild(root)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// collection_list entry injection
// ---------------------------------------------------------------------------

function writeCollectionEntry(root: string, collection: string, slug: string, yaml: string): void {
  const dir = path.join(root, 'content', collection);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.yaml`), yaml, 'utf8');
}

describe('runPrebuild — collection_list entry injection', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
    // Create two collection entries
    writeCollectionEntry(
      root,
      'posts',
      'alpha',
      `title: Alpha Post\ndate: "2026-01-01"\nexcerpt: First post\n`
    );
    writeCollectionEntry(
      root,
      'posts',
      'beta',
      `title: Beta Post\ndate: "2026-02-01"\nexcerpt: Second post\n`
    );
  });

  it('injects _entries into collection_list content items', async () => {
    writePageContent(
      root,
      'blog',
      `content:\n  content_items:\n    - type: collection_list\n      label: "posts-list"\n      source: posts\n      card:\n        title: title\n`
    );
    await runPrebuild(root);

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'blog.json'),
      'utf8'
    );
    const json = JSON.parse(raw);
    const clItem = json.content.content_items.find((item: any) => item.type === 'collection_list');
    expect(clItem).toBeDefined();
    expect(clItem._entries).toBeInstanceOf(Array);
    expect(clItem._entries.length).toBe(2);
  });

  it('_entries contain expected fields from collection index', async () => {
    writePageContent(
      root,
      'blog',
      `content:\n  content_items:\n    - type: collection_list\n      label: "posts-list"\n      source: posts\n      card:\n        title: title\n`
    );
    await runPrebuild(root);

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'blog.json'),
      'utf8'
    );
    const json = JSON.parse(raw);
    const entries = json.content.content_items[0]._entries;
    const slugs = entries.map((e: any) => e.slug).sort();
    expect(slugs).toEqual(['alpha', 'beta']);
    expect(entries.every((e: any) => 'title' in e)).toBe(true);
  });

  it('does not crash when collection_list references unknown collection', async () => {
    writePageContent(
      root,
      'bad-ref',
      `content:\n  content_items:\n    - type: collection_list\n      label: "missing"\n      source: nonexistent\n      card:\n        title: title\n`
    );
    // Should warn but not throw
    await expect(runPrebuild(root)).resolves.not.toThrow();

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'bad-ref.json'),
      'utf8'
    );
    const json = JSON.parse(raw);
    const cl = json.content.content_items[0];
    // _entries should be absent (not injected)
    expect(cl._entries).toBeUndefined();
  });

  it('preserves non-collection_list content items unchanged', async () => {
    writePageContent(
      root,
      'mixed',
      `content:\n  content_items:\n    - type: main\n      label: hero\n      heading:\n        text: Hello\n        textSize: h1\n      textBlocks: []\n    - type: collection_list\n      label: posts\n      source: posts\n      card:\n        title: title\n`
    );
    await runPrebuild(root);

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'mixed.json'),
      'utf8'
    );
    const json = JSON.parse(raw);
    expect(json.content.content_items).toHaveLength(2);
    expect(json.content.content_items[0].label).toBe('hero');
    expect(json.content.content_items[1]._entries).toBeInstanceOf(Array);
  });
});

// ---------------------------------------------------------------------------
// Video file co-location
// ---------------------------------------------------------------------------

describe('runPrebuild — video file co-location', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('copies a co-located .mp4 file to public/images/', async () => {
    const pageDir = path.join(root, 'pages', 'hero');
    writePageContent(
      root,
      'hero',
      `content:\n  content_items:\n    - type: video\n      label: "hero-video"\n      src: "./demo.mp4"\n`
    );
    fs.writeFileSync(path.join(pageDir, 'demo.mp4'), 'FAKE_MP4_DATA');

    await runPrebuild(root);

    const dest = path.join(root, 'public', 'images', 'hero', 'demo.mp4');
    expect(fs.existsSync(dest)).toBe(true);
    expect(fs.readFileSync(dest, 'utf8')).toBe('FAKE_MP4_DATA');
  });

  it('rewrites relative video path to /images/<slug>/filename in output JSON', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    writePageContent(
      root,
      'about',
      `content:\n  content_items:\n    - type: video\n      label: "about-video"\n      src: "./intro.webm"\n`
    );
    fs.writeFileSync(path.join(pageDir, 'intro.webm'), 'FAKE_WEBM');

    await runPrebuild(root);

    const raw = fs.readFileSync(
      path.join(root, 'public', 'stackwright-content', 'about.json'),
      'utf8'
    );
    expect(raw).toContain('/images/about/intro.webm');
    expect(raw).not.toContain('./intro.webm');
  });

  it('handles .ogg and .mov extensions as colocatable', async () => {
    const pageDir = path.join(root, 'pages', 'formats');
    writePageContent(
      root,
      'formats',
      `content:\n  content_items:\n    - type: main\n      label: "format-test"\n      heading:\n        text: "Formats"\n        textSize: "h1"\n      textBlocks: []\n      media:\n        type: "video"\n        label: "ogg-vid"\n        src: "./clip.ogg"\n`
    );
    fs.writeFileSync(path.join(pageDir, 'clip.ogg'), 'FAKE_OGG');

    await runPrebuild(root);

    const dest = path.join(root, 'public', 'images', 'formats', 'clip.ogg');
    expect(fs.existsSync(dest)).toBe(true);
  });

  it('warns for large video files (>50MB) without failing', async () => {
    const pageDir = path.join(root, 'pages', 'big');
    writePageContent(
      root,
      'big',
      `content:\n  content_items:\n    - type: video\n      label: "big-video"\n      src: "./huge.mp4"\n`
    );

    // Create a file just over 50MB by writing a sparse-ish buffer
    const bigBuf = Buffer.alloc(51 * 1024 * 1024, 0);
    fs.writeFileSync(path.join(pageDir, 'huge.mp4'), bigBuf);

    const warnSpy = vi.spyOn(console, 'warn');
    await expect(runPrebuild(root)).resolves.not.toThrow();
    const warnings = warnSpy.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(warnings).toContain('Large video file');
    warnSpy.mockRestore();
  });
});
