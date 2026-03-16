# Contributing to Stackwright

Thank you for contributing to Stackwright! This guide covers everything you need to get started as a contributor.

For architectural rationale and product philosophy, see [PHILOSOPHY.md](./PHILOSOPHY.md). For AI agent-specific guidance, see [AGENTS.md](./AGENTS.md). For Claude Code-specific instructions, see [CLAUDE.md](./CLAUDE.md).

---

## Getting Started

```bash
git clone https://github.com/Per-Aspera-LLC/stackwright.git
cd stackwright
pnpm install
pnpm build
```

Run the example app to verify everything works:

```bash
pnpm dev:hellostackwright
```

## Branching Workflow

- **`dev`** is the integration branch. Feature branches are created from `dev` and PRs target `dev`.
- **`main`** is the release branch. `dev` is merged to `main` only when cutting a release.

Always pull the latest `dev` before creating a feature branch:

```bash
git fetch origin dev && git checkout -b feat/issue-XX-description origin/dev
```

## Commit Discipline

**Commit early and often at logical checkpoints.** Don't accumulate a large diff across an entire feature branch — break the work into meaningful, reviewable commits. Each commit should leave the codebase in a buildable state.

Good commit points:
- After adding a new module or file that compiles/passes lint
- After wiring up a new feature end-to-end (even before tests)
- After adding or updating tests for the feature
- After updating docs, ROADMAP.md, or changesets
- Before and after a refactor that touches many files

Commit messages should be concise and use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Include the issue number when relevant (e.g., `feat(build-scripts): add --watch mode (#122)`).

## Build Commands

```bash
# Build all packages (excludes examples)
pnpm build

# Build everything including examples
pnpm build:all

# Build individual packages
pnpm build:core
pnpm build:types
pnpm build:themes
pnpm build:nextjs
pnpm build:cli
pnpm build:build-scripts
pnpm build:mcp

# Run development mode (watch all packages)
pnpm dev

# Run the example application
pnpm dev:hellostackwright

# Run CLI commands (from monorepo root — note the --)
pnpm stackwright -- --help
pnpm stackwright -- types
pnpm stackwright -- info

# Generate JSON schemas from Zod schemas
cd packages/types && pnpm generate-schemas
```

## Testing

**Unit tests** (`pnpm test`): Vitest with JSDOM. Tests live in `packages/*/test/`. When adding or modifying components, update the corresponding unit tests in `packages/core/test/`.

```bash
# Run all unit tests
pnpm test

# Run core package tests only
pnpm test:core
```

**E2E tests** (`pnpm test:e2e`): Playwright tests in `packages/e2e/` that verify the full YAML → prebuild → Next.js build → browser pipeline against `examples/hellostackwrightnext/`. When adding new content types, add example usage in the example app so E2E smoke tests cover them. The E2E tests check that every page renders content, has no error boundaries, produces no critical console errors, and that all nav links resolve.

## Pre-Push Checklist

**CI enforces linting and formatting. Run these before every push:**

```bash
pnpm format          # Auto-fix Prettier formatting
pnpm lint            # Check ESLint (warnings are fine, errors are not)
pnpm test            # Run all unit tests
```

Or as a one-liner:

```bash
pnpm format && pnpm lint && pnpm test
```

> **Tip:** Configure your editor to format on save with the project's `.prettierrc` config. This avoids formatting-only commits entirely.

To check formatting without writing (useful in CI or to see what's wrong):

```bash
pnpm format:check    # Exits non-zero if any file needs formatting
```

## Naming Conventions

- File names: kebab-case (`main-content-grid.tsx`)
- Component names: PascalCase (`MainContentGrid`)
- YAML files: kebab-case (`about-us.yaml`)
- CLI command names: kebab-case (`generate-content`)

## Changeset Requirement

**Every PR that changes user-facing behavior MUST include a changeset.** Run `pnpm changeset` before committing, select the affected packages, choose the bump type (patch for fixes, minor for features), and write a short summary. Commit the generated `.changeset/*.md` file with your PR. CI will fail if a changeset is missing for changed packages.

```bash
pnpm changeset          # Create a changeset (required per PR)
```

Versioning and publishing are **fully automated**. When `dev` is merged to `main`, CI exits prerelease mode, consumes all pending changesets, publishes stable versions to npm, and back-merges the version bumps into `dev`. No manual `version-packages` or `release` steps needed.

## Content Type Maintenance Rule

**When modifying `packages/types/src/types/` — adding, removing, or changing any content type, field, or enum — you MUST:**

1. Run `pnpm stackwright -- generate-agent-docs` to regenerate AGENTS.md tables in both `/AGENTS.md` and `examples/hellostackwrightnext/AGENTS.md`
2. Regenerate JSON schemas: `cd packages/types && pnpm generate-schemas`
3. Update or add unit tests in `packages/core/test/` for the affected component
4. Verify E2E tests still pass (`pnpm test:e2e`) — add example usage in `examples/hellostackwrightnext/` for new content types so E2E coverage includes them

The AGENTS.md tables are auto-generated from the live Zod schemas. Do NOT edit the content between the `<!-- stackwright:content-type-table:start/end -->` markers manually — run `generate-agent-docs` instead. CI will fail if the tables are out of sync.

## Priority Labels & Product Board

Work is tracked via GitHub Issues with priority labels. `ROADMAP.md` is a narrative document describing architectural direction — not a task tracker.

| Label | Meaning |
|-------|--------|
| `priority:now` 🔴 | Actively in progress or next up |
| `priority:next` 🟡 | Committed — starting soon |
| `priority:later` 🟢 | Planned but not yet committed |
| `priority:vision` 🟣 | Aspirational — shapes direction, no timeline |

**View the board:**
```bash
# Terminal
pnpm stackwright -- board

# JSON output (CI / scripts)
pnpm stackwright -- board --json
```

Agents can call `stackwright_get_board` via MCP for the same data.

The architect sets priority tiers. Contributors and agents should pick work from `priority:now` first, then `priority:next`. When a PR closes an issue, GitHub handles it automatically — no manual ROADMAP.md updates needed.

## Package Structure

```
@stackwright/core         — YAML→React engine, component registry, layout system
@stackwright/nextjs       — Next.js adapter (Image, Link, Router, static gen helpers)
@stackwright/themes       — YAML-configurable MUI theming
@stackwright/types        — TypeScript types + JSON schemas for IDE validation
@stackwright/icons        — MUI icon registry
@stackwright/build-scripts — Prebuild pipeline (image co-location, path rewriting)
@stackwright/cli          — CLI for scaffolding, page management, validation
```

## Build System Notes

Each package uses **tsup** to produce dual-format output (ESM `.mjs` + CJS `.js`) with TypeScript declarations. Alpha prereleases are published automatically from `dev`; stable releases are published automatically when `dev` is merged to `main`. Both flows are managed via Changesets.

**Important**: Do NOT add `"type": "module"` to `package.json` in any `packages/*` directory. tsup uses `.mjs`/`.js` file extensions to signal ESM vs CJS format. Adding `"type": "module"` causes Node to treat CJS `.js` output as ESM, breaking `require()` in Next.js config files.

## Troubleshooting

- **ESM "Cannot find module" errors**: Missing `.js` extensions in ESM imports in built output. Also check that no `packages/*` package.json has `"type": "module"` set.
- **`module is not defined` in ES module scope**: A package has `"type": "module"` in its package.json. Remove it — tsup extension conventions are sufficient.
- **Schema generation fails**: Fix TypeScript errors in source before running `pnpm generate-schemas`.
- **Changeset validation fails**: Run `pnpm changeset` and commit the generated file.
- **Build fails after dependency updates**: Run `pnpm install` from root.
- **Clear build cache**: Delete `packages/*/dist` directories.
- **Components not rendering / blank page**: Verify `registerNextJSComponents()` is called before first render in `_app.tsx` or `layout.tsx`.
