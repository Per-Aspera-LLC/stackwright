---
"@stackwright/cli": minor
---

feat(cli): add `generate-agent-docs` command to auto-generate AGENTS.md content type reference tables from live Zod schemas (closes #83)

- New `pnpm stackwright -- generate-agent-docs` command introspects Zod schemas at runtime and regenerates the content type reference tables in `/AGENTS.md` and `examples/hellostackwrightnext/AGENTS.md`
- Tables are delimited by `<!-- stackwright:content-type-table:start/end -->` HTML comment markers; non-table content is preserved
- Schema name registry maps Zod schema object references to human-readable type names (TextBlock, MediaItem, etc.) for readable output
- Fixed `resolveSchema` to correctly handle `optional(lazy(...))` wrapper nesting (fixes `tabbed_content` showing empty fields)
- CI job `check-agent-docs` runs the generator and fails with an actionable message if AGENTS.md is out of sync
- `generateAgentDocs()` exported from `@stackwright/cli` for programmatic use
