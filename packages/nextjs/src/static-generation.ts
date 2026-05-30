import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'stackwright-content');
const COLLECTIONS_DIR = path.join(CONTENT_DIR, 'collections');

/**
 * Reserved filenames that are NOT page slugs.
 * Note: _root.json is intentionally absent — locale subdirs need fr/_root.json → slug ['fr'].
 */
const RESERVED_FILES = new Set([
  '_site.json',
  '_font-links.json',
  'search-index.json',
  '_icon-manifest.json',
]);

/**
 * Returns true for filenames that must never become page slugs:
 * exact RESERVED_FILES members, and locale site configs (_site.fr.json, etc.).
 */
function isReservedFile(filename: string): boolean {
  if (RESERVED_FILES.has(filename)) return true;
  // Locale-specific site configs written by the prebuild: _site.<locale>.json
  if (/^_site\..+\.json$/.test(filename)) return true;
  return false;
}

/**
 * Generate static params for all Stackwright slug pages.
 *
 * Use as `generateStaticParams` in an App Router catch-all segment
 * (`app/[...slug]/page.tsx`):
 *
 * ```typescript
 * import { generateStackwrightStaticParams } from '@stackwright/nextjs';
 *
 * export const generateStaticParams = generateStackwrightStaticParams;
 *
 * export default function Page({ params }: { params: { slug: string[] } }) {
 *   // ...
 * }
 * ```
 *
 * Returns an array like `[{ slug: ['about'] }, { slug: ['getting-started'] }]`.
 */
/**
 * Recursively walk CONTENT_DIR collecting page slugs.
 * - Skips the `collections/` directory (collection data, not pages)
 * - Skips files matched by `isReservedFile()`
 * - `_root.json` inside a locale subdir (e.g. fr/_root.json) yields { slug: ['fr'] }
 * - Top-level `_root.json` (root page) is intentionally dropped (empty slug array filtered out)
 */
function walkContentDir(dir: string, prefix: string[]): Array<{ slug: string[] }> {
  const results: Array<{ slug: string[] }> = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'collections') continue;
      results.push(...walkContentDir(path.join(dir, entry.name), [...prefix, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      if (isReservedFile(entry.name)) continue;
      if (entry.name === '_root.json') {
        // Locale root page: fr/_root.json → { slug: ['fr'] }; top-level → skip
        if (prefix.length > 0) results.push({ slug: prefix });
      } else {
        const slugPart = entry.name.replace(/\.json$/, '');
        results.push({ slug: [...prefix, slugPart] });
      }
    }
  }
  return results;
}

export function generateStackwrightStaticParams(): Array<{ slug: string[] }> {
  try {
    if (!fs.existsSync(CONTENT_DIR)) return [];
    return walkContentDir(CONTENT_DIR, []);
  } catch {
    return [];
  }
}

/**
 * Read the processed page data for a given slug from the prebuild output.
 *
 * Use in App Router page components:
 *
 * ```typescript
 * import { getStackwrightPageData } from '@stackwright/nextjs';
 *
 * export default async function Page({ params }: { params: { slug: string[] } }) {
 *   const pageData = await getStackwrightPageData(params.slug);
 *   if (!pageData) notFound();
 *   return <DynamicPage pageContent={pageData} />;
 * }
 * ```
 */
export async function getStackwrightPageData(
  slug: string | string[] | undefined,
  locale?: string
): Promise<unknown | null> {
  const supportedLocales = getStackwrightSiteLocales();
  const defaultLocale = supportedLocales[0] ?? 'en';

  /** Build the absolute file path for a given optional subdir. */
  const buildPath = (subdir?: string): string => {
    const base = subdir ? path.join(CONTENT_DIR, subdir) : CONTENT_DIR;
    if (!slug || (Array.isArray(slug) && slug.length === 0)) {
      return path.join(base, '_root.json');
    }
    const slugPath = Array.isArray(slug) ? slug.join('/') : slug;
    return path.join(base, `${slugPath}.json`);
  };

  let pageData: unknown;
  if (locale && locale !== defaultLocale) {
    // Try locale-specific file first; fall back silently to default locale
    const localePath = buildPath(locale);
    pageData = fs.existsSync(localePath) ? readJsonFile(localePath) : readJsonFile(buildPath());
  } else {
    pageData = readJsonFile(buildPath());
  }

  return pageData !== null ? injectCollectionEntries(pageData) : null;
}

// ---------------------------------------------------------------------------
// Collection entry injection
// ---------------------------------------------------------------------------

/**
 * Walk all content_items in page data (recursively into grid columns and
 * tabbed_content tabs) and populate `_entries` on every `collection_list` item.
 */
export function injectCollectionEntries(pageData: unknown): unknown {
  if (!pageData || typeof pageData !== 'object') return pageData;

  const data = pageData as Record<string, unknown>;
  const content = data.content as Record<string, unknown> | undefined;
  if (!content) return pageData;

  if (Array.isArray(content.content_items)) {
    walkContentItems(content.content_items as Record<string, unknown>[]);
  }

  return pageData;
}

function walkContentItems(items: Record<string, unknown>[]): void {
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    if (item.type === 'collection_list') {
      injectEntries(item);
    } else if (item.type === 'grid' && Array.isArray(item.columns)) {
      for (const col of item.columns as Record<string, unknown>[]) {
        if (Array.isArray(col.content_items)) {
          walkContentItems(col.content_items as Record<string, unknown>[]);
        }
      }
    } else if (item.type === 'tabbed_content' && Array.isArray(item.tabs)) {
      for (const tab of item.tabs as Record<string, unknown>[]) {
        if (Array.isArray(tab.content_items)) {
          walkContentItems(tab.content_items as Record<string, unknown>[]);
        }
      }
    }
  }
}

function injectEntries(node: Record<string, unknown>): void {
  const source = node.source;
  if (typeof source !== 'string' || !source) {
    node._entries = [];
    return;
  }

  // Sanitize to prevent path traversal
  const safeSource = path.basename(source);
  const indexPath = path.join(COLLECTIONS_DIR, safeSource, '_index.json');

  let entries: unknown[] = [];
  try {
    const raw = fs.readFileSync(indexPath, 'utf8');
    entries = JSON.parse(raw) as unknown[];
  } catch {
    entries = [];
  }

  const limit = node.limit;
  if (typeof limit === 'number' && limit > 0) {
    entries = entries.slice(0, limit);
  }

  node._entries = entries;
}

/**
 * Read and parse the site config from the prebuild output.
 */
export function getStackwrightSiteConfig(): unknown | null {
  return readJsonFile(path.join(CONTENT_DIR, '_site.json'));
}

/**
 * Read the supported locales from the prebuild-generated _site.json.
 * Returns the supported locale list, or ['en'] if not configured.
 */
export function getStackwrightSiteLocales(): string[] {
  const site = getStackwrightSiteConfig() as Record<string, unknown> | null;
  const locales = site?.locales as { default?: string; supported?: string[] } | undefined;
  return locales?.supported ?? ['en'];
}

/**
 * Given a slug array and a list of supported locales, determine if the first
 * segment is a locale prefix. Returns the resolved locale and the page slug
 * without the locale prefix.
 *
 * Examples (supported: ['en', 'fr']):
 *   ['fr', 'about'] → { locale: 'fr', pageSlug: ['about'] }
 *   ['about']       → { locale: 'en', pageSlug: ['about'] }  (default locale)
 *   ['fr']          → { locale: 'fr', pageSlug: [] }          (locale root page)
 */
export function parseLocaleFromSlug(
  slug: string | string[] | undefined,
  supportedLocales: string[]
): { locale: string; pageSlug: string[] } {
  const segments = Array.isArray(slug) ? slug : slug ? [slug] : [];
  const defaultLocale = supportedLocales[0] ?? 'en';
  if (segments.length > 0 && supportedLocales.includes(segments[0]!)) {
    return { locale: segments[0]!, pageSlug: segments.slice(1) };
  }
  return { locale: defaultLocale, pageSlug: segments };
}

function readJsonFile(filePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
