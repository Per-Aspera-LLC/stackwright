---
"@stackwright/mcp": minor
---

Add `@stackwright/mcp` — a stdio-based MCP server (`pnpm stackwright-mcp`) that exposes Stackwright as 8 agent tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. All tools use Zod for input validation and return structured MCP responses with error flags.
