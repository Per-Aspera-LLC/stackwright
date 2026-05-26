/**
 * i18n tests for static-generation.ts:
 * - parseLocaleFromSlug (pure function, no mocking)
 * - generateStackwrightStaticParams recursive locale directory walk
 * - getStackwrightPageData silent locale fallback
 *
 * Follows the same vi.hoisted + vi.mock('fs') pattern as static-generation.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

// ---------------------------------------------------------------------------
// Hoist mock fn references — available in the factory AND in test bodies
// ---------------------------------------------------------------------------
const { mockReadFileSync, mockExistsSync, mockReaddirSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn(),
  mockExistsSync: vi.fn(),
  mockReaddirSync: vi.fn(),
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
  parseLocaleFromSlug,
  generateStackwrightStaticParams,
  getStackwrightPageData,
} from '../src/static-generation';

// Mirrors CONTENT_DIR in static-generation.ts
const CONTENT_DIR = path.join(process.cwd(), 'public', 'stackwright-content');

// ---------------------------------------------------------------------------
// Dirent-like helpers for mocking readdirSync with { withFileTypes: true }
// ---------------------------------------------------------------------------
const makeFile = (name: string) => ({ name, isFile: () => true, isDirectory: () => false });
const makeDir = (name: string) => ({ name, isFile: () => false, isDirectory: () => true });

// ---------------------------------------------------------------------------
// parseLocaleFromSlug — pure function, no fs calls
// ---------------------------------------------------------------------------

describe('parseLocaleFromSlug', () => {
  it('detects locale prefix in slug array', () => {
    expect(parseLocaleFromSlug(['fr', 'about'], ['en', 'fr'])).toEqual({
      locale: 'fr',
      pageSlug: ['about'],
    });
  });

  it('returns default locale when first segment is not a known locale', () => {
    expect(parseLocaleFromSlug(['about'], ['en', 'fr'])).toEqual({
      locale: 'en',
      pageSlug: ['about'],
    });
  });

  it('returns default locale for empty slug array', () => {
    expect(parseLocaleFromSlug([], ['en', 'fr'])).toEqual({
      locale: 'en',
      pageSlug: [],
    });
  });

  it('returns default locale for undefined slug', () => {
    expect(parseLocaleFromSlug(undefined, ['en', 'fr'])).toEqual({
      locale: 'en',
      pageSlug: [],
    });
  });

  it('locale-only segment resolves to locale root page (empty pageSlug)', () => {
    expect(parseLocaleFromSlug(['fr'], ['en', 'fr'])).toEqual({
      locale: 'fr',
      pageSlug: [],
    });
  });
});

// ---------------------------------------------------------------------------
// generateStackwrightStaticParams — recursive locale directory walk
// ---------------------------------------------------------------------------

describe('generateStackwrightStaticParams — recursive locale directory walk', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockReaddirSync.mockImplementation((dir: unknown) => {
      const d = dir as string;
      if (d === CONTENT_DIR) {
        return [
          makeFile('about.json'),
          makeFile('_site.json'), // reserved — must be excluded
          makeFile('_root.json'), // top-level root page — prefix [] → dropped
          makeDir('fr'), // locale subdir — should be recursed
          makeDir('collections'), // always skipped
        ];
      }
      if (d === path.join(CONTENT_DIR, 'fr')) {
        return [makeFile('about.json')];
      }
      // collections/ and anything else: should never be reached (collections skipped)
      return [];
    });
  });

  it('includes slug pages from the root content dir', () => {
    const result = generateStackwrightStaticParams();
    expect(result).toContainEqual({ slug: ['about'] });
  });

  it('includes slug pages from locale subdirectories', () => {
    const result = generateStackwrightStaticParams();
    expect(result).toContainEqual({ slug: ['fr', 'about'] });
  });

  it('excludes reserved files (_site.json, locale _site variants)', () => {
    const result = generateStackwrightStaticParams();
    expect(result).not.toContainEqual({ slug: ['_site'] });
  });

  it('excludes top-level _root.json (root page has no [...slug] param)', () => {
    const result = generateStackwrightStaticParams();
    expect(result).not.toContainEqual({ slug: ['_root'] });
  });

  it('excludes everything inside collections/', () => {
    const result = generateStackwrightStaticParams();
    expect(result.some((r) => r.slug.includes('collections'))).toBe(false);
  });

  it('returns exactly the expected number of entries', () => {
    expect(generateStackwrightStaticParams()).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getStackwrightPageData — silent locale fallback
// ---------------------------------------------------------------------------

describe('getStackwrightPageData — locale fallback', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockReaddirSync.mockReturnValue([]);
  });

  it('falls back to default locale content when locale file does not exist', async () => {
    const siteJson = JSON.stringify({
      locales: { default: 'en', supported: ['en', 'fr'] },
    });
    const aboutJson = JSON.stringify({ content: { content_items: [] } });

    mockReadFileSync.mockImplementation((filePath: unknown) => {
      const p = filePath as string;
      if (p.endsWith('_site.json')) return siteJson;
      if (p.endsWith('about.json')) return aboutJson;
      throw new Error(`Unexpected readFileSync: ${p}`);
    });

    // fr/about.json does not exist — existsSync returns false for that specific path
    mockExistsSync.mockImplementation((filePath: unknown) => {
      return !(filePath as string).includes(`fr${path.sep}about.json`);
    });

    const result = await getStackwrightPageData(['about'], 'fr');
    expect(result).not.toBeNull();
    expect((result as Record<string, unknown>).content).toBeDefined();
  });

  it('returns null when neither locale file nor default file exists', async () => {
    const siteJson = JSON.stringify({
      locales: { default: 'en', supported: ['en', 'fr'] },
    });

    mockReadFileSync.mockImplementation((filePath: unknown) => {
      const p = filePath as string;
      if (p.endsWith('_site.json')) return siteJson;
      throw new Error('ENOENT');
    });

    // Nothing exists on disk
    mockExistsSync.mockReturnValue(false);

    const result = await getStackwrightPageData(['nonexistent'], 'fr');
    expect(result).toBeNull();
  });
});
