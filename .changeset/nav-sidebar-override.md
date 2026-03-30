---
"@stackwright/core": minor
"@stackwright/types": minor
---

feat(core): add page-level `navSidebar` override in `content.yml`

Pages can now override the site-wide sidebar defined in `stackwright.yml` using the `navSidebar` field. This enables:

- Dashboard pages to hide the sidebar (`navSidebar: null`) for full-width content
- Documentation chapters to show page-specific navigation in the sidebar
- Page Otter to customize sidebar behavior without editing the theme

The resolution order is: page `navSidebar` > site `sidebar` (from Theme Otter) > no sidebar.

Docs and AGENTS.md updated with examples and Otter responsibility notes.
