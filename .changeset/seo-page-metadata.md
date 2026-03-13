---
"@stackwright/types": minor
"@stackwright/core": minor
"@stackwright/nextjs": minor
---

feat: page-level SEO metadata from YAML (#164)

Add `meta` block to page content and site config for `<title>`, `<meta description>`, Open Graph tags, canonical URLs, and noindex control. Metadata resolves with page-level overrides falling back to site-level defaults, with auto-generated titles from the first content heading. The `NextStackwrightHead` adapter renders tags via `next/head`; if no Head adapter is registered, SEO tags are silently omitted (graceful degradation). Image co-location works for `og_image` paths with zero special handling. 26 new test cases across core and nextjs packages.
