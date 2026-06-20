import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildSearchIndex } from '../src/build-searchIndex';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writePage(dir: string, filePath: string, content: object): void {
  const fullPath = path.join(dir, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(content));
}

const EMPTY_PAGE = { content: { meta: { title: 'Test' }, content_items: [] } };

// ---------------------------------------------------------------------------
// buildSearchIndex
// ---------------------------------------------------------------------------

describe('buildSearchIndex', () => {
  let pagesDir: string;
  let outputPath: string;

  beforeEach(() => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-search-test-'));
    pagesDir = path.join(tmp, 'pages');
    outputPath = path.join(tmp, 'search-index.json');
    fs.mkdirSync(pagesDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(path.dirname(pagesDir), { recursive: true, force: true });
  });

  it('returns empty array when pages directory does not exist', () => {
    const entries = buildSearchIndex('/nonexistent/path', outputPath);
    expect(entries).toEqual([]);
  });

  it('indexes root-level pages with correct paths', () => {
    // _root.json is in SKIP_FILES (intentionally not indexed — it is a build artifact)
    // so only named pages appear in the index.
    writePage(pagesDir, 'about.json', { content: { meta: { title: 'About' }, content_items: [] } });
    writePage(pagesDir, 'dashboard.json', {
      content: { meta: { title: 'Dashboard' }, content_items: [] },
    });

    const entries = buildSearchIndex(pagesDir, outputPath);
    const paths = entries.map((e) => e.path);

    expect(paths).toContain('/about');
    expect(paths).toContain('/dashboard');
  });

  it('preserves full parent directory in nested page paths', () => {
    // The regression: /dispatch-units/[id].json was indexing as /[id]
    writePage(pagesDir, 'dispatch-units/[id].json', EMPTY_PAGE);
    writePage(pagesDir, 'facilities/[id].json', EMPTY_PAGE);
    writePage(pagesDir, 'vessels/[id].json', EMPTY_PAGE);

    const entries = buildSearchIndex(pagesDir, outputPath);
    const paths = entries.map((e) => e.path);

    expect(paths).toContain('/dispatch-units/[id]');
    expect(paths).toContain('/facilities/[id]');
    expect(paths).toContain('/vessels/[id]');

    // Must NOT produce bare /[id] (the old broken behaviour)
    expect(paths.filter((p) => p === '/[id]')).toHaveLength(0);
  });

  it('disambiguates identically-named files across different parent dirs', () => {
    // /admin/audit and /evacuation/audit were both indexing as /audit
    writePage(pagesDir, 'admin/audit.json', {
      content: { meta: { title: 'Admin Audit' }, content_items: [] },
    });
    writePage(pagesDir, 'evacuation/audit.json', {
      content: { meta: { title: 'Evacuation Audit' }, content_items: [] },
    });

    const entries = buildSearchIndex(pagesDir, outputPath);
    const paths = entries.map((e) => e.path);

    expect(paths).toContain('/admin/audit');
    expect(paths).toContain('/evacuation/audit');

    // Must NOT collapse both to /audit
    expect(paths.filter((p) => p === '/audit')).toHaveLength(0);
  });

  it('handles deeply nested pages', () => {
    writePage(pagesDir, 'admin/settings/notifications.json', EMPTY_PAGE);

    const entries = buildSearchIndex(pagesDir, outputPath);
    expect(entries[0].path).toBe('/admin/settings/notifications');
  });

  it('indexes locale subdir pages with correct full paths', () => {
    // _root.json is SKIP_FILES — not indexed regardless of parent dir.
    // Other locale pages should appear with the full /fr/... prefix.
    writePage(pagesDir, 'fr/about.json', EMPTY_PAGE);
    writePage(pagesDir, 'fr/contact.json', EMPTY_PAGE);

    const entries = buildSearchIndex(pagesDir, outputPath);
    const paths = entries.map((e) => e.path);

    expect(paths).toContain('/fr/about');
    expect(paths).toContain('/fr/contact');
    // Must NOT appear as bare /about or /contact
    expect(paths.filter((p) => p === '/about')).toHaveLength(0);
  });

  it('skips reserved files', () => {
    for (const reserved of ['_site.json', '_root.json', 'search-index.json', '_index.json']) {
      writePage(pagesDir, reserved, EMPTY_PAGE);
    }
    writePage(pagesDir, 'dashboard.json', EMPTY_PAGE);

    const entries = buildSearchIndex(pagesDir, outputPath);
    const paths = entries.map((e) => e.path);

    expect(paths).not.toContain('/_site');
    expect(paths).not.toContain('/_root');
    expect(paths).not.toContain('/search-index');
    expect(paths).not.toContain('/_index');
    expect(paths).toContain('/dashboard');
  });

  it('writes the index to the output file', () => {
    writePage(pagesDir, 'about.json', { content: { meta: { title: 'About' }, content_items: [] } });

    buildSearchIndex(pagesDir, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);
    const written = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    expect(Array.isArray(written)).toBe(true);
    expect(written[0].path).toBe('/about');
  });

  it('extracts title from page meta', () => {
    writePage(pagesDir, 'weather.json', {
      content: {
        meta: { title: 'Weather Board', description: 'Live storm tracking' },
        content_items: [],
      },
    });

    const entries = buildSearchIndex(pagesDir, outputPath);
    expect(entries[0].title).toBe('Weather Board');
    expect(entries[0].description).toBe('Live storm tracking');
  });
});
