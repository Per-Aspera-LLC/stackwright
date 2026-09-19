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
  '_theme.json',
  '_font-links.json',
  'search-index.json',
  '_icon-manifest.json',
  '_image-manifest.json',
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

// ---------------------------------------------------------------------------
// Dynamic segments — `[param]` content dirs/files (App-Router convention)
// ---------------------------------------------------------------------------

/** Matches a single dynamic segment name like `[id]` and captures `id`. */
const DYNAMIC_SEGMENT = /^\[([^/[\]]+)\]$/;

/** Returns the param name for a dynamic segment (`[id]` → `id`), else null. */
export function dynamicParamName(segment: string): string | null {
  const match = DYNAMIC_SEGMENT.exec(segment);
  return match ? match[1]! : null;
}

/** Safe readdir with Dirents; empty on missing dir or fs errors. */
function readEntries(dir: string): fs.Dirent[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

export interface DynamicContentResolution {
  /** Absolute path of the matched content JSON file. */
  filePath: string;
  /** Param bindings collected along the path, e.g. `{ id: '11' }`. */
  params: Record<string, string>;
}

/**
 * Resolve a slug against dynamic-segment content paths under `base`.\
 * Literal matches always win; a `[param]` dir/file only binds when the\
 * literal segment is absent. Exactly ONE dynamic candidate may exist per\
 * level — zero is a miss, two or more is ambiguous and refuses to resolve\
 * (build-time validation should have rejected that layout).\
 *
 * `['contacts', '11']` + `contacts/[id].json` → `{ filePath: …/contacts/[id].json, params: { id: '11' } }`
 */
export function resolveDynamicContentPath(
  base: string,
  segments: string[]
): DynamicContentResolution | null {
  const resolve = (
    dir: string,
    segs: string[],
    params: Record<string, string>
  ): DynamicContentResolution | null => {
    const [head, ...rest] = segs;
    if (head === undefined) return null;

    if (rest.length === 0) {
      const literal = path.join(dir, `${head}.json`);
      if (fs.existsSync(literal)) return { filePath: literal, params };
      const candidates = readEntries(dir).filter(
        (e) =>
          e.isFile() &&
          e.name.endsWith('.json') &&
          dynamicParamName(e.name.replace(/\.json$/, '')) !== null
      );
      if (candidates.length !== 1) return null;
      const name = candidates[0]!.name;
      const param = dynamicParamName(name.replace(/\.json$/, ''))!;
      return { filePath: path.join(dir, name), params: { ...params, [param]: head } };
    }

    const literalDir = path.join(dir, head);
    if (fs.existsSync(literalDir)) {
      const hit = resolve(literalDir, rest, params);
      if (hit) return hit;
    }
    const dirCandidates = readEntries(dir).filter(
      (e) => e.isDirectory() && dynamicParamName(e.name) !== null
    );
    if (dirCandidates.length !== 1) return null;
    const dirName = dirCandidates[0]!.name;
    return resolve(path.join(dir, dirName), rest, {
      ...params,
      [dynamicParamName(dirName)!]: head,
    });
  };

  return resolve(base, segments, {});
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
      // Dynamic-segment dirs ([id]/…) are resolved per-request, not prerendered
      if (dynamicParamName(entry.name) !== null) continue;
      results.push(...walkContentDir(path.join(dir, entry.name), [...prefix, entry.name]));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      if (isReservedFile(entry.name)) continue;
      if (entry.name === '_root.json') {
        // Locale root page: fr/_root.json → { slug: ['fr'] }; top-level → skip
        if (prefix.length > 0) results.push({ slug: prefix });
      } else {
        const slugPart = entry.name.replace(/\.json$/, '');
        // Dynamic-segment files ([id].json) must NOT become literal slugs —
        // emitting { slug: ['contacts', '[id]'] } creates an unroutable junk
        // page AND (with dynamicParams=false) pins the route table so the
        // real /contacts/11 can never resolve (qa-006 class).
        if (dynamicParamName(slugPart) !== null) continue;
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
  const segments = !slug ? [] : Array.isArray(slug) ? slug : [slug];

  /**
   * Read the page file for an optional locale subdir: exact path first,
   * then dynamic-segment resolution (`contacts/11` → `contacts/[id].json`
   * with `params: { id: '11' }`). Exact matches carry no params.
   */
  const readPage = (subdir?: string): { data: unknown; params: Record<string, string> } | null => {
    const base = subdir ? path.join(CONTENT_DIR, subdir) : CONTENT_DIR;
    const exactPath =
      segments.length === 0
        ? path.join(base, '_root.json')
        : path.join(base, `${segments.join('/')}.json`);
    const exact = readJsonFile(exactPath);
    if (exact !== null) return { data: exact, params: {} };
    if (segments.length === 0) return null;
    const dynamic = resolveDynamicContentPath(base, segments);
    if (!dynamic) return null;
    const data = readJsonFile(dynamic.filePath);
    return data !== null ? { data, params: dynamic.params } : null;
  };

  // Locale-specific file first; fall back silently to default locale
  const hit = locale && locale !== defaultLocale ? (readPage(locale) ?? readPage()) : readPage();
  if (!hit) return null;

  return injectRouteParams(injectCollectionEntries(hit.data), hit.params);
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

/**
 * Depth-first visitor over content items, following every child container
 * shape (`content_items`, grid `columns[].content_items`,
 * `tabs[].content_items`). Single traversal shared by entry injection and
 * route-param injection — one walker, no copies.
 */
function visitContentItems(
  items: Record<string, unknown>[],
  visit: (item: Record<string, unknown>) => void
): void {
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    visit(item);

    if (Array.isArray(item.content_items)) {
      visitContentItems(item.content_items as Record<string, unknown>[], visit);
    }
    for (const containerKey of ['columns', 'tabs'] as const) {
      const container = item[containerKey];
      if (!Array.isArray(container)) continue;
      for (const child of container as Record<string, unknown>[]) {
        if (child && typeof child === 'object' && Array.isArray(child.content_items)) {
          visitContentItems(child.content_items as Record<string, unknown>[], visit);
        }
      }
    }
  }
}

function walkContentItems(items: Record<string, unknown>[]): void {
  visitContentItems(items, (item) => {
    if (item.type === 'collection_list') injectEntries(item);
  });
}

/**
 * Inject resolved dynamic-route params (`_routeParams`) into the page data
 * AND every content item, so param-consuming components (e.g. Pro's
 * `detail_view`) receive the row identity as a prop when the content
 * renderer spreads item keys (qa-006: the `[id]` value must reach the
 * page's data binding).
 */
export function injectRouteParams(pageData: unknown, params: Record<string, string>): unknown {
  if (Object.keys(params).length === 0) return pageData;
  if (!pageData || typeof pageData !== 'object') return pageData;

  const data = pageData as Record<string, unknown>;
  data._routeParams = params;

  const content = data.content as Record<string, unknown> | undefined;
  if (content && Array.isArray(content.content_items)) {
    visitContentItems(content.content_items as Record<string, unknown>[], (item) => {
      item._routeParams = params;
    });
  }
  return pageData;
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
