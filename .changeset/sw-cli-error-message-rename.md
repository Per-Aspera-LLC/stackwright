---
'@stackwright/cli': patch
---

swp-ndvv: update the `openPr()` "no staged changes" error message to reference the renamed `sw_stage_changes` MCP tool instead of the retired `stackwright_stage_changes` name (missed changeset from the sw_/swp_ tool rename in e2259cd — the rename itself only touched `@stackwright/mcp`, but this one string in `@stackwright/cli` was updated alongside it and needs its own release note since it's user-visible CLI output).
