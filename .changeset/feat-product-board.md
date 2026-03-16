---
'@stackwright/cli': minor
'@stackwright/mcp': minor
---

Add `board` CLI command and `stackwright_get_board` MCP tool for priority-tiered product board

- `pnpm stackwright -- board` displays open GitHub Issues organized by priority label (now/next/later/vision)
- `--json` flag outputs structured `BoardResult` for scripting and CI
- `stackwright_get_board` MCP tool provides the same data to AI agents
- Pure `parseBoard()` function exported for programmatic use
- ROADMAP.md transformed from stale checklist to architectural narrative document
- Priority label system documented in CONTRIBUTING.md
