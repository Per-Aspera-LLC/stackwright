---
'@stackwright/build-scripts': minor
'@stackwright/mcp': patch
'@stackwright/types': patch
---

swp-w00k: fix MCP stdio JSON-RPC framing corruption caused by build-scripts progress output.

**Root cause:** `runPrebuild()` and the `compile*` primitives wrote progress lines (e.g. `  [OK] _site.json`) via `console.log`, which targets `process.stdout`. That's correct for the `stackwright-prebuild` CLI, but when `sw_render_page` / `sw_render_diff` / `sw_render_yaml` call `runPrebuild()` in-process (whenever a `projectRoot` is supplied), those plain-text lines land on the same stdout stream the MCP stdio transport uses exclusively for newline-delimited JSON-RPC frames — corrupting message framing for the client (`Failed to parse JSONRPC message from server`, 552x in one gate run).

**`@stackwright/build-scripts` (minor):**
- New `src/log.ts` — a small configurable sink (`'stdout' | 'stderr' | 'silent'`, defaults to `'stdout'`) wrapping `console.log`/`console.error` (preserves exact prior stdout behavior for CLI users and for any test suite spying on `console.log`).
- `setLogSink()` / `getLogSink()` exported from the package root — the explicit API for callers that share a process with an MCP stdio transport.
- `PrebuildOptions.logSink` — convenience field so `runPrebuild({ projectRoot, logSink: 'stderr' })` sets the sink in one call.
- `STACKWRIGHT_LOG_STREAM` env var — belt-and-braces fallback (`stdout` | `stderr` | `silent`).
- All 62 `console.log` call sites across `prebuild.ts`, `watch.ts`, `build-searchIndex.ts`, `image-optimizer.ts`, and `compile/*.ts` now route through `log()`. Message text is unchanged (gate reports grep some of these lines). `console.warn`/`console.error` call sites were left as-is — they already write to stderr by Node.js default and were never part of this bug.

**`@stackwright/mcp` (patch):**
- `sw_render_page`, `sw_render_diff`, `sw_render_yaml` now call `runPrebuild({ projectRoot, logSink: 'stderr' })` instead of `runPrebuild(projectRoot)`, so build-scripts' progress output goes to stderr (which MCP stdio servers may write to freely) instead of stdout.

**`@stackwright/types` (patch):**
- `PrebuildOptions` gains the optional `logSink?: 'stdout' | 'stderr' | 'silent'` field described above.
