# @stackwright/e2e

## 0.2.0

### Minor Changes

- f5d7ec2: Add built-in full-text search to every Stackwright site.

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

## 0.2.0-alpha.0

### Minor Changes

- 02638c9: Add built-in full-text search to every Stackwright site.

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

## 0.1.0

### Minor Changes

- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool
  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool

## 0.1.0-alpha.1

### Minor Changes

- Version dependencies

## 0.1.0-alpha.0

### Minor Changes

- 163e3b1: Add visual regression tests for all 13 content types and MCP component preview tool
  - Screenshot-based visual regression tests (desktop 1280px + mobile 375px) for every content type on the showcase page
  - `data-content-type` and `data-label` attributes on content item wrappers for reliable DOM targeting
  - New `stackwright_preview_component` MCP tool returns PNG screenshots of content types to AI agents
  - Sync script to copy E2E baselines to MCP package for serving via the preview tool
