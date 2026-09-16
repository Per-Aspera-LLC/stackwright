---
'@stackwright/cli': patch
'@stackwright/mcp': patch
---

Wire the `cookies`/`extraHTTPHeaders` runner options (added to `A11yRunnerOptions` in
0.10.0, `stackwright-8v2` / `swp-kwv8`) through the two public entry points that were
still dropping them on the floor (`swp-0k73`): `testA11y()`'s `TestA11yOptions` now
declares `cookies`/`extraHTTPHeaders` and forwards them to `runA11yAudit`, and the
`stackwright_test_a11y` MCP tool's schema now exposes both params and forwards them to
`testA11y`. Previously the only supported way to authenticate a scan was rewriting each
slug through an app's own login route, which makes `requestedUrl` differ from `finalUrl`
by construction -- the runner's own redirect classifier then marks every such scan
`status: 'redirected'` (never `'audited'`, axe-core never runs) even when the scan
landed exactly on the intended route. Passing a persona/auth cookie directly instead
means `requestedUrl === finalUrl` for a successful scan, so it is correctly classified
`'audited'` and actually gets measured.
