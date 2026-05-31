import { describe, it, expect } from 'vitest';
import {
  generateFaqJsonLd,
  generatePricingJsonLd,
  generateArticleJsonLd,
  generatePageJsonLd,
} from '../../src/utils/jsonld';

// ---------------------------------------------------------------------------
// generateFaqJsonLd
// ---------------------------------------------------------------------------

describe('generateFaqJsonLd', () => {
  it('generates valid FAQPage schema from FAQ items', () => {
    const result = generateFaqJsonLd({
      type: 'faq',
      items: [
        { question: 'What is Stackwright?', answer: 'A YAML-driven framework.' },
        { question: 'Is it free?', answer: 'Yes, it is open source.' },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!['@context']).toBe('https://schema.org');
    expect(result!['@type']).toBe('FAQPage');

    const mainEntity = result!.mainEntity as any[];
    expect(mainEntity).toHaveLength(2);
    expect(mainEntity[0]['@type']).toBe('Question');
    expect(mainEntity[0].name).toBe('What is Stackwright?');
    expect(mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
    expect(mainEntity[0].acceptedAnswer.text).toBe('A YAML-driven framework.');
  });

  it('returns null for empty items array', () => {
    const result = generateFaqJsonLd({ type: 'faq', items: [] });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// generatePricingJsonLd
// ---------------------------------------------------------------------------

describe('generatePricingJsonLd', () => {
  const basePricing = {
    type: 'pricing_table' as const,
    plans: [
      {
        name: 'Starter',
        price: '$29/mo',
        description: 'For small teams',
        features: ['Feature A', 'Feature B'],
        cta_href: '/signup/starter',
        cta_text: 'Get Started',
      },
      {
        name: 'Pro',
        price: '$99/year',
        features: ['Everything in Starter', 'Priority support'],
        cta_href: '/signup/pro',
        cta_text: 'Go Pro',
      },
    ],
  };

  it('generates Product with AggregateOffer schema', () => {
    const result = generatePricingJsonLd(basePricing);
    expect(result).not.toBeNull();
    expect(result!['@type']).toBe('Product');

    const offers = result!.offers as any;
    expect(offers['@type']).toBe('AggregateOffer');
    expect(offers.offerCount).toBe(2);
    expect(offers.offers).toHaveLength(2);
  });

  it('extracts numeric price from currency strings', () => {
    const result = generatePricingJsonLd(basePricing);
    const offers = (result!.offers as any).offers;
    expect(offers[0].price).toBe('29');
    expect(offers[1].price).toBe('99');
  });

  it('handles "Free" price', () => {
    const result = generatePricingJsonLd({
      type: 'pricing_table',
      plans: [
        { name: 'Free', price: 'Free', features: [], cta_href: '/signup', cta_text: 'Sign Up' },
      ],
    });
    const offers = (result!.offers as any).offers;
    expect(offers[0].price).toBe('0');
  });

  it('includes pageUrl when provided', () => {
    const result = generatePricingJsonLd(basePricing, 'https://example.com/pricing');
    expect(result!.url).toBe('https://example.com/pricing');
  });

  it('returns null for empty plans array', () => {
    const result = generatePricingJsonLd({ type: 'pricing_table', plans: [] });
    expect(result).toBeNull();
  });

  it('sets priceCurrency to USD', () => {
    const result = generatePricingJsonLd(basePricing);
    const offers = (result!.offers as any).offers;
    expect(offers[0].priceCurrency).toBe('USD');
  });
});

// ---------------------------------------------------------------------------
// generateArticleJsonLd
// ---------------------------------------------------------------------------

describe('generateArticleJsonLd', () => {
  it('generates Article schema from entry with date field', () => {
    const result = generateArticleJsonLd({
      slug: 'hello-world',
      title: 'Hello World',
      date: '2026-01-15',
      author: 'Jane Doe',
      excerpt: 'A brief introduction.',
    });

    expect(result).not.toBeNull();
    expect(result!['@type']).toBe('Article');
    expect(result!.headline).toBe('Hello World');
    expect(result!.datePublished).toBe('2026-01-15');
    expect((result!.author as any).name).toBe('Jane Doe');
    expect(result!.description).toBe('A brief introduction.');
  });

  it('returns null when no date field is present', () => {
    const result = generateArticleJsonLd({ slug: 'no-date', title: 'No Date' });
    expect(result).toBeNull();
  });

  it('recognises alternative date field names', () => {
    for (const field of ['publishedAt', 'published_at', 'createdAt', 'created_at']) {
      const result = generateArticleJsonLd({ slug: 'test', [field]: '2026-03-01' });
      expect(result).not.toBeNull();
      expect(result!.datePublished).toBe('2026-03-01');
    }
  });

  it('uses "name" field when "title" is absent', () => {
    const result = generateArticleJsonLd({
      slug: 'named',
      name: 'Named Entry',
      date: '2026-01-01',
    });
    expect(result!.headline).toBe('Named Entry');
  });

  it('uses "summary" or "description" as fallback for excerpt', () => {
    const r1 = generateArticleJsonLd({ slug: 'a', date: '2026-01-01', summary: 'Sum' });
    expect(r1!.description).toBe('Sum');

    const r2 = generateArticleJsonLd({ slug: 'b', date: '2026-01-01', description: 'Desc' });
    expect(r2!.description).toBe('Desc');
  });

  it('omits optional fields when not present', () => {
    const result = generateArticleJsonLd({ slug: 'minimal', date: '2026-01-01' });
    expect(result).not.toBeNull();
    expect(result!.headline).toBeUndefined();
    expect(result!.author).toBeUndefined();
    expect(result!.description).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// generatePageJsonLd
// ---------------------------------------------------------------------------

describe('generatePageJsonLd', () => {
  it('returns empty array when no content types match', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          { type: 'main', label: 'hero' },
          { type: 'text_block', label: 'body' },
        ],
      },
    });
    expect(result).toEqual([]);
  });

  it('generates JSON-LD for FAQ content items', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          {
            type: 'faq',
            label: 'faq',
            items: [{ question: 'Q?', answer: 'A.' }],
          },
        ],
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]['@type']).toBe('FAQPage');
  });

  it('generates JSON-LD for pricing_table content items', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          {
            type: 'pricing_table',
            label: 'pricing',
            plans: [
              {
                name: 'Free',
                price: 'Free',
                features: [],
                cta_href: '/signup',
                cta_text: 'Sign Up',
              },
            ],
          },
        ],
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]['@type']).toBe('Product');
  });

  it('recurses into grid columns', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          {
            type: 'grid',
            label: 'grid',
            columns: [
              {
                content_items: [
                  {
                    type: 'faq',
                    label: 'nested-faq',
                    items: [{ question: 'Nested Q?', answer: 'Nested A.' }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]['@type']).toBe('FAQPage');
  });

  it('recurses into tabbed_content tabs', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          {
            type: 'tabbed_content',
            label: 'tabs',
            tabs: [
              {
                type: 'faq',
                label: 'tab-faq',
                items: [{ question: 'Tab Q?', answer: 'Tab A.' }],
              },
            ],
          },
        ],
      },
    });
    expect(result).toHaveLength(1);
  });

  it('builds page URL from siteConfig.meta.base_url and slug', () => {
    const result = generatePageJsonLd(
      {
        content: {
          content_items: [
            {
              type: 'pricing_table',
              label: 'pricing',
              plans: [
                {
                  name: 'Free',
                  price: 'Free',
                  features: [],
                  cta_href: '/signup',
                  cta_text: 'Sign Up',
                },
              ],
            },
          ],
        },
      },
      { meta: { base_url: 'https://example.com' } },
      'pricing'
    );
    expect(result[0].url).toBe('https://example.com/pricing');
  });

  it('collects multiple JSON-LD objects from a single page', () => {
    const result = generatePageJsonLd({
      content: {
        content_items: [
          {
            type: 'faq',
            label: 'faq1',
            items: [{ question: 'Q1?', answer: 'A1.' }],
          },
          { type: 'main', label: 'hero' },
          {
            type: 'pricing_table',
            label: 'pricing',
            plans: [
              {
                name: 'Free',
                price: 'Free',
                features: [],
                cta_href: '/signup',
                cta_text: 'Sign Up',
              },
            ],
          },
        ],
      },
    });
    expect(result).toHaveLength(2);
    expect(result[0]['@type']).toBe('FAQPage');
    expect(result[1]['@type']).toBe('Product');
  });
});
