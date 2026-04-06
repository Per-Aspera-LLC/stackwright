---
"@stackwright/core": minor
"@stackwright/build-scripts": minor
"@stackwright/types": minor
"@stackwright/e2e": minor
---

Add built-in full-text search to every Stackwright site.

**New feature (`@stackwright/core`):**
- Client-side search using Fuse.js with fuzzy matching
- Search modal triggered by clicking search button or pressing `/`
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
- Accessible: proper ARIA labels, focus trapping, screen reader announcements
- SSR-safe: no hydration mismatches

**Prebuild changes (`@stackwright/build-scripts`):**
- Generate search index JSON during prebuild containing all page content
- Index includes page slugs, headings, and text content
- Index placed in public folder for client-side fetching

**Type updates (`@stackwright/types`):**
- Add `searchIndexPath` option to SiteConfig

**E2E tests (`@stackwright/e2e`):**
- Add accessibility and interaction tests for search functionality
