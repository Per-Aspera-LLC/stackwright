---
'@stackwright/cli': minor
---

Fix a11y runner login-bounce false-pass (stackwright-8v2 / swp-kwv8): `runA11yAudit`
opened a cookie-less browser context per slug x mode and reported `A11yPageResult.url`
before navigation, so an auth redirect to /login scanned clean under axe and was
reported as an indistinguishable `pass: true`. Every scan now carries `requestedUrl`,
`finalUrl`, `redirected`, `redirectedToLogin`, and a `status` (`'audited' | 'redirected'
| 'error'`) -- `pass` is only meaningful when `status === 'audited'`, and a redirected
scan is never reported as a pass. Overall `result.pass` is false whenever any scan
redirected unless the caller opts in via the new `allowRedirects: true` option (default
false); redirects are auth-coverage evidence, not audit coverage. `A11yViolation` now
carries `nodes[]` (axe's per-node `target` selectors + `failureSummary`, capped at 10
per violation) so callers can root-cause a failure directly from the DOM instead of
hand-writing a diagnostic script. New `cookies`/`extraHTTPHeaders` runner options let a
caller authenticate the browser context directly. `stackwright test:a11y` gains a
`--allow-redirects` flag and prints redirected/errored scans distinctly (never as a pass).
