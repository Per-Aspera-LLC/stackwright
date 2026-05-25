import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'stackwright-content');
const COLLECTIONS_DIR = path.join(CONTENT_DIR, 'collections');

/**
 * Reserved filenames that are NOT page slugs.
 */
const RESERVED_FILES = new Set([
  '_site.json',
  '_root.json',
  '_font-links.json',
  'search-index.json',
]);

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
export function generateStackwrightStaticParams(): Array<{ slug: string[] }> {
  try {
    if (!fs.existsSync(CONTENT_DIR)) return [];

    const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .filter((entry) => !RESERVED_FILES.has(entry.name))
      .map((entry) => {
        const slug = entry.name.replace(/\.json$/, '');
        // Support nested slugs separated by '/' encoded as '__' or by directory structure
        return { slug: slug.split('/').filter(Boolean) };
      });
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
  slug: string | string[] | undefined
): Promise<unknown | null> {
  // No slug = root page
  let pageData: unknown;
  if (!slug || (Array.isArray(slug) && slug.length === 0)) {
    pageData = readJsonFile(path.join(CONTENT_DIR, '_root.json'));
  } else {
    const slugPath = Array.isArray(slug) ? slug.join('/') : slug;
    pageData = readJsonFile(path.join(CONTENT_DIR, `${slugPath}.json`));
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

function readJsonFile(filePath: string): unknown | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
