/**
 * Tests for app-shell content normalisation (swp-0rz).
 *
 * Dashboard Otter emits pages with `content` as a flat YAML sequence instead
 * of the standard `{ content_items: [...] }` mapping.  `normalizePageContent`
 * must detect this, wrap it in `{ content_items: [...] }`, run each item
 * through `normalizeContentItem`, and preserve all other top-level keys
 * (most importantly `layoutMode`).
 *
 * Tests run through the full `runPrebuild()` pipeline (temp dirs) so that we
 * exercise normalisation + validation + JSON serialisation in one shot —
 * matching the existing prebuild test conventions.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_SITE_CONFIG = `title: "Test Site"
appBar:
  titleText: "Test"
navigation: []
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-app-shell-test-'));
  fs.writeFileSync(path.join(root, 'stackwright.yml'), BASE_SITE_CONFIG);
  fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
  return root;
}

function writePageContent(root: string, slug: string, content: string): void {
  const dir = path.join(root, 'pages', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), content, 'utf8');
}

function readPageJson(root: string, slug: string): Record<string, unknown> {
  const p = path.join(root, 'public', 'stackwright-content', `${slug}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function cleanup(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('normalizePageContent — app-shell flat array format', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = '';
  });
  afterEach(() => {
    if (tmpRoot) cleanup(tmpRoot);
  });

  it('normalises flat array content to { content_items: [...] }', async () => {
    tmpRoot = makeTmpProject();
    // Dashboard Otter format: content is a YAML sequence, not a mapping
    writePageContent(
      tmpRoot,
      'dashboard',
      `layoutMode: app-shell
content:
  - type: text_block
    label: "dash-intro"
    textBlocks:
      - text: "Welcome to the dashboard"
        textSize: body1
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'dashboard');
    const content = json.content as Record<string, unknown>;
    expect(Array.isArray(content.content_items)).toBe(true);
    expect((content.content_items as unknown[]).length).toBe(1);
    expect((content.content_items as Record<string, unknown>[])[0].type).toBe('text_block');
    expect((content.content_items as Record<string, unknown>[])[0].label).toBe('dash-intro');
  });

  it('preserves layoutMode at the top level after normalisation', async () => {
    tmpRoot = makeTmpProject();
    writePageContent(
      tmpRoot,
      'app-page',
      `layoutMode: app-shell
content:
  - type: text_block
    label: "body"
    textBlocks:
      - text: "Content here"
        textSize: body1
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'app-page');
    expect(json.layoutMode).toBe('app-shell');
  });

  it('runs normalizeContentItem on each array item (mapping-key format → type-field format)', async () => {
    tmpRoot = makeTmpProject();
    // Mapping-key format: { text_block: { label, textBlocks } } instead of { type: 'text_block', ... }
    writePageContent(
      tmpRoot,
      'mapping-key',
      `layoutMode: app-shell
content:
  - text_block:
      label: "mk-item"
      textBlocks:
        - text: "Hello from mapping-key"
          textSize: body1
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'mapping-key');
    const content = json.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];
    expect(items.length).toBe(1);
    // normalizeContentItem should have converted { text_block: {...} } → { type: 'text_block', ... }
    expect(items[0].type).toBe('text_block');
    expect(items[0].label).toBe('mk-item');
  });

  it('standard format (content_items object) is unaffected by the new branch', async () => {
    tmpRoot = makeTmpProject();
    writePageContent(
      tmpRoot,
      'standard',
      `content:
  content_items:
    - type: text_block
      label: "std-item"
      textBlocks:
        - text: "Standard format"
          textSize: body1
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'standard');
    const content = json.content as Record<string, unknown>;
    expect(Array.isArray(content.content_items)).toBe(true);
    expect((content.content_items as Record<string, unknown>[])[0].label).toBe('std-item');
    // No layoutMode since it wasn't set
    expect(json.layoutMode).toBeUndefined();
  });

  it('preserves layoutMode: page with standard format', async () => {
    tmpRoot = makeTmpProject();
    writePageContent(
      tmpRoot,
      'page-mode',
      `layoutMode: page
content:
  content_items:
    - type: text_block
      label: "page-item"
      textBlocks:
        - text: "Page layout"
          textSize: body1
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'page-mode');
    expect(json.layoutMode).toBe('page');
    const content = json.content as Record<string, unknown>;
    expect((content.content_items as Record<string, unknown>[])[0].label).toBe('page-item');
  });

  it('handles empty array content without throwing', async () => {
    tmpRoot = makeTmpProject();
    writePageContent(
      tmpRoot,
      'empty-array',
      `layoutMode: app-shell
content: []
`
    );

    await expect(runPrebuild(tmpRoot)).resolves.not.toThrow();

    const json = readPageJson(tmpRoot, 'empty-array');
    const content = json.content as Record<string, unknown>;
    expect(content.content_items).toEqual([]);
  });

  it('preserves extra top-level page metadata alongside layoutMode and normalized content', async () => {
    tmpRoot = makeTmpProject();
    writePageContent(
      tmpRoot,
      'meta-page',
      `layoutMode: app-shell
content:
  - type: text_block
    label: "meta-item"
    textBlocks:
      - text: "With meta"
        textSize: body1
meta:
  title: "Dashboard Meta Title"
`
    );

    await runPrebuild(tmpRoot);

    const json = readPageJson(tmpRoot, 'meta-page');
    expect(json.layoutMode).toBe('app-shell');
    // meta should be present (passed through ...page spread)
    const meta = json.meta as Record<string, unknown> | undefined;
    expect(meta?.title).toBe('Dashboard Meta Title');
  });
});
