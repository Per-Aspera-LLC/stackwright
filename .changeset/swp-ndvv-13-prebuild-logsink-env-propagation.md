---
'@stackwright/build-scripts': patch
---

`runPrebuild({ logSink })` now also sets `process.env.STACKWRIGHT_LOG_STREAM`
in addition to this package's own local sink.

`runPrebuild()`'s `setLogSink()` call only ever affected this package's own
module-scoped `currentSink` in whichever bundle chunk that code runs in.
`discoverAndAttachPlugins()` dynamic-imports Pro prebuild plugins (e.g.
`@stackwright-pro/openapi`) from the calling project's own node_modules — a
separate entry point (tsup `splitting: false` means each package export has
its own inlined copy of every module it imports, including that package's
own `log.ts`) that a local `setLogSink()` call can never reach, no matter how
many packages adopt the "own `log.ts` + `setLogSink`" convention this module
documents.

`STACKWRIGHT_LOG_STREAM` — already documented as this convention's
"belt-and-braces fallback" and already read by every package that follows
it — is process-global regardless of bundle/module-instance duplication.
Mirroring the explicit `logSink` choice into it closes that gap for every
current and future plugin package without requiring per-plugin call sites.

Root-caused a G3 geo gate regression: `sw_render_page` calling
`runPrebuild({ projectRoot, logSink: 'stderr' })` discovered
`@stackwright-pro/openapi`'s `OpenAPIPlugin`, whose own bundle never heard
about the `stderr` sink, so its `log()` calls defaulted to stdout and
corrupted the MCP stdio JSON-RPC stream (249 parse failures in one gate
run). See `pro/gates/geo/G3-2026-09-19.md` and bead `swp-ndvv.13`.
