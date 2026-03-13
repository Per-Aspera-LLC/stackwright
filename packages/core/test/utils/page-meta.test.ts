import { describe, it, expect } from 'vitest';
import { resolvePageMeta } from '../../src/components/DynamicPage';
import { PageContent, SiteConfig } from '@stackwright/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePageContent(overrides: {
  meta?: PageContent['content']['meta'];
  firstHeading?: string;
} = {}): PageContent {
  const contentItems = overrides.firstHeading
    ? [
        {
          main: {
            label: 'hero',
            heading: { text: overrides.firstHeading, textSize: 'h1' as const },
            textBlocks: [{ text: 'body', textSize: 'body1' as const }],
          },
        },
      ]
    : [];

  return {
    content: {
      ...(overrides.meta ? { meta: overrides.meta } : {}),
      content_items: contentItems,
    },
  };
}

function makeSiteConfig(overrides: Partial<SiteConfig> = {}): SiteConfig {
  return {
    title: 'Acme Corp',
    navigation: [],
    appBar: { titleText: 'Acme Corp' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('resolvePageMeta', () => {
  it('returns page-level title when set', () => {
    const page = makePageContent({ meta: { title: 'Custom Title' } });
    const site = makeSiteConfig();
    const result = resolvePageMeta(page, site);
    expect(result.title).toBe('Custom Title');
  });

  it('auto-generates title from first heading + site title', () => {
    const page = makePageContent({ firstHeading: 'About Us' });
    const site = makeSiteConfig({ title: 'Acme Corp' });
    const result = resolvePageMeta(page, site);
    expect(result.title).toBe('About Us | Acme Corp');
  });

  it('falls back to site title when no heading and no page meta', () => {
    const page = makePageContent();
    const site = makeSiteConfig({ title: 'Acme Corp' });
    const result = resolvePageMeta(page, site);
    expect(result.title).toBe('Acme Corp');
  });

  it('returns undefined title when no page meta, no heading, and no site config', () => {
    const page = makePageContent();
    const result = resolvePageMeta(page);
    expect(result.title).toBeUndefined();
  });

  it('returns page description over site description', () => {
    const page = makePageContent({ meta: { description: 'Page-specific description' } });
    const site = makeSiteConfig({ meta: { description: 'Site-wide description' } });
    const result = resolvePageMeta(page, site);
    expect(result.description).toBe('Page-specific description');
  });

  it('falls back to site description when page has none', () => {
    const page = makePageContent();
    const site = makeSiteConfig({ meta: { description: 'Site-wide description' } });
    const result = resolvePageMeta(page, site);
    expect(result.description).toBe('Site-wide description');
  });

  it('prepends base_url to root-relative og_image', () => {
    const page = makePageContent({ meta: { og_image: '/images/hero.jpg' } });
    const site = makeSiteConfig({ meta: { base_url: 'https://acme.com' } });
    const result = resolvePageMeta(page, site);
    expect(result.ogImage).toBe('https://acme.com/images/hero.jpg');
  });

  it('leaves absolute og_image URLs unchanged', () => {
    const page = makePageContent({
      meta: { og_image: 'https://cdn.example.com/hero.jpg' },
    });
    const site = makeSiteConfig({ meta: { base_url: 'https://acme.com' } });
    const result = resolvePageMeta(page, site);
    expect(result.ogImage).toBe('https://cdn.example.com/hero.jpg');
  });

  it('falls back to site-level og_image when page has none', () => {
    const page = makePageContent();
    const site = makeSiteConfig({ meta: { og_image: '/images/default-og.jpg' } });
    const result = resolvePageMeta(page, site);
    expect(result.ogImage).toBe('/images/default-og.jpg');
  });

  it('returns noindex when set on page', () => {
    const page = makePageContent({ meta: { noindex: true } });
    const result = resolvePageMeta(page);
    expect(result.noindex).toBe(true);
  });

  it('returns undefined noindex when not set', () => {
    const page = makePageContent();
    const result = resolvePageMeta(page);
    expect(result.noindex).toBeUndefined();
  });

  it('uses og_site_name from site meta', () => {
    const page = makePageContent();
    const site = makeSiteConfig({ meta: { og_site_name: 'Acme Corp Official' } });
    const result = resolvePageMeta(page, site);
    expect(result.ogSiteName).toBe('Acme Corp Official');
  });

  it('falls back to site title for og_site_name', () => {
    const page = makePageContent();
    const site = makeSiteConfig({ title: 'Acme Corp' });
    const result = resolvePageMeta(page, site);
    expect(result.ogSiteName).toBe('Acme Corp');
  });

  it('returns canonical when set on page', () => {
    const page = makePageContent({ meta: { canonical: 'https://acme.com/about' } });
    const result = resolvePageMeta(page);
    expect(result.canonical).toBe('https://acme.com/about');
  });

  it('page-level title takes precedence over auto-generated title', () => {
    const page = makePageContent({
      meta: { title: 'Explicit Title' },
      firstHeading: 'Auto-Generated Heading',
    });
    const site = makeSiteConfig({ title: 'Acme Corp' });
    const result = resolvePageMeta(page, site);
    expect(result.title).toBe('Explicit Title');
  });
});
