---
"@stackwright/cli": minor
"@stackwright/mcp": minor
---

Add `stackwright_compose_site` MCP tool and `stackwright compose` CLI command for atomic whole-site generation with cross-page semantic validation.

New capabilities:
- Validate and write site config + all pages in a single atomic operation
- Cross-page semantic checks: nav linkage, orphan pages, button hrefs, collection sources, duplicate titles, theme colors
- Errors block all writes; warnings are reported but don't block
