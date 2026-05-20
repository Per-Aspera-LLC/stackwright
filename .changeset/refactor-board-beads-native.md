---
"@stackwright/cli": minor
"@stackwright/mcp": minor
---

Replace GitHub Issues board with beads-native implementation. The `stackwright board` CLI command and `stackwright_get_board` MCP tool now read from `.beads/issues.jsonl` instead of calling the `gh` CLI. No GitHub authentication or `gh` CLI required.

**Breaking change in `@stackwright/cli` public types**: `GhIssueRaw` is removed (replaced by `BeadsIssue`); `BoardIssue.number` is now `BoardIssue.id: string`; `BoardIssue.labels` and `BoardIssue.assignees` are removed; `BoardIssue.issueType` is added.
