/**
 * Cross-page semantic validator for whole-site composition.
 *
 * Validates not just individual page schemas, but the relationships between
 * pages, navigation, collections, and theme — catching issues that
 * per-page validation cannot.
 */

import yaml from 'js-yaml';
import { siteConfigSchema, pageContentSchema } from './schema-loader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComposeSeverity = 'error' | 'warning';

export type ComposeCheckCategory =
  | 'schema'
  | 'navigation'
  | 'links'
  | 'collections'
  | 'seo'
  | 'theme';

export interface ComposeIssue {
  severity: ComposeSeverity;
  category: ComposeCheckCategory;
  /** Slug of the page where the issue was found, or '_site' for site config */
  source: string;
  message: string;
}

export interface ValidateSiteCompositionResult {
  valid: boolean;
  errors: ComposeIssue[];
  warnings: ComposeIssue[];
}

export interface ValidateSiteCompositionOptions {
  /** Known collection names for validating collection_list sources */
  existingCollections?: string[];
}

// ---------------------------------------------------------------------------
// Content walker — recursively visits all content items
// ---------------------------------------------------------------------------

type ContentVisitor = (item: Record<string, unknown>) => void;

/**
 * Walk all content items in a parsed page, including nested items inside
 * tabbed_content and grid columns.
 */
function walkContentItems(parsedPage: Record<string, unknown>, visitor: ContentVisitor): void {
  const content = parsedPage?.content as Record<string, unknown> | undefined;
  if (!content) return;
  const items = content.content_items as Record<string, unknown>[] | undefined;
  if (!Array.isArray(items)) return;
  walkItems(items, visitor);
}

function walkItems(items: Record<string, unknown>[], visitor: ContentVisitor): void {
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    visitor(item);

    // Recurse into tabbed_content tabs
    if (item.type === 'tabbed_content' && Array.isArray(item.tabs)) {
      walkItems(item.tabs as Record<string, unknown>[], visitor);
    }

    // Recurse into grid columns
    if (item.type === 'grid' && Array.isArray(item.columns)) {
      for (const col of item.columns as Record<string, unknown>[]) {
        if (col && Array.isArray(col.content_items)) {
          walkItems(col.content_items as Record<string, unknown>[], visitor);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Individual check functions
// ---------------------------------------------------------------------------

function checkNavigationToPageLinkage(
  navItems: Array<{ href: string }>,
  pageSlugs: Set<string>,
  issues: ComposeIssue[]
): void {
  for (const nav of navItems) {
    if (!nav.href || !nav.href.startsWith('/')) continue;

    const normalizedHref = nav.href === '/' ? '/' : nav.href.replace(/\/$/, '');

    if (!pageSlugs.has(normalizedHref)) {
      issues.push({
        severity: 'error',
        category: 'navigation',
        source: '_site',
        message: `Navigation href "${nav.href}" does not match any page in the site`,
      });
    }
  }
}

function checkOrphanPages(
  navHrefs: Set<string>,
  pageSlugs: Set<string>,
  issues: ComposeIssue[]
): void {
  for (const slug of pageSlugs) {
    const normalizedSlug = slug === '/' ? '/' : slug.replace(/\/$/, '');
    if (!navHrefs.has(normalizedSlug)) {
      issues.push({
        severity: 'warning',
        category: 'navigation',
        source: slug,
        message: `Page "${slug}" has no navigation entry pointing to it`,
      });
    }
  }
}

function checkInternalButtonLinks(
  slug: string,
  parsedPage: Record<string, unknown>,
  pageSlugs: Set<string>,
  issues: ComposeIssue[]
): void {
  walkContentItems(parsedPage, (item) => {
    const buttons = item.buttons as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(buttons)) return;

    for (const button of buttons) {
      const href = button?.href as string | undefined;
      if (!href || !href.startsWith('/')) continue;

      const normalizedHref = href === '/' ? '/' : href.replace(/\/$/, '');
      if (!pageSlugs.has(normalizedHref)) {
        issues.push({
          severity: 'warning',
          category: 'links',
          source: slug,
          message: `Button href "${href}" does not match any page in the site`,
        });
      }
    }
  });
}

function checkCollectionSources(
  slug: string,
  parsedPage: Record<string, unknown>,
  existingCollections: string[],
  issues: ComposeIssue[]
): void {
  const knownCollections = new Set(existingCollections);

  walkContentItems(parsedPage, (item) => {
    if (item.type !== 'collection_list') return;

    const source = item.source as string | undefined;
    if (!source) return;

    if (!knownCollections.has(source)) {
      issues.push({
        severity: 'warning',
        category: 'collections',
        source: slug,
        message: `collection_list references unknown collection "${source}"`,
      });
    }
  });
}

function checkDuplicateTitles(
  parsedPages: Map<string, Record<string, unknown>>,
  issues: ComposeIssue[]
): void {
  const titleToSlugs = new Map<string, string[]>();

  for (const [slug, parsed] of parsedPages) {
    const content = parsed?.content as Record<string, unknown> | undefined;
    const meta = content?.meta as Record<string, unknown> | undefined;
    const title = meta?.title as string | undefined;
    if (!title) continue;

    const existing = titleToSlugs.get(title) ?? [];
    existing.push(slug);
    titleToSlugs.set(title, existing);
  }

  for (const [title, slugs] of titleToSlugs) {
    if (slugs.length > 1) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        source: slugs[1],
        message: `Duplicate meta.title "${title}" — also used by page "${slugs[0]}"`,
      });
    }
  }
}

function checkThemeColorReferences(
  slug: string,
  parsedPage: Record<string, unknown>,
  paletteKeys: Set<string>,
  issues: ComposeIssue[]
): void {
  walkContentItems(parsedPage, (item) => {
    for (const field of ['color', 'background'] as const) {
      const value = item[field] as string | undefined;
      if (!value) continue;
      // Skip hex colors and transparent
      if (value.startsWith('#') || value === 'transparent') continue;
      // Check if it's a known palette key
      if (!paletteKeys.has(value)) {
        issues.push({
          severity: 'warning',
          category: 'theme',
          source: slug,
          message: `Content item references color "${value}" which is not a hex color or theme palette key`,
        });
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Main validation function
// ---------------------------------------------------------------------------

/**
 * Validate a complete site composition as a unit.
 *
 * Performs individual schema validation on each artifact AND cross-artifact
 * semantic checks that per-page validation cannot catch.
 *
 * @param siteConfigYaml - Raw YAML string for stackwright.yml
 * @param pages - Map of slug → raw YAML string for each page
 * @param options - Optional settings for collection validation, etc.
 */
export function validateSiteComposition(
  siteConfigYaml: string,
  pages: Record<string, string>,
  options?: ValidateSiteCompositionOptions
): ValidateSiteCompositionResult {
  const allIssues: ComposeIssue[] = [];

  // 1. Parse and validate site config
  let parsedSiteConfig: Record<string, unknown> | null = null;
  let siteConfigValid = false;

  try {
    parsedSiteConfig = yaml.load(siteConfigYaml) as Record<string, unknown>;
  } catch (err) {
    allIssues.push({
      severity: 'error',
      category: 'schema',
      source: '_site',
      message: `YAML parse error: ${(err as Error).message}`,
    });
  }

  if (parsedSiteConfig) {
    const result = siteConfigSchema.safeParse(parsedSiteConfig);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        allIssues.push({
          severity: 'error',
          category: 'schema',
          source: '_site',
          message: `${fieldPath}: ${issue.message}`,
        });
      }
    } else {
      siteConfigValid = true;
    }
  }

  // 2. Parse and validate each page
  const parsedPages = new Map<string, Record<string, unknown>>();

  for (const [slug, yamlContent] of Object.entries(pages)) {
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = yaml.load(yamlContent) as Record<string, unknown>;
    } catch (err) {
      allIssues.push({
        severity: 'error',
        category: 'schema',
        source: slug,
        message: `YAML parse error: ${(err as Error).message}`,
      });
      continue;
    }

    const result = pageContentSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        allIssues.push({
          severity: 'error',
          category: 'schema',
          source: slug,
          message: `${fieldPath}: ${issue.message}`,
        });
      }
    } else if (parsed) {
      parsedPages.set(slug, parsed);
    }
  }

  // 3. Cross-page checks (only if site config is valid)
  if (siteConfigValid && parsedSiteConfig) {
    // Build the set of page slugs (normalize: '/' for root, '/about' for others)
    const pageSlugs = new Set<string>();
    for (const slug of Object.keys(pages)) {
      const normalized = slug === '' || slug === '/' ? '/' : `/${slug.replace(/^\//, '')}`;
      pageSlugs.add(normalized);
    }

    // Extract navigation items
    const navItems = (parsedSiteConfig.navigation ?? []) as Array<{ href: string; label: string }>;
    const navHrefs = new Set(
      navItems
        .filter((n) => n.href?.startsWith('/'))
        .map((n) => (n.href === '/' ? '/' : n.href.replace(/\/$/, '')))
    );

    // Check 3a: Navigation → page linkage (error)
    checkNavigationToPageLinkage(navItems, pageSlugs, allIssues);

    // Check 3b: Orphan pages (warning)
    checkOrphanPages(navHrefs, pageSlugs, allIssues);

    // Check 3c: Internal button links (warning)
    for (const [slug, parsed] of parsedPages) {
      const normalizedSlug = slug === '' || slug === '/' ? '/' : `/${slug.replace(/^\//, '')}`;
      checkInternalButtonLinks(normalizedSlug, parsed, pageSlugs, allIssues);
    }

    // Check 3d: Collection source references (warning, only if collections provided)
    if (options?.existingCollections) {
      for (const [slug, parsed] of parsedPages) {
        const normalizedSlug = slug === '' || slug === '/' ? '/' : `/${slug.replace(/^\//, '')}`;
        checkCollectionSources(normalizedSlug, parsed, options.existingCollections, allIssues);
      }
    }

    // Check 3e: Duplicate page titles (warning)
    checkDuplicateTitles(parsedPages, allIssues);

    // Check 3f: Theme color references (warning)
    const customTheme = parsedSiteConfig.customTheme as Record<string, unknown> | undefined;
    const colors = customTheme?.colors as Record<string, string> | undefined;
    if (colors) {
      const paletteKeys = new Set(Object.keys(colors));
      for (const [slug, parsed] of parsedPages) {
        const normalizedSlug = slug === '' || slug === '/' ? '/' : `/${slug.replace(/^\//, '')}`;
        checkThemeColorReferences(normalizedSlug, parsed, paletteKeys, allIssues);
      }
    }
  }

  // Partition into errors and warnings
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
