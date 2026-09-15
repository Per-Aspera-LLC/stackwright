---
'@stackwright/mcp': patch
---

`stackwright_test_a11y`'s formatter now prints `finalUrl` on every scan line, marks
redirected scans distinctly (`REDIRECTED -> finalUrl, not audited`, never a pass), and
prints up to 3 axe node target selectors per failing violation so callers can root-cause
directly from the DOM. Adds a `allowRedirects` tool parameter (forwarded to the CLI
runner, default false) and a machine-readable JSON trailer (`scans[]` +
`summary.audited/redirected/failed`) so wrapper/otter callers can parse per-scan status
without regexing prose (stackwright-8v2 / swp-kwv8).
