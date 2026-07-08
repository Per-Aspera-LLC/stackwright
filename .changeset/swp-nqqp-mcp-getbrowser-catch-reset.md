---
"@stackwright/mcp": patch
---

Fix `getBrowser()` in the MCP server caching a rejected `chromium.launch()` promise forever.

Previously, if the first browser launch rejected (e.g. before `npx playwright install` had completed the chromium binary download), the rejected promise was stored in the module-level `launchPromise` cache and never reset, causing every subsequent `stackwright_render_page` / `stackwright_test_a11y` call for the lifetime of the MCP session to return the frozen rejection. The only recovery was restarting the host process.

Added a `.catch` reset that clears `launchPromise` on rejection and re-throws, so the next call retries fresh.

Same "fail-loudly at the seam" family as the four P0 launcher bugs (swp-eezo/85mm/ohvg/j2cq). Discovered during post-dhl-opus-012 arc validation when a fresh QA re-run against the disaster-health-logistics artifact hit the cached rejection and could not recover without a Claude Code restart.
