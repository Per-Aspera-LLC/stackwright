/**
 * jsonld.ts
 *
 * Pure utility functions for generating schema.org JSON-LD structured data
 * from Stackwright content types. Used by the SEO Autopilot feature to embed
 * rich snippets that search engines can consume.
 *
 * All functions are side-effect-free and return plain objects (or null).
 * Types are defined locally to avoid runtime imports from @stackwright/types.
 */

// ---------------------------------------------------------------------------
// Local type definitions (mirrors of @stackwright/types — no runtime import)
// ---------------------------------------------------------------------------

/** Minimal shape of a FAQ content item. */
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqContent {
  type: 'faq';
  items: FaqItem[];
  heading?: { text: string };
}

/** Minimal shape of a pricing plan. */
interface PricingPlan {
  name: string;
  price: string;
  description?: string;
  features: string[];
  cta_href: string;
}

interface PricingTableContent {
  type: 'pricing_table';
  plans: PricingPlan[];
}

/** A content item with at least a `type` discriminator. */
type ContentItemLike = {
  type: string;
  // Remaining fields are accessed via casts inside the walker — keeping
  // this type narrow avoids index-signature conflicts with the concrete
  // ContentItem union from @stackwright/types.
};

/** Minimal page content envelope used by generatePageJsonLd. */
interface PageContentLike {
  content: {
    content_items: ContentItemLike[];
  };
}

/** Minimal site config shape — only the bits we care about. */
interface SiteConfigLike {
  meta?: {
    base_url?: string;
  };
}

// ---------------------------------------------------------------------------
// generateFaqJsonLd
// ---------------------------------------------------------------------------

/**
 * Generate a schema.org `FAQPage` JSON-LD object from FAQ content.
 *
 * @param faqContent - A content item with `type: 'faq'` and an `items` array
 *                     of `{ question, answer }` pairs.
 * @returns A JSON-LD object, or `null` if the items array is empty.
 */
export function generateFaqJsonLd(faqContent: FaqContent): Record<string, unknown> | null {
  if (faqContent.items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqContent.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// generatePricingJsonLd
// ---------------------------------------------------------------------------

/**
 * Attempt to extract a bare numeric price from a display string.
 *
 * Examples:
 * - `"$29/mo"`   → `"29"`
 * - `"€99/year"` → `"99"`
 * - `"Free"`     → `"0"`
 * - `"Contact"`  → `"Contact"` (returned as-is)
 */
function extractNumericPrice(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === 'free' || lower === '$0' || lower === '0') return '0';

  // Strip common currency symbols and suffixes, then grab the first number
  const match = raw.match(/[\d,.]+/);
  if (match) return match[0].replace(/,/g, '');

  return raw;
}

/**
 * Generate a schema.org `Product` with `AggregateOffer` from pricing table
 * content.
 *
 * @param pricingContent - A content item with `type: 'pricing_table'` and a
 *                         `plans` array.
 * @param pageUrl        - Optional absolute URL for the pricing page.
 * @returns A JSON-LD object, or `null` if the plans array is empty.
 */
export function generatePricingJsonLd(
  pricingContent: PricingTableContent,
  pageUrl?: string
): Record<string, unknown> | null {
  if (pricingContent.plans.length === 0) return null;

  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Pricing',
    offers: {
      '@type': 'AggregateOffer',
      offerCount: pricingContent.plans.length,
      offers: pricingContent.plans.map((plan) => {
        const offer: Record<string, unknown> = {
          '@type': 'Offer',
          name: plan.name,
          price: extractNumericPrice(plan.price),
          priceCurrency: 'USD',
          url: plan.cta_href,
        };
        if (plan.description) offer.description = plan.description;
        return offer;
      }),
    },
  };

  if (pageUrl) product.url = pageUrl;

  return product;
}

// ---------------------------------------------------------------------------
// generateArticleJsonLd
// ---------------------------------------------------------------------------

/** Field names we recognise as a publish-date, in priority order. */
const DATE_FIELDS = ['date', 'publishedAt', 'published_at', 'createdAt', 'created_at'] as const;

/** Field names we recognise as a title, in priority order. */
const TITLE_FIELDS = ['title', 'name'] as const;

/** Field names we recognise as a description, in priority order. */
const DESC_FIELDS = ['excerpt', 'summary', 'description'] as const;

/**
 * Pick the first truthy string value from `entry` matching one of `keys`.
 */
function pickString(entry: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const val = entry[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return undefined;
}

/**
 * Generate a schema.org `Article` JSON-LD object from a collection entry.
 *
 * The function sniffs common field names (`title`, `date`, `author`, etc.)
 * so it works with any collection that follows typical blog/article
 * conventions — no rigid schema required.
 *
 * @param entry   - A plain object representing a collection entry.
 * @param baseUrl - Optional base URL (unused by this function but reserved
 *                  for future canonical-URL generation).
 * @returns A JSON-LD object, or `null` if no date field is found (we can't
 *          produce a valid Article without `datePublished`).
 */
export function generateArticleJsonLd(
  entry: Record<string, unknown>,
  baseUrl?: string
): Record<string, unknown> | null {
  const dateValue = pickString(entry, DATE_FIELDS);
  if (!dateValue) return null;

  const headline = pickString(entry, TITLE_FIELDS);

  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
  };

  if (headline) article.headline = headline;
  article.datePublished = dateValue;

  const author =
    typeof entry.author === 'string' && entry.author.length > 0 ? entry.author : undefined;
  if (author) {
    article.author = { '@type': 'Person', name: author };
  }

  const description = pickString(entry, DESC_FIELDS);
  if (description) article.description = description;

  if (baseUrl) article.url = baseUrl;

  return article;
}

// ---------------------------------------------------------------------------
// generatePageJsonLd  (master walker)
// ---------------------------------------------------------------------------

/**
 * Walk a page's content items (including nested grids and tabbed content)
 * and generate all applicable JSON-LD objects.
 *
 * @param pageContent - The full page content object (with `content.content_items`).
 * @param siteConfig  - Optional site config; used to derive `meta.base_url`.
 * @param slug        - Optional page slug; combined with `base_url` to build
 *                      page-level URLs for JSON-LD entries.
 * @returns An array of JSON-LD objects. Empty array if nothing matches.
 */
export function generatePageJsonLd(
  pageContent: PageContentLike,
  siteConfig?: SiteConfigLike,
  slug?: string
): Record<string, unknown>[] {
  const baseUrl = siteConfig?.meta?.base_url?.replace(/\/+$/, '');
  const pageUrl = baseUrl ? (slug ? `${baseUrl}/${slug}` : `${baseUrl}/`) : undefined;

  const results: Record<string, unknown>[] = [];

  function walkItems(items: ContentItemLike[]): void {
    for (const item of items) {
      switch (item.type) {
        case 'faq': {
          const ld = generateFaqJsonLd(item as unknown as FaqContent);
          if (ld) results.push(ld);
          break;
        }
        case 'pricing_table': {
          const ld = generatePricingJsonLd(item as unknown as PricingTableContent, pageUrl);
          if (ld) results.push(ld);
          break;
        }
        case 'grid': {
          const gridItem = item as unknown as {
            columns?: Array<{ content_items?: ContentItemLike[] }>;
          };
          if (Array.isArray(gridItem.columns)) {
            for (const col of gridItem.columns) {
              if (Array.isArray(col.content_items)) {
                walkItems(col.content_items);
              }
            }
          }
          break;
        }
        case 'tabbed_content': {
          const tabbedItem = item as unknown as { tabs?: ContentItemLike[] };
          if (Array.isArray(tabbedItem.tabs)) {
            walkItems(tabbedItem.tabs);
          }
          break;
        }
        // Other content types don't produce JSON-LD (yet)
        default:
          break;
      }
    }
  }

  walkItems(pageContent.content.content_items);
  return results;
}
