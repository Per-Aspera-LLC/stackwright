---
"@stackwright/mcp": minor
---

Add visual rendering tools to the MCP server — `stackwright_render_page`, `stackwright_render_diff`, and `stackwright_check_dev_server`. These give AI agents a visual feedback loop: render any page to a screenshot, capture before/after comparisons, and verify brand consistency beyond schema validation alone. Uses Playwright with browser instance pooling for sub-second re-renders after cold start.
