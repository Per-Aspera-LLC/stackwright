/**
 * seo.ts
 *
 * SEO Autopilot utilities for generating sitemap.xml and robots.txt
 * during the Stackwright prebuild step.
 *
 * These are pure functions with zero external dependencies beyond Node builtins.
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageMeta {
  noindex?: boolean;
}

export interface PageEntry {
  slug: string | null;
  locale?: string;
  meta?: PageMeta;
}

export interface SitemapOptions {
  pages: PageEntry[];
  baseUrl: string;
  buildDate: string;
}

// ---------------------------------------------------------------------------
// Reserved files / directories that are NOT page content
// ---------------------------------------------------------------------------

const RESERVED_BASENAMES = new Set([
  '_site.json',
  '_font-links.json',
  'search-index.json',
  '_icon-manifest.json',
]);

/** Matches locale-specific site configs like `_site.fr.json`, `_site.de.json` */
const LOCALE_SITE_RE = /^_site\..+\.json$/;

const SKIP_DIRS = new Set(['collections']);

// ---------------------------------------------------------------------------
// collectPageMeta
// ---------------------------------------------------------------------------

/**
 * Walk the prebuild content output directory and return a flat list of page
 * entries with optional SEO metadata.
 *
 * The output directory structure produced by `stackwright-prebuild` is:
 * ```
 *   _root.json          → slug null  (root page)
 *   about.json          → slug 'about'
 *   blog/my-post.json   → slug 'blog/my-post'
 *   fr/_root.json       → slug null,  locale 'fr'
 *   fr/about.json       → slug 'about', locale 'fr'
 * ```
 *
 * Reserved files (`_site.json`, `_font-links.json`, …) and the `collections/`
 * directory are skipped automatically.
 *
 * @param contentOutDir - Absolute path to the prebuild output directory
 *                        (typically `public/stackwright-content`).
 * @returns Array of page entries suitable for {@link generateSitemap}.
 */
export function collectPageMeta(contentOutDir: string): PageEntry[] {
  const pages: PageEntry[] = [];

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // directory doesn't exist — nothing to index
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
        continue;
      }

      if (!entry.name.endsWith('.json')) continue;
      if (RESERVED_BASENAMES.has(entry.name)) continue;
      if (LOCALE_SITE_RE.test(entry.name)) continue;

      const filePath = path.join(dir, entry.name);
      const relPath = path.relative(contentOutDir, filePath);
      const page = parsePageFile(relPath, filePath);
      if (page) pages.push(page);
    }
  }

  walk(contentOutDir);
  return pages;
}

/**
 * Parse a single JSON content file into a {@link PageEntry}.
 *
 * @param relPath  - Path relative to contentOutDir (e.g. `fr/about.json`)
 * @param filePath - Absolute path for reading the file
 */
function parsePageFile(relPath: string, filePath: string): PageEntry | null {
  // Normalise to forward slashes for cross-platform sanity
  const normalised = relPath.replace(/\\/g, '/');
  const parts = normalised.replace(/\.json$/, '').split('/');

  let slug: string | null;
  let locale: string | undefined;

  if (parts.length === 1) {
    // Top-level: _root.json → null, about.json → 'about'
    slug = parts[0] === '_root' ? null : parts[0];
  } else {
    // Nested: first segment is the locale if the final segment is a page
    // e.g. fr/_root.json → locale 'fr', slug null
    //      fr/about.json → locale 'fr', slug 'about'
    //      docs/intro.json → slug 'docs/intro' (not a locale — no _root.json
    //        would exist at top-level for 'docs', but we treat multi-segment
    //        paths with a single leading segment as locale only when the
    //        framework's i18n prebuild is active).
    //
    // Heuristic: a leading single-segment directory that contains a _root.json
    // is a locale directory. But since we can't cheaply re-check the fs here,
    // we rely on a simpler rule: if the first segment is ≤5 chars and looks
    // like a BCP-47 primary subtag, treat it as a locale.
    const possibleLocale = parts[0];
    if (parts.length === 2 && looksLikeLocale(possibleLocale)) {
      locale = possibleLocale;
      slug = parts[1] === '_root' ? null : parts[1];
    } else if (parts.length > 2 && looksLikeLocale(possibleLocale)) {
      locale = possibleLocale;
      const rest = parts.slice(1);
      slug = rest[rest.length - 1] === '_root' ? rest.slice(0, -1).join('/') : rest.join('/');
    } else {
      // No locale prefix — deep-nested page like docs/intro
      slug = parts[parts.length - 1] === '_root' ? parts.slice(0, -1).join('/') : parts.join('/');
    }
  }

  // Read the JSON and extract meta
  let meta: PageMeta | undefined;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (raw?.content?.meta) {
      const { noindex } = raw.content.meta;
      if (noindex !== undefined) {
        meta = { noindex };
      }
    }
  } catch {
    // If we can't read / parse the file, include the page without meta.
    // Better to have an entry in the sitemap than silently drop it.
  }

  const page: PageEntry = { slug };
  if (locale) page.locale = locale;
  if (meta) page.meta = meta;
  return page;
}

/**
 * Quick-and-dirty check: does a string look like a BCP-47 primary language
 * subtag?  (2–3 lowercase letters, e.g. `en`, `fr`, `de`, `zh`)
 */
function looksLikeLocale(s: string): boolean {
  return /^[a-z]{2,3}$/.test(s);
}

// ---------------------------------------------------------------------------
// generateSitemap
// ---------------------------------------------------------------------------

/**
 * Generate a valid XML sitemap string from a list of page entries.
 *
 * Features:
 * - Omits pages with `meta.noindex === true`
 * - Groups pages by slug so locale alternates share `<xhtml:link>` entries
 * - Strips trailing slashes from `baseUrl`
 * - Handles empty pages array (returns a valid but empty `<urlset>`)
 *
 * @param options - Sitemap generation options
 * @returns A complete XML sitemap string ready to write to `public/sitemap.xml`
 */
export function generateSitemap(options: SitemapOptions): string {
  const { pages, buildDate } = options;
  const baseUrl = stripTrailingSlashes(options.baseUrl);

  // Group indexable pages by slug so we can attach locale alternates
  const groupedBySlug = new Map<string, PageEntry[]>();

  for (const page of pages) {
    if (page.meta?.noindex) continue;

    const key = page.slug ?? '__root__';
    const group = groupedBySlug.get(key) ?? [];
    group.push(page);
    groupedBySlug.set(key, group);
  }

  const urlEntries: string[] = [];

  for (const [, group] of groupedBySlug) {
    // Build xhtml:link alternates when there are multiple locales
    const hasAlternates = group.length > 1;
    const alternateLinks = hasAlternates
      ? group
          .map((p) => {
            const href = buildAbsoluteUrl(baseUrl, p);
            const hreflang = p.locale ?? 'x-default';
            return `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(href)}" />`;
          })
          .join('\n')
      : '';

    for (const page of group) {
      const loc = buildAbsoluteUrl(baseUrl, page);
      const parts = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`];

      if (alternateLinks) parts.push(alternateLinks);

      parts.push(`    <lastmod>${escapeXml(buildDate)}</lastmod>`, '  </url>');
      urlEntries.push(parts.join('\n'));
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urlEntries,
    '</urlset>',
    '', // trailing newline
  ].join('\n');
}

// ---------------------------------------------------------------------------
// generateRobotsTxt
// ---------------------------------------------------------------------------

/**
 * Generate a standard `robots.txt` for Stackwright sites.
 *
 * Allows all crawlers by default while blocking internal framework paths
 * (`/api/`, `/_next/`, `/stackwright-content/`) and pointing to the sitemap.
 *
 * @param baseUrl - The production base URL (trailing slash is stripped).
 * @returns A robots.txt string ready to write to `public/robots.txt`.
 */
export function generateRobotsTxt(baseUrl: string): string {
  const base = stripTrailingSlashes(baseUrl);

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /_next/',
    'Disallow: /stackwright-content/',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '', // trailing newline
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build the absolute URL for a page, taking locale into account.
 *
 * - Root page (slug null, no locale) → `https://example.com/`
 * - Locale root (slug null, locale fr) → `https://example.com/fr`
 * - Regular page → `https://example.com/about`
 * - Locale page  → `https://example.com/fr/about`
 */
function buildAbsoluteUrl(baseUrl: string, page: PageEntry): string {
  const segments: string[] = [];
  if (page.locale) segments.push(page.locale);
  if (page.slug) segments.push(page.slug);

  return segments.length === 0 ? `${baseUrl}/` : `${baseUrl}/${segments.join('/')}`;
}

/** Strip trailing `/` characters without a regex (avoids CodeQL ReDoS false positives). */
function stripTrailingSlashes(url: string): string {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end--;
  return end === url.length ? url : url.slice(0, end);
}

/** Minimal XML escaping for attribute/text values. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
