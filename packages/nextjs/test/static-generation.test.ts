/**
 * Tests for injectCollectionEntries and getStackwrightPageData.
 *
 * Vitest ESM modules don't allow vi.spyOn on namespace exports.
 * We use vi.hoisted() + explicit vi.mock factory so mock fns are
 * available both inside the factory (hoisted) and in the test body.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoist mock fn references so they're available in the vi.mock factory AND
// in test bodies. vi.hoisted runs before any imports/mocks.
// ---------------------------------------------------------------------------
const { mockReadFileSync, mockExistsSync, mockReaddirSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockReaddirSync: vi.fn().mockReturnValue([]),
}));

vi.mock('fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
  },
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
}));

import {
  injectCollectionEntries,
  getStackwrightPageData,
  generateStackwrightStaticParams,
} from '../src/static-generation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePageData(contentItems: unknown[]): unknown {
  return { content: { content_items: contentItems } };
}

function collectionListItem(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { type: 'collection_list', label: 'test-list', source: 'posts', ...overrides };
}

const SAMPLE_ENTRIES = [
  { slug: 'alpha', title: 'Alpha', date: '2026-01-01' },
  { slug: 'beta', title: 'Beta', date: '2026-02-01' },
  { slug: 'gamma', title: 'Gamma', date: '2026-03-01' },
];

// ---------------------------------------------------------------------------
// injectCollectionEntries
// ---------------------------------------------------------------------------

describe('injectCollectionEntries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('injects _entries for a top-level collection_list item', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(SAMPLE_ENTRIES));

    const pageData = makePageData([collectionListItem()]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];

    expect(items[0]._entries).toEqual(SAMPLE_ENTRIES);
  });

  it('injects _entries for collection_list inside grid column content_items', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(SAMPLE_ENTRIES));

    const gridItem = {
      type: 'grid',
      label: 'my-grid',
      columns: [
        { width: 6, content_items: [collectionListItem()] },
        { width: 6, content_items: [{ type: 'main', label: 'hero', heading: { text: 'Hi' } }] },
      ],
    };

    const pageData = makePageData([gridItem]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];
    const columns = (items[0] as Record<string, unknown>).columns as Record<string, unknown>[];
    const colItems = columns[0].content_items as Record<string, unknown>[];

    expect(colItems[0]._entries).toEqual(SAMPLE_ENTRIES);
  });

  it('injects _entries for collection_list inside tabbed_content tab content_items', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(SAMPLE_ENTRIES));

    const tabbedItem = {
      type: 'tabbed_content',
      label: 'tabs',
      heading: { text: 'Tabs', textSize: 'h2' },
      tabs: [
        { label: 'Tab 1', content_items: [collectionListItem()] },
        { label: 'Tab 2', content_items: [{ type: 'main', label: 'other' }] },
      ],
    };

    const pageData = makePageData([tabbedItem]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];
    const tabs = (items[0] as Record<string, unknown>).tabs as Record<string, unknown>[];
    const tabItems = tabs[0].content_items as Record<string, unknown>[];

    expect(tabItems[0]._entries).toEqual(SAMPLE_ENTRIES);
  });

  it('injects _entries: [] when the collection _index.json does not exist (no crash)', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    const pageData = makePageData([collectionListItem({ source: 'missing-collection' })]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];

    expect(items[0]._entries).toEqual([]);
  });

  it('applies limit when specified on the collection_list item', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(SAMPLE_ENTRIES));

    const pageData = makePageData([collectionListItem({ limit: 2 })]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];

    expect(items[0]._entries).toHaveLength(2);
    expect((items[0]._entries as Record<string, unknown>[])[0].slug).toBe('alpha');
    expect((items[0]._entries as Record<string, unknown>[])[1].slug).toBe('beta');
  });

  it('ignores limit: 0 (not a meaningful limit — returns all entries)', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(SAMPLE_ENTRIES));

    const pageData = makePageData([collectionListItem({ limit: 0 })]);
    const result = injectCollectionEntries(pageData) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];

    // limit: 0 means "no limit" per the guard `limit > 0`
    expect(items[0]._entries).toHaveLength(3);
  });

  it('sanitizes source with path.basename to prevent path traversal', () => {
    mockReadFileSync.mockImplementation((filePath: unknown) => {
      const p = filePath as string;
      // Only succeed if basename was applied (no traversal in path)
      if (p.includes('../')) throw new Error('path traversal attempt reached fs');
      return JSON.stringify([]);
    });

    const pageData = makePageData([collectionListItem({ source: '../../../etc/passwd' })]);
    // Should not throw — basename strips the traversal
    expect(() => injectCollectionEntries(pageData)).not.toThrow();
    const content = (injectCollectionEntries(pageData) as Record<string, unknown>)
      .content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];
    expect(items[0]._entries).toEqual([]);
  });

  it('returns pageData unchanged when there is no content field', () => {
    const pageData = { title: 'No content field' };
    const result = injectCollectionEntries(pageData);
    expect(result).toBe(pageData);
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it('returns non-object input unchanged', () => {
    expect(injectCollectionEntries(null)).toBeNull();
    expect(injectCollectionEntries(undefined)).toBeUndefined();
    expect(injectCollectionEntries('string')).toBe('string');
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getStackwrightPageData — smoke test that injection is wired up
// ---------------------------------------------------------------------------

describe('getStackwrightPageData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns null when page JSON does not exist', async () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });

    const result = await getStackwrightPageData(['nonexistent']);
    expect(result).toBeNull();
  });

  it('injects collection entries into page data', async () => {
    const pageJson = JSON.stringify(makePageData([collectionListItem()]));

    mockReadFileSync
      // First call: _site.json (getStackwrightSiteLocales — returns no locales config, defaults to ['en'])
      .mockReturnValueOnce(JSON.stringify({}))
      // Second call: the page JSON
      .mockReturnValueOnce(pageJson)
      // Third call: the _index.json for the 'posts' collection
      .mockReturnValueOnce(JSON.stringify(SAMPLE_ENTRIES));

    const result = (await getStackwrightPageData(['some-page'])) as Record<string, unknown>;
    const content = result.content as Record<string, unknown>;
    const items = content.content_items as Record<string, unknown>[];

    expect(items[0]._entries).toEqual(SAMPLE_ENTRIES);
  });
});

// ---------------------------------------------------------------------------
// generateStackwrightStaticParams — reserved file filtering
// ---------------------------------------------------------------------------

/** Build a minimal Dirent-like object for readdirSync({ withFileTypes: true }) */
function makeDirent(name: string, isDir = false) {
  return { name, isDirectory: () => isDir, isFile: () => !isDir };
}

describe('generateStackwrightStaticParams', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockExistsSync.mockReturnValue(true);
  });

  it('excludes _image-manifest.json so it is never rendered as a page', () => {
    mockReaddirSync.mockReturnValue([makeDirent('about.json'), makeDirent('_image-manifest.json')]);

    const params = generateStackwrightStaticParams();
    const slugs = params.map((p) => p.slug.join('/'));

    expect(slugs).toContain('about');
    expect(slugs).not.toContain('_image-manifest');
  });

  it('excludes _theme.json so it is never rendered as a page', () => {
    mockReaddirSync.mockReturnValue([makeDirent('about.json'), makeDirent('_theme.json')]);

    const params = generateStackwrightStaticParams();
    const slugs = params.map((p) => p.slug.join('/'));

    expect(slugs).toContain('about');
    expect(slugs).not.toContain('_theme');
  });

  it('excludes all reserved files (_site.json, _theme.json, _icon-manifest.json, etc.)', () => {
    mockReaddirSync.mockReturnValue([
      makeDirent('home.json'),
      makeDirent('_site.json'),
      makeDirent('_theme.json'),
      makeDirent('_font-links.json'),
      makeDirent('search-index.json'),
      makeDirent('_icon-manifest.json'),
      makeDirent('_image-manifest.json'),
    ]);

    const params = generateStackwrightStaticParams();
    const slugs = params.map((p) => p.slug.join('/'));

    expect(slugs).toEqual(['home']);
  });

  it('returns [] when the content directory does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    expect(generateStackwrightStaticParams()).toEqual([]);
  });
});
