/**
 * Dynamic-segment content resolution (qa-006 class).
 *
 * A generated app shipped `pages/contacts/[id]/content.yml` (compiled to
 * `public/stackwright-content/contacts/[id].json`) but EVERY URL shape
 * 404'd: `/contacts/11` missed the exact-path lookup, and static params
 * emitted the junk literal slug `['contacts', '[id]']`.
 *
 * These tests pin the repaired contract:
 *   - `getStackwrightPageData(['contacts','11'])` resolves `contacts/[id].json`
 *     and injects `_routeParams: { id: '11' }` on the page AND its items
 *   - literal files always win over dynamic candidates
 *   - ambiguous layouts (two dynamic siblings) refuse to resolve
 *   - `generateStackwrightStaticParams()` never emits `[param]` slugs
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

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
  getStackwrightPageData,
  generateStackwrightStaticParams,
  resolveDynamicContentPath,
  dynamicParamName,
} from '../src/static-generation';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'stackwright-content');

/**
 * In-memory content dir: keys are CONTENT_DIR-relative POSIX paths of FILES.
 * Directories are implied by file paths.
 */
function setupFs(files: Record<string, string>): void {
  const rel = (p: string): string => path.relative(CONTENT_DIR, p).split(path.sep).join('/');
  const dirs = new Set<string>(['']);
  for (const file of Object.keys(files)) {
    const parts = file.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
  }

  mockExistsSync.mockImplementation((p: string) => {
    const r = rel(p);
    return r in files || dirs.has(r);
  });
  mockReadFileSync.mockImplementation((p: string) => {
    const r = rel(p);
    if (r in files) return files[r];
    throw new Error(`ENOENT: ${r}`);
  });
  mockReaddirSync.mockImplementation((p: string) => {
    const r = rel(p);
    if (!dirs.has(r)) return [];
    const prefix = r === '' ? '' : `${r}/`;
    const names = new Set<string>();
    const entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }> = [];
    const add = (name: string, isDir: boolean) => {
      if (names.has(name)) return;
      names.add(name);
      entries.push({ name, isDirectory: () => isDir, isFile: () => !isDir });
    };
    for (const file of Object.keys(files)) {
      if (!file.startsWith(prefix)) continue;
      const remainder = file.slice(prefix.length);
      const slash = remainder.indexOf('/');
      if (slash === -1) add(remainder, false);
      else add(remainder.slice(0, slash), true);
    }
    return entries;
  });
}

/** Page JSON with one detail-shaped item, as the A.1 fixture authored it. */
const DETAIL_PAGE = JSON.stringify({
  content: {
    content_items: [
      {
        type: 'section',
        label: 'contact-detail-section',
        content_items: [{ type: 'detail_view', label: 'contact-detail', collection: 'Contacts' }],
      },
    ],
  },
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe('dynamicParamName', () => {
  it('extracts the param from [id]', () => {
    expect(dynamicParamName('[id]')).toBe('id');
  });

  it('rejects non-dynamic and malformed segments', () => {
    expect(dynamicParamName('contacts')).toBeNull();
    expect(dynamicParamName('[id')).toBeNull();
    expect(dynamicParamName('id]')).toBeNull();
    expect(dynamicParamName('[]')).toBeNull();
    expect(dynamicParamName('[a][b]')).toBeNull();
  });
});

describe('getStackwrightPageData — dynamic segments (qa-006)', () => {
  it('resolves /contacts/11 via contacts/[id].json with _routeParams on page and items', async () => {
    setupFs({
      '_site.json': '{}',
      'contacts.json': '{"content":{"content_items":[]}}',
      'contacts/[id].json': DETAIL_PAGE,
    });

    const result = (await getStackwrightPageData(['contacts', '11'])) as Record<string, any>;
    expect(result).not.toBeNull();
    expect(result._routeParams).toEqual({ id: '11' });

    const section = result.content.content_items[0];
    const detail = section.content_items[0];
    expect(section._routeParams).toEqual({ id: '11' });
    // The [id] value reaches the detail binding's props (qa-006 core contract)
    expect(detail._routeParams).toEqual({ id: '11' });
  });

  it('prefers the literal file over a dynamic sibling', async () => {
    setupFs({
      '_site.json': '{}',
      'contacts/new.json': '{"content":{"content_items":[]},"literal":true}',
      'contacts/[id].json': DETAIL_PAGE,
    });

    const result = (await getStackwrightPageData(['contacts', 'new'])) as Record<string, any>;
    expect(result.literal).toBe(true);
    expect(result._routeParams).toBeUndefined();
  });

  it('resolves nested dynamic DIRECTORIES: /contacts/11/deals → contacts/[id]/deals.json', async () => {
    setupFs({
      '_site.json': '{}',
      'contacts/[id]/deals.json': DETAIL_PAGE,
    });

    const result = (await getStackwrightPageData(['contacts', '11', 'deals'])) as Record<
      string,
      any
    >;
    expect(result).not.toBeNull();
    expect(result._routeParams).toEqual({ id: '11' });
  });

  it('refuses ambiguous layouts (two dynamic siblings) instead of guessing', async () => {
    setupFs({
      '_site.json': '{}',
      'contacts/[id].json': DETAIL_PAGE,
      'contacts/[slug].json': DETAIL_PAGE,
    });

    expect(await getStackwrightPageData(['contacts', '11'])).toBeNull();
  });

  it('still returns null for genuinely unknown slugs', async () => {
    setupFs({
      '_site.json': '{}',
      'contacts/[id].json': DETAIL_PAGE,
    });

    expect(await getStackwrightPageData(['deals', '99'])).toBeNull();
  });

  it('exact pages keep resolving without params', async () => {
    setupFs({
      '_site.json': '{}',
      'about.json': '{"content":{"content_items":[]}}',
    });

    const result = (await getStackwrightPageData(['about'])) as Record<string, any>;
    expect(result).not.toBeNull();
    expect(result._routeParams).toBeUndefined();
  });
});

describe('resolveDynamicContentPath', () => {
  it('binds multiple params along the path', () => {
    setupFs({
      'orgs/[org]/repos/[repo].json': DETAIL_PAGE,
    });

    const hit = resolveDynamicContentPath(CONTENT_DIR, ['orgs', 'acme', 'repos', 'widget']);
    expect(hit).not.toBeNull();
    expect(hit!.params).toEqual({ org: 'acme', repo: 'widget' });
    expect(hit!.filePath.endsWith(path.join('orgs', '[org]', 'repos', '[repo].json'))).toBe(true);
  });

  it('returns null when nothing matches', () => {
    setupFs({ 'contacts/[id].json': DETAIL_PAGE });
    expect(resolveDynamicContentPath(CONTENT_DIR, ['contacts'])).toBeNull();
    expect(resolveDynamicContentPath(CONTENT_DIR, ['contacts', '11', 'extra'])).toBeNull();
  });
});

describe('generateStackwrightStaticParams — dynamic hygiene (qa-006)', () => {
  it('never emits [param] slugs for dynamic files or dirs', () => {
    setupFs({
      '_site.json': '{}',
      'contacts.json': '{}',
      'contacts/[id].json': DETAIL_PAGE,
      'leads/[id]/notes.json': DETAIL_PAGE,
      'about.json': '{}',
    });

    const params = generateStackwrightStaticParams();
    const slugs = params.map((p) => p.slug.join('/'));
    expect(slugs).toContain('contacts');
    expect(slugs).toContain('about');
    expect(slugs.some((s) => s.includes('['))).toBe(false);
  });
});
