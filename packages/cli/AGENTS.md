# @stackwright/cli — Agent Guide

Command-line interface for Stackwright. Provides project scaffolding, content management, theme operations, and the product board.

---

## Running the CLI

From the monorepo root (note the `--` separator):

```bash
pnpm stackwright -- --help
pnpm stackwright -- board
pnpm stackwright -- info
pnpm stackwright -- types
```

Project-aware commands must be run from inside a Stackwright project:
```bash
cd examples/hellostackwrightnext
pnpm stackwright -- page list
```

---

## Available Commands

| Command | File | Purpose |
|---------|------|---------|
| `board` | `src/commands/board.ts` | Display the priority-tiered product board (reads `.beads/issues.jsonl`) |
| `generate-agent-docs` | `src/commands/generate-agent-docs.ts` | Regenerate content type tables in all AGENTS.md files from live Zod schemas |
| `git-ops` | `src/commands/git-ops.ts` | Git workflow helpers |
| `info` | `src/commands/info.ts` | Display project and environment info |
| `page` | `src/commands/page.ts` | Page management (list, create, validate) |
| `prebuild` | `src/commands/prebuild.ts` | Trigger the prebuild pipeline manually |
| `scaffold` | `src/commands/scaffold.ts` | Scaffold a new Stackwright project |
| `site` | `src/commands/site.ts` | Site configuration management |
| `theme` | `src/commands/theme.ts` | Theme operations (list, create, validate) |
| `types` | `src/commands/types.ts` | Display registered content types |

---

## Package Structure

```
src/
  cli.ts           — Main CLI entry point (commander setup)
  commands/        — One file per command
  types.ts         — CLI-specific types
  utils/           — Shared utility functions
  index.ts         — Public exports
```

---

## Dependencies

- **commander** — CLI framework
- **@inquirer/prompts** — Interactive prompts
- **chalk** — Terminal colors
- **@stackwright/build-scripts** — Prebuild pipeline
- **@stackwright/themes** — Theme loading/validation
- **@stackwright/types** — Zod schemas for validation
- **js-yaml** — YAML parsing
- **fs-extra** — File operations
- **zod** ^4 — Schema validation

---

## Key Notes

- The `board` command reads `.beads/issues.jsonl` (walking up from cwd) and displays open issues sorted by numeric priority (`1`=now, `2`=next, `3`=later, `4`=vision). Requires beads to be initialized (`bd init`).
- The `generate-agent-docs` command introspects live Zod schemas and writes the content type reference tables into AGENTS.md files. **Do not edit those tables manually.**
- All commands use `commander` for consistent structure and `--help` output.
