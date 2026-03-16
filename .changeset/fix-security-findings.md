---
'@stackwright/cli': patch
---

Fix shell injection vulnerability in template-fetcher by replacing execSync with execFileSync (CodeQL CWE-78/CWE-88). Add pnpm overrides for vulnerable transitive dependencies (undici, flatted, hono, @hono/node-server, express-rate-limit) to resolve all open Dependabot alerts.
