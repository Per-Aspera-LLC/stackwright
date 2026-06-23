---
"@stackwright/mcp": minor
---

feat(mcp): expose register\*Tools and closeBrowser via /register subpath for downstream composition (fixes swp-hbdx)

Adds a new `@stackwright/mcp/register` subpath export that re-exports all
tool registrar functions and `closeBrowser` without any side effects (no
McpServer instantiation, no transport binding). Downstream packages (Pro,
third-party MCP composers) can now import and compose OSS tools onto their
own McpServer instances.

Changes:
- New `src/register.ts` — pure re-export module, no side effects
- `src/server.ts` — refactored to import from `register.ts` (single source of truth)
- `package.json` — `./register` added to exports map
- `tsup.config.ts` — `register` entry added; DTS enabled for `register` only
- `tsconfig.json` — `types: ["node"]` added (required for DTS generation)
- `vitest.config.ts` — alias for `@stackwright/build-scripts` (Vite 7 CJS resolution workaround)
- `test/register-subpath.test.ts` — integration test asserting full tool surface on a real McpServer
