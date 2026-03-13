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

---

## Architecture

The MCP server introspects live Zod schemas at runtime via `schema.def` (Zod v4). This means tool parameter schemas and content type documentation are always in sync with the actual type system — no manual maintenance.

---

## Package Structure

```
src/
  server.ts    — MCP server entry point (stdio transport)
  tools/       — One file per tool group
```

## Dependencies

- **@modelcontextprotocol/sdk** — MCP protocol implementation
- **@stackwright/cli** — Reuses CLI command implementations
- **@stackwright/types** — Zod schemas for runtime introspection
- **zod** ^4 — Schema definitions
