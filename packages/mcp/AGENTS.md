# @stackwright/mcp — Agent Guide

MCP (Model Context Protocol) server for Stackwright. Exposes content types, page management, site configuration, and project management as tools for AI agents (Claude Code, Claude for Desktop, etc.).

---

## Running

```bash
# From monorepo root (stdio transport — for use with Claude Code or Claude for Desktop)
pnpm stackwright-mcp
```

The server communicates via stdio and implements the MCP SDK protocol.

---

## Available Tool Groups

| Tool file | Tools provided |
|-----------|---------------|
| `tools/content-types.ts` | Introspect content type schemas, list registered types, get field definitions |
| `tools/pages.ts` | List pages, read page content, create/update pages |
| `tools/site.ts` | Read/update site configuration |
| `tools/board.ts` | `stackwright_get_board` — query the GitHub Issues product board |
| `tools/git-ops.ts` | Git workflow helpers (branch, commit, status) |
| `tools/project.ts` | Project info, package versions, build status |
| `tools/render.ts` | Visual rendering — screenshot pages, check dev server, capture before/after diffs |
| `tools/collections.ts` | Collection management — list, read, write collection entries |
| `tools/compose.ts` | Atomic whole-site composition with cross-page validation |

---

## Architecture

The MCP server introspects live Zod schemas at runtime via `schema.def` (Zod v4). This means tool parameter schemas and content type documentation are always in sync with the actual type system — no manual maintenance.

---

## Visual Rendering

The render tools (`tools/render.ts`) give AI agents visual feedback on their content changes. A Playwright browser instance is pooled and reused across render calls (5-minute idle timeout auto-teardown).

**Prerequisites**: A Stackwright dev server must be running (`pnpm dev` in the project directory). The render tools connect to it and screenshot pages via headless Chromium.

**Workflow for brand-focused authoring**:
1. `stackwright_check_dev_server` — verify the server is reachable
2. `stackwright_render_diff` — capture the "before" state
3. `stackwright_write_page` / `stackwright_compose_site` — make changes
4. `stackwright_render_page` — see the "after" state
5. Compare visually — does it match the brand? Iterate if needed.

---

## Package Structure

```
src/
  server.ts    — MCP server entry point (stdio transport)
  tools/       — One file per tool group
  renderer/    — Playwright-based page screenshot engine
```

## Dependencies

- **@modelcontextprotocol/sdk** — MCP protocol implementation
- **@stackwright/cli** — Reuses CLI command implementations
- **@stackwright/types** — Zod schemas for runtime introspection
- **playwright** — Headless Chromium for visual page rendering
- **zod** ^4 — Schema definitions
