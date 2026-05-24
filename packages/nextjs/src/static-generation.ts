import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'stackwright-content');

/**
 * Reserved filenames that are NOT page slugs.
 */
const RESERVED_FILES = new Set(['_site.json', '_root.json', '_font-links.json']);

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
 *   return <DynamicPage content={pageData} />;
 * }
 * ```
 */
export async function getStackwrightPageData(
  slug: string | string[] | undefined
): Promise<unknown | null> {
  // No slug = root page
  if (!slug || (Array.isArray(slug) && slug.length === 0)) {
    return readJsonFile(path.join(CONTENT_DIR, '_root.json'));
  }

  const slugPath = Array.isArray(slug) ? slug.join('/') : slug;
  return readJsonFile(path.join(CONTENT_DIR, `${slugPath}.json`));
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
