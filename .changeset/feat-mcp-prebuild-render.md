---
"@stackwright/mcp": patch
---

feat(mcp): auto-trigger prebuild before render in all four render tools. Replaces the fragile 2-second sleep in `stackwright_render_yaml` with an explicit `runPrebuild()` call so co-located images are always processed. Adds optional `projectRoot` param to `stackwright_render_page` and `stackwright_render_diff` for the same benefit.
