---
"@stackwright/build-scripts": minor
"@stackwright/core": minor
---

feat: SEO Autopilot — auto-generate sitemap.xml, robots.txt, and JSON-LD structured data

Prebuild now generates `sitemap.xml` and `robots.txt` in `public/` when `meta.base_url` is set in `stackwright.yml`. Pages with `noindex: true` are excluded from the sitemap. Locale variants get `xhtml:link` alternate entries.

Content types with natural schema.org mappings now emit `<script type="application/ld+json">` tags:
- `faq` → FAQPage schema
- `pricing_table` → Product with AggregateOffer schema

New exports:
- `@stackwright/build-scripts`: `generateSitemap`, `generateRobotsTxt`, `collectPageMeta`
- `@stackwright/core`: `generatePageJsonLd`, `generateFaqJsonLd`, `generatePricingJsonLd`, `generateArticleJsonLd`, `JsonLdScript`
