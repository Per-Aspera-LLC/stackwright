---
'@stackwright/mcp': minor
---

Rename all MCP tools from `stackwright_<verb>_<object>` to `sw_<verb>_<object>` (swp-aj1o.2.1). This drops the redundant `stackwright` prefix now that the composed server itself is named `sw`, and shortens the wire-level name code-puppy/Claude Code produce (`cp_sw_sw_render_page` instead of `cp_stackwright-mcp_stackwright_render_page`).

All 27 old `stackwright_*` names remain registered as compat aliases for one release — same handler, same schema, with a one-line deprecation note appended to the tool description. They will be removed in the next minor after this one.

New exports from both `@stackwright/mcp` (package root) and `@stackwright/mcp/register`:

- `SW_TOOL_ALIASES: Record<string, string>` — exhaustive legacy-name -> canonical-name map.
- `canonicalToolName(name: string): string` — resolves any tool name (wire-prefixed by code-puppy/Claude Code, or bare, legacy or current) to its canonical name. Never throws.
- `registerWithAlias(server, canonical, legacy, description, schema, handler)` — the helper every tool file now uses internally to register both names against one handler.

See `docs/TOOL-NAMING.md` for the full naming convention, the alias policy, and the wire-prefix explanation.
