---
"@stackwright/mcp": minor
"@stackwright/cli": minor
---

Add visual rendering tools to the MCP server — `stackwright_render_page`, `stackwright_render_diff`, `stackwright_render_yaml`, and `stackwright_check_dev_server`. These give AI agents a visual feedback loop: render any page to a screenshot, preview raw YAML before committing, capture before/after comparisons, and verify brand consistency.

Add `stackwright preview` CLI command for rendering pages to screenshot files. Requires Playwright (optional peer dependency).

Uses Playwright with browser instance pooling for sub-second re-renders after cold start.
