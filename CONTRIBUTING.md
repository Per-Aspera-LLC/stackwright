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

## Pre-commit Hooks

This project uses husky for Git hooks:

- **pre-commit**: Auto-formats and lints staged files using lint-staged
- **commit-msg**: Validates conventional commit messages (feat:, fix:, etc.)

Hooks run automatically before commits. To bypass temporarily:
```bash
git commit --no-verify -m "wip: temporary commit"
```

---

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

## Turborepo (Optional)

Stackwright includes Turborepo for faster incremental builds. It is installed automatically but usage is optional.

```bash
# Use turbo for faster builds (recommended)
ppm turbo:build

# See what will be built without running
pnpm turbo:run build --dry-run
```

Turborepo caches build outputs locally. Use `turbo run build --force` to bypass cache.

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

1. Run `pnpm stackwright -- generate-agent-docs` to regenerate AGENTS.md tables in both `/AGENTS.md` and `examples/stackwright-docs/AGENTS.md`
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
@stackwright/scaffold-core — Hook system for extensible scaffold processing (Pro packages use this)
```

## Creating Pro Packages with Scaffold Hooks

Pro packages can extend the scaffold process using the hooks system in `@stackwright/scaffold-core`.

### Overview

The scaffold hooks system allows Pro packages to:
- Inject enterprise dependencies into `package.json`
- Configure custom MCP servers
- Add post-install verification
- Run custom setup scripts

### Hook Lifecycle Points

| Hook | When | Use Case |
|------|------|----------|
| `preScaffold` | Before scaffolding begins | Validate environment, check licenses |
| `preInstall` | After files created, before `pnpm install` | Modify `package.json`, set up `.code-puppy.json` |
| `postInstall` | After `pnpm install` completes | Verify installation, run setup scripts |
| `postScaffold` | After scaffolding complete | Final configuration, cleanup |

### Creating a Pro Launch Hooks Package

1. **Create package structure:**
   ```
   @stackwright-pro/launch-hooks/
   ├── package.json
   └── index.js
   ```

2. **package.json:**
   ```json
   {
     "name": "@stackwright-pro/launch-hooks",
     "version": "0.1.0",
     "main": "index.js",
     "dependencies": {
       "@stackwright/scaffold-core": "workspace:*"
     }
   }
   ```

3. **index.js** — Register hooks:
   ```javascript
   const { registerScaffoldHook } = require('@stackwright/scaffold-core');

   // Add enterprise license
   registerScaffoldHook({
     type: 'preInstall',
     name: 'enterprise-license',
     critical: true,
     handler: async (ctx) => {
       if (!process.env.PRO_API_KEY) {
         throw new Error('PRO_API_KEY required');
       }
       ctx.packageJson.dependencies['@stackwright-pro/license'] = '^1.0.0';
     },
   });

   // Configure enterprise MCP server
   registerScaffoldHook({
     type: 'preInstall',
     name: 'enterprise-mcp',
     priority: 20,
     handler: async (ctx) => {
       ctx.codePuppyConfig = ctx.codePuppyConfig || {};
       ctx.codePuppyConfig.mcp_servers = ctx.codePuppyConfig.mcp_servers || {};
       ctx.codePuppyConfig.mcp_servers.enterprise = {
         command: 'node',
         args: ['node_modules/@stackwright-pro/mcp/dist/server.js'],
         env: { API_KEY: process.env.PRO_API_KEY },
       };
     },
   });
   ```

4. **Usage:** Users add your package to their project:
   ```bash
   npx launch-stackwright --otter-raft my-site
   # Pro hooks run automatically during scaffold
   ```

### Hook Context

The context object passed to hooks:

```typescript
interface ScaffoldHookContext {
  targetDir: string;           // Project directory
  projectName: string;         // Project name
  siteTitle: string;           // Site title  
  themeId: string;             // Theme ID
  packageJson: Record<string, any>;   // Mutable - add dependencies
  codePuppyConfig?: Record<string, any>; // Mutable - add MCP config
  dependencyMode: 'workspace' | 'standalone';
  pages?: string[];            // Pages being created
  install?: boolean;           // Whether install will run
  [key: string]: any;          // Hooks can add custom properties
}
```

### Hook Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | `ScaffoldHookType` | Required | Lifecycle point |
| `name` | `string` | Required | Unique hook name |
| `priority` | `number` | `50` | Lower = runs first |
| `critical` | `boolean` | `false` | If true, failure fails entire scaffold |
| `handler` | `function` | Required | Async function to execute |

### Testing Pro Hooks

```bash
# Test hooks by running scaffold with your package installed
npx launch-stackwright --otter-raft test-project

# Verify package.json includes your dependency
cat test-project/package.json | grep @stackwright-pro

# Verify .code-puppy.json includes your MCP config
cat test-project/.code-puppy.json
```

### Hook Debugging

Enable debug output:
```bash
DEBUG=scaffold-hooks npx launch-stackwright --otter-raft my-site
```

Non-critical hook failures are logged but don't stop scaffold:
```
[Scaffold Hook] Non-critical hook "my-hook" failed: some error
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

---

## Testing Philosophy

Stackwright follows an **integration-first** testing approach:

### What We Test

✅ **Test these:**
- Content pipeline: YAML → prebuild → JSON → React rendering
- Schema validation: Zod schemas catch errors early
- Component registration and runtime behavior
- Build scripts: image co-location, path rewriting
- Visual regressions: screenshot-based testing for UI changes
- Security: path traversal, XSS resilience at schema level

❌ **Don't test these:**
- Third-party library internals (React, Next.js, Zod)
- Obvious single-line functions with no logic
- Pure TypeScript types (TypeScript compiler handles this)
- Trivial property pass-through (`<Component {...props} />`)

### Integration Over Unit

Prefer **integration tests** that exercise multiple layers over isolated unit tests:
- Test `runPrebuild()` with real temp directories, not mocked `fs`
- Test `DynamicPage` with real YAML content, not mocked props
- Test visual rendering in browser, not JSDOM snapshots

Unit tests are valuable when:
- Testing pure utility functions (e.g., `slugify`, `parseYamlFrontmatter`)
- Testing error handling paths that are hard to trigger in integration tests
- Testing complex logic isolated from I/O

### Test Structure

```typescript
describe('Feature Name — what it does', () => {
  // Setup
  beforeEach(() => {
    // Create temp dirs, reset state, etc.
  });

  it('does X when Y', () => {
    // Arrange
    const input = createTestInput();
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });

  it('throws clear error when invalid input', () => {
    expect(() => functionUnderTest(badInput)).toThrow(/helpful message/);
  });
});
```

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Run specific package tests
pnpm test:core
pnpm --filter @stackwright/cli test

# Watch mode (auto-rerun on changes)
pnpm --filter @stackwright/core exec vitest

# Run with coverage
pnpm test:coverage

# Open coverage report in browser
pnpm test:coverage:ui
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (includes visual regression)
pnpm test:e2e

# Update visual regression baselines
pnpm test:e2e --update-snapshots

# Run in headed mode (see the browser)
pnpm --filter @stackwright/e2e exec playwright test --headed

# Open Playwright UI for debugging
pnpm --filter @stackwright/e2e exec playwright test --ui
```

### Coverage Reports

```bash
# Generate merged coverage report for all packages
pnpm test:coverage

# View HTML report
open coverage/merged/index.html
```

Coverage reports show:
- Overall coverage across all packages
- Per-package breakdown
- Line, statement, function, and branch coverage
- Uncovered lines highlighted in HTML report

## Coverage Targets

We aim for **strategic coverage**, not blind 100%:

| Package | Target | Rationale |
|---------|--------|-----------|
| `@stackwright/core` | 80% | Core framework — critical path |
| `@stackwright/types` | 90% | Schemas are the contract — must be bulletproof |
| `@stackwright/build-scripts` | 75% | Prebuild is complex — good coverage prevents regressions |
| `@stackwright/cli` | 70% | CLI commands have many paths |
| `@stackwright/mcp` | 75% | MCP tools expose AI attack surface |
| `@stackwright/collections` | 75% | Data providers must handle edge cases |
| `@stackwright/nextjs` | 70% | Adapter layer — less logic, more glue |
| `@stackwright/themes` | 60% | Mostly CSS/JSX pass-through |

**Strategic gaps** (intentionally low/no coverage):
- Generated code (JSON schemas, type definitions)
- Build config files (`tsup.config.ts`, `vitest.config.ts`)
- Example applications (not library code)
- Documentation files

## Writing Good Tests

### DO:

```typescript
✅ Test behavior, not implementation
it('filters blog posts by tag', () => {
  const posts = getPosts({ tag: 'typescript' });
  expect(posts.every(p => p.tags.includes('typescript'))).toBe(true);
});

✅ Use descriptive test names
it('throws TypeError when siteConfig.title is missing') // Good
it('test error') // Bad

✅ Test error messages are helpful
expect(() => parse(badYaml)).toThrow(/line 5:.*unexpected token/i);

✅ Use realistic test data
const testSiteConfig = {
  title: 'My Test Site',
  navigation: [{ label: 'Home', href: '/' }],
  appBar: { titleText: 'My Site' },
};
```

### DON'T:

```typescript
❌ Don't test private internals
expect(component.state.internalCounter).toBe(5); // Breaks on refactor

❌ Don't snapshot everything
expect(renderedHTML).toMatchSnapshot(); // Brittle, hard to review

❌ Don't mock everything
vi.mock('fs'); // Use real temp dirs instead

❌ Don't test TypeScript types in runtime tests
expect(typeof value).toBe('string'); // TypeScript already checked this
```

## Visual Regression Testing

Visual tests use Playwright's `toHaveScreenshot()` to catch unintended UI changes:

```bash
# Run visual tests
pnpm test:e2e

# Update baselines after intentional UI change
pnpm test:e2e --update-snapshots
git add packages/e2e/tests/__screenshots__
git commit -m "Update visual regression baselines"
```

**When to update baselines:**
- After intentional CSS/layout changes
- After adding new content types
- After updating component styling

**CI behavior:**
- ✅ Pass: Screenshots match baselines (±1% threshold)
- ❌ Fail: Visual diff detected → downloads artifacts with diff images
- PR comment shows status and guides you to fix/update

See `packages/e2e/README.md` for detailed visual testing guide.

## SBOM Testing

When modifying `@stackwright/sbom-generator`:

1. **Unit tests** are required for all format generators (SPDX, CycloneDX, Build Manifest)
2. **Integration tests** should use real lockfiles from test fixtures
3. **Coverage target**: 80% minimum for the sbom-generator package
4. **Schema validation**: Test that generated SBOMs pass official SPDX/CycloneDX validators
5. **Error handling**: Test malformed lockfile scenarios

```bash
# Run SBOM tests
pnpm --filter @stackwright/sbom-generator test

# Update visual baselines if needed
pnpm --filter @stackwright/sbom-generator test --update-snapshots
```

### Running Tests

```bash
# All tests including SBOM
pnpm test

# SBOM generator only
pnpm --filter @stackwright/sbom-generator test

# With coverage
pnpm --filter @stackwright/sbom-generator test:coverage
```

## Schema Fuzzing


The `schema-fuzzing.test.ts` file stress-tests Zod schemas with randomized inputs:

```bash
pnpm --filter @stackwright/types test schema-fuzzing
```

This catches:
- Edge cases (empty strings, very long strings, unicode)
- Validation bypass attempts
- Performance regressions (1000+ validations must run in <5s)
- Security issues (path traversal, injection attempts)

Run fuzzing tests after modifying schemas in `packages/types/`.

## Debugging Failed Tests

### Vitest Tests

```bash
# Run single test file
pnpm --filter @stackwright/core test prebuild.test.ts

# Run single test by name pattern
pnpm --filter @stackwright/core test -t "copies images"

# Use --reporter=verbose for full output
pnpm --filter @stackwright/core test --reporter=verbose
```

### Playwright Tests

```bash
# Run in headed mode to see browser
pnpm --filter @stackwright/e2e exec playwright test --headed

# Open Playwright UI for step-by-step debugging
pnpm --filter @stackwright/e2e exec playwright test --ui

# Generate trace files for failed tests
pnpm --filter @stackwright/e2e exec playwright test --trace on
```

### CI Failures

1. **Check the logs:** GitHub Actions → failed workflow → expand failed step
2. **Download artifacts:** Coverage reports, visual diffs, Playwright traces
3. **Reproduce locally:** Run the exact command that failed in CI
4. **Check for flakes:** Re-run the workflow — if it passes, it's a flake (file an issue)


---

## Accessibility Testing

Stackwright follows **WCAG 2.1 Level AA** standards for accessibility.

### Running Accessibility Tests

```bash
# Run all accessibility tests
pnpm --filter @stackwright/e2e exec playwright test tests/a11y/

# WCAG compliance tests (axe-core)
pnpm --filter @stackwright/e2e exec playwright test a11y/wcag-compliance.spec.ts

# Keyboard navigation tests
pnpm --filter @stackwright/e2e exec playwright test a11y/keyboard-navigation.spec.ts
```

### What We Test

✅ **WCAG 2.1 AA Requirements**:
- Color contrast (4.5:1 for normal text, 3:1 for large text)
- Semantic HTML (`<nav>`, `<main>`, `<button>`, `<a>`)
- ARIA roles and labels
- Form labels and error messages
- Image alt text
- Heading hierarchy (h1 → h2 → h3)
- Link text (no "click here")

✅ **Keyboard Accessibility**:
- All interactive elements keyboard-accessible (Tab)
- Visible focus indicators
- No keyboard traps
- Logical tab order
- Skip links work
- Modals dismiss with Escape
- Dropdowns navigate with Arrow keys

### When to Run A11y Tests

**Always run before**:
- Adding new content types
- Changing component styling
- Modifying theme colors
- Adding interactive features (buttons, forms, modals)

**Tests fail if**:
- axe-core finds WCAG violations
- Keyboard navigation is broken
- Focus indicators are missing
- Tab order is illogical

### Fixing Violations

Common issues and fixes:

| Issue | Fix |
|-------|-----|
| Missing alt text | Add `alt` prop to all images |
| Low contrast | Use theme colors (already WCAG-compliant) |
| Missing form labels | Wrap inputs in `<label>` or use `aria-label` |
| Non-semantic HTML | Use `<button>` instead of `<div onClick>` |
| Keyboard trap | Ensure Tab moves focus out of component |

See `packages/e2e/TESTING_INFRASTRUCTURE.md` for detailed accessibility guide.

---

## Cross-Browser Testing

E2E tests run on multiple browsers and viewports in CI.

### Test Matrix

| Browser | Viewports | OS |
|---------|-----------|-----|
| Chromium | Desktop (1280×720), Mobile (375×667) | Ubuntu |
| Firefox | Desktop (1280×720), Mobile (375×667) | Ubuntu |
| WebKit (Safari) | Desktop (1280×720), Mobile (375×667) | Ubuntu |

**Total**: 6 test runs per PR (3 browsers × 2 viewports)

### Running Cross-Browser Tests Locally

```bash
# Run on specific browser
pnpm --filter @stackwright/e2e exec playwright test --project=chromium
pnpm --filter @stackwright/e2e exec playwright test --project=firefox
pnpm --filter @stackwright/e2e exec playwright test --project=webkit

# Run on all browsers
pnpm test:e2e

# Run specific test on all browsers
pnpm --filter @stackwright/e2e exec playwright test smoke.spec.ts
```

### Browser-Specific Issues

**WebKit (Safari)**:
- Some CSS features have limited support
- Use `@supports` queries for fallbacks
- Test on actual Safari when possible

**Firefox**:
- Font rendering may differ slightly from Chromium
- Baseline screenshots are taken on Chromium (±1% threshold allows for minor diffs)

**Mobile viewports**:
- Touch targets must be ≥44×44px (WCAG 2.1)
- Test with `--device="iPhone 12"` for realistic mobile testing

---

## Test Infrastructure Reference

For comprehensive testing documentation, see:

📖 **[packages/e2e/TESTING_INFRASTRUCTURE.md](packages/e2e/TESTING_INFRASTRUCTURE.md)**

This 400+ line guide covers:
- All test suites (unit, E2E, visual, a11y, performance, fuzzing)
- How to run each type of test
- Performance budgets and how they're enforced
- Accessibility standards (WCAG 2.1 AA) explained
- Comprehensive troubleshooting guide
- Best practices for writing good tests
- CI/CD integration details

