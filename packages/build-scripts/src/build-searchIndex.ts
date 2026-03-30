/**
 * build-searchIndex.ts
 *
 * Generates a search index from all page content files.
 * This runs during prebuild to create /stackwright-content/search-index.json
 * which is then used by the SearchModal component for fuzzy search.
 */

import fs from 'fs';
import path from 'path';

export interface SearchEntry {
  path: string;
  title: string;
  description?: string;
  headings: string[];
  content: string[];
  type: 'page' | 'landing' | 'docs';
}

// Files to skip when building search index
const SKIP_FILES = new Set(['_site.json', '_root.json', 'search-index.json', '_index.json']);

/**
 * Extract all text from a content item recursively
 */
function extractText(item: unknown): string[] {
  const texts: string[] = [];

  if (!item || typeof item !== 'object') return texts;

  const obj = item as Record<string, unknown>;

  // Direct text fields
  if (typeof obj.text === 'string') texts.push(obj.text);
  if (typeof obj.heading === 'string') texts.push(obj.heading);
  if (typeof obj.title === 'string') texts.push(obj.title);
  if (typeof obj.description === 'string') texts.push(obj.description);

  // TextBlock objects
  if (Array.isArray(obj.textBlocks)) {
    for (const tb of obj.textBlocks) {
      if (typeof tb === 'object' && tb !== null) {
        const tbObj = tb as Record<string, unknown>;
        if (typeof tbObj.text === 'string') texts.push(tbObj.text);
      }
    }
  }

  // Heading from TextBlock
  if (obj.heading && typeof obj.heading === 'object') {
    const headingObj = obj.heading as Record<string, unknown>;
    if (headingObj.text) texts.push(headingObj.text as string);
  }

  // Recurse into nested arrays
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        texts.push(...extractText(child));
      }
    } else if (typeof value === 'object' && value !== null) {
      texts.push(...extractText(value));
    }
  }

  return texts;
}

/**
 * Extract headings (h1, h2, h3) from content items
 */
function extractHeadings(contentItems: unknown[]): string[] {
  const headings: string[] = [];

  for (const item of contentItems || []) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;

    // Main content headings
    if (obj.heading) {
      if (typeof obj.heading === 'string') {
        headings.push(obj.heading);
      } else if (typeof obj.heading === 'object') {
        const headingObj = obj.heading as Record<string, unknown>;
        if (headingObj.text) headings.push(headingObj.text as string);
      }
    }

    // Section headings in text_blocks
    if (Array.isArray(obj.textBlocks)) {
      for (const tb of obj.textBlocks) {
        if (tb && typeof tb === 'object') {
          const tbObj = tb as Record<string, unknown>;
          if (tbObj.textSize === 'h2' || tbObj.textSize === 'h3') {
            if (typeof tbObj.text === 'string') {
              headings.push(tbObj.text);
            }
          }
        }
      }
    }
  }

  return headings;
}

/**
 * Build search index from all pages
 */
export function buildSearchIndex(pagesDir: string, outputPath: string): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Ensure pages directory exists
  if (!fs.existsSync(pagesDir)) {
    console.warn(`  WARN: Pages directory not found: ${pagesDir}`);
    return entries;
  }

  // Walk pages directory
  function walkDir(dir: string, basePath: string = ''): void {
    let files: string[];
    try {
      files = fs.readdirSync(dir);
    } catch {
      return;
    }

    for (const file of files) {
      // Skip special files
      if (SKIP_FILES.has(file)) continue;

      const fullPath = path.join(dir, file);

      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        // Recurse into subdirectories
        walkDir(fullPath, basePath + '/' + file);
      } else if (file.endsWith('.json')) {
        // Found a page content file
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          const pageContent = content.content || content;

          // Determine page type from structure
          let pageType: SearchEntry['type'] = 'page';
          const contentItems = pageContent?.content_items || [];
          if (
            Array.isArray(contentItems) &&
            contentItems.some((item: Record<string, unknown>) => item.type === 'main')
          ) {
            pageType = 'landing';
          }
          if (basePath.includes('docs') || basePath.includes('content-types')) {
            pageType = 'docs';
          }

          // Extract meta info
          const meta = pageContent?.meta || content?.meta || {};

          // Determine the URL path from the filename
          // e.g., "getting-started.json" -> "/getting-started"
          // e.g., "collections/blog/_index.json" -> "/collections/blog"
          const slug = file.replace(/\.json$/, '');
          const pagePath = slug === '_root' ? '/' : `/${slug}`;

          // Build entry
          const entry: SearchEntry = {
            path: pagePath,
            title:
              meta.title || meta.pageTitle || slug.replace(/-/g, ' ').replace(/^\//, '') || '/',
            description: meta.description,
            headings: extractHeadings(contentItems),
            content: extractText(pageContent).slice(0, 50), // Limit content length
            type: pageType,
          };

          entries.push(entry);
        } catch (err) {
          console.warn(`  WARN: Failed to parse ${fullPath}: ${(err as Error).message}`);
        }
      }
    }
  }

  walkDir(pagesDir);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write index
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));

  return entries;
}

// CLI for testing
if (require.main === module) {
  const pagesDir = path.join(process.cwd(), 'public/stackwright-content');
  const outputPath = path.join(process.cwd(), 'public/stackwright-content/search-index.json');

  const entries = buildSearchIndex(pagesDir, outputPath);
  console.log(`✅ Search index built: ${entries.length} pages indexed`);
}
