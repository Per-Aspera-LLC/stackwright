---
"@stackwright/cli": minor
"@stackwright/mcp": patch
---

CLI overhaul for AI agent workflow (Phase 0+1):

- **fix**: Pure functions (`scaffold()`, `addPage()`) now throw typed errors instead of calling `process.exit()`. MCP server no longer crashes on scaffold/page failures.
- **feat**: `--force` flag on `scaffold` for non-empty directories. MCP scaffold tool defaults force to true.
- **feat**: `--no-interactive` flag skips all prompts with sane defaults. `--json` implies non-interactive.
- **feat**: `--monorepo` flag with auto-detection of pnpm workspaces. Generates `workspace:*` dependencies when inside a monorepo.
- **fix**: Error messages now suggest recovery actions (e.g., "Use `stackwright scaffold` to create a project").
- **fix**: Pages directory detection aligned between CLI and MCP. Single source of truth via `resolvePagesDir()`.
