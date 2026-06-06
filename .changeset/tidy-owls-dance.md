---
"@stackwright/types": minor
"@stackwright/core": minor
"@stackwright/build-scripts": patch
---

feat(core): implement `layoutMode: app-shell` layout mode

Dashboard Otter pages that emit `layoutMode: app-shell` now render
correctly in the Stackwright framework.

**What's new:**

- **`@stackwright/types`**: `PageContent` gains an optional top-level
  `layoutMode` field (`'page' | 'app-shell'`). Fully backward-compatible —
  existing pages without the field continue to validate and render as before.

- **`@stackwright/core`**: New `AppShellLayout` component — a locked-chrome
  layout where `TopAppBar` and `NavSidebar` are sticky and only the content
  viewport scrolls (`height: 100vh / overflow: hidden` root, `overflowY: auto`
  on the content column). `DynamicPage` routes to `AppShellLayout` when
  `pageContent.layoutMode === 'app-shell'`, and to the existing `PageLayout`
  otherwise.

- **`@stackwright/build-scripts`**: `normalizePageContent()` now handles the
  Dashboard Otter flat-array format (`content: [...]`) by normalizing it to
  `{ content: { content_items: [...] } }` before validation and JSON output.
  `layoutMode` is preserved at the top level through the `...page` spread.

Closes swp-0rz.
