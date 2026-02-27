# Stackwright Roadmap

This file tracks planned work across the project. Items are roughly ordered by priority within each section. Move items to a changeset when work begins.

---

## Immediate: Bug Fixes (top priority over all unchecked items below)

### Sprint 1 — Correctness crashes and contract violations

- [x] **Fix `debugLogStackwright` temporal dead zone crash** — In `packages/core/src/utils/stackwrightComponentRegistry.ts`, the `debugLogStackwright` const arrow function is declared at line 82 but called starting at line 7. This is a `ReferenceError` at module load time if any `register()` call happens during initialization. Move the function declaration above the class.
- [x] **Fix cross-package source import in `PageLayout`** — `packages/core/src/components/structural/PageLayout.tsx:4` imports `SiteConfig` directly from `../../../../types/src/types/siteConfig` (the other package's `src/` directory). This breaks for downstream consumers who only have `dist/`. Change to `import { SiteConfig } from '@stackwright/types'`.
- [x] **Remove auto-registration side effect from `@stackwright/nextjs`** — `packages/nextjs/src/index.ts` calls `registerNextJSComponents()` as a module side effect, violating the documented contract ("Do not rely on module import side effects"). This causes double-registration when users also call it explicitly in `_app.tsx` as instructed. Remove the auto-call; explicit registration is sufficient.

### Sprint 2 — Reliability and silent failure modes

- [x] **Add React error boundaries to `DynamicPage`** — A single component throwing (invalid YAML prop, missing theme, bad icon) crashes the entire page with no fallback UI. Wrap the content render tree in an error boundary that shows a degraded state instead.
- [x] **Fix `styled()` call inside `DynamicPage` render body** — `DynamicPage.tsx:58` creates `ShimmerOverlay` via `styled(Box)(...)` inside the component function. This generates a new CSS class on every render and breaks memoization. Move it to module scope.
- [x] **Fix image filename collisions in prebuild** — `packages/build-scripts/src/prebuild.ts:119` uses only `path.basename(str)` as the destination filename when copying co-located images. Two pages with identically-named images (e.g. both having `hero.png`) will silently overwrite each other in `public/images/`. Include the slug in the destination path.

### Sprint 3 — Error handling and type safety

- [x] **Narrow `useSafeTheme` error catch** — `packages/core/src/hooks/useSafeTheme.ts` catches all errors from `useTheme()` and silently falls back to the hardcoded corporate theme. A real bug in theme resolution becomes invisible. Catch only the specific "must be used within ThemeProvider" error; re-throw others.
- [x] **Unify icon registry with `stackwrightRegistry`** — `IconGrid.tsx` and `Media.tsx` access icons via `(globalThis as any).__stackwright_icon_registry__`, bypassing the type-safe `stackwrightRegistry` singleton that already exists. This is a parallel informal registry with no type safety. Unify into the main registry or expose a typed accessor.
- [x] **Wire theme switching or remove documentation for it** — `ThemeProvider.tsx` exposes a `setTheme?` slot in its context type but the `ThemeProvider` component never provides it. AGENTS.md documents "dynamic theme switching via `ThemesProvider`" as a feature. Either wire up state management to make it work, or remove the misleading documentation.
- [x] **Fix `uuidv4()` as React reconciliation key** — `packages/core/src/utils/contentRenderer.tsx:148` calls `uuidv4()` as a fallback key when none is provided. A new UUID on every render means React treats every element as a new mount, destroying state and preventing reconciliation. Use a stable fallback (index, label, or slug).
- [x] **Remove dead `validateComponent` debug function** — `contentRenderer.tsx:15–35` defines `validateComponent()` which does nothing except log debug output. It is called before the `!Component` null guard (line 168), so the null check ordering is wrong. Remove the function and reorder the guard.
- [x] **Expand test coverage beyond `packages/core`** — CLI commands, the prebuild pipeline, theme loader, and the nextjs adapter have zero or near-zero test coverage. Add tests for at minimum: `addPage`, `validatePages`, `runPrebuild` (image collision, missing images), and `useSafeTheme` (missing provider, real errors).

### Sprint 4 — Dependency security and CI hardening

Driven by open Dependabot and CodeQL alerts in the GitHub repo. These do not require application logic changes; they are version bumps and CI config fixes. Do them together so the repo goes from "many open alerts" to "clean" in one sweep.

- [ ] **Upgrade `next` to latest patch release** — Multiple critical/high Dependabot alerts open against the `next` package in `examples/hellostackwrightnext`: RCE in React flight protocol (critical, #29), authorization bypass in middleware (critical, #23), DoS with Server Components (#30, #33), Server Actions source code exposure (#31), and several medium-severity cache/image/SSRF issues (#22–#28). The fix for all of them is upgrading to the current Next.js patch release. Run `pnpm --filter hellostackwrightnext up next --latest` and verify the example app builds and runs cleanly.
- [ ] **Upgrade `rollup` to ≥4.22.4** — Dependabot alert #41: arbitrary file write via path traversal (high severity). Rollup is a transitive dependency of Vite/tsup across the build toolchain. Run `pnpm up rollup --recursive` and re-run `pnpm build` to confirm nothing breaks.
- [ ] **Upgrade `minimatch` to ≥9.0.5** — Dependabot alerts #39 and #40: ReDoS via repeated wildcards (high severity, two instances). Likely transitive via glob/minimatch usage in CLI or build tools. Run `pnpm up minimatch --recursive`.
- [ ] **Upgrade `glob` to ≥10.4.1** — Dependabot alert #10: command injection via `-c/--cmd` flag when `shell: true` (high severity). Direct or transitive dependency of CLI/build scripts. Run `pnpm up glob --recursive`.
- [ ] **Upgrade `js-yaml` to ≥4.x or pin ≥3.13.2** — Dependabot alert #9: prototype pollution in YAML merge keys (medium severity). This is a direct dependency of `@stackwright/core` (the YAML parsing layer). Verify that the upgrade does not change parse behavior for Stackwright YAML content.
- [ ] **Replace or upgrade `lodash`** — Dependabot alert #15: prototype pollution in `_.unset`/`_.omit` (medium severity). Audit which lodash functions are actually used; replace with native ES equivalents where possible, otherwise upgrade to lodash 4.17.21+.
- [ ] **Address `vite` and `ajv` transitive alerts** — Dependabot alerts #34–#36 (Vite `server.fs` bypass and HTML file serving issues, low/medium) and #38 (ajv ReDoS on `$data`, medium). These are build-tool transitive deps; upgrade Vite across the monorepo (`pnpm up vite --recursive`) and let ajv follow. Low urgency since these only affect the dev server, not the production output.
- [ ] **Fix CodeQL: add `permissions` blocks to GitHub Actions workflows** — CodeQL alerts #3–#7: four workflow files (`.github/workflows/ci.yml`, `release.yml`, `check-changeset.yml`, `check-main-release.yml`) have no `permissions:` block, giving workflows overly broad default permissions. Add a top-level `permissions: read-all` to each, then grant only what each job actually needs (e.g., `contents: write` for the release job, `pull-requests: write` for the changeset checker).
- [ ] **Fix CodeQL error: uncontrolled data in path expression** — CodeQL alert #6 (error severity): `examples/hellostackwrightnext/pages/[slug].tsx` uses the URL slug directly in a file path without sanitization. Sanitize the slug before it is used as a filesystem path (strip `..`, null bytes, and characters outside `[a-z0-9-_]`) or validate it against the known set of slugs returned by `getStaticPaths`.

---

## Near-term: Stabilization

- [x] **Content type: `code_block`** — A dedicated code block content type that renders with monospace font and background. Implemented in `packages/core/src/components/base/CodeBlock.tsx`.
- [x] **Real Privacy Policy and Terms of Service pages** — Currently both footer links point to GitHub as a placeholder.
- [x] **Regenerate JSON schemas** — Run `pnpm generate-schemas` after recent type changes (`components` made optional in `ThemeConfig`).
- [x] **Next.js 16 / Turbopack compatibility** — Prebuild pipeline (`@stackwright/build-scripts`) eliminates `fs` from `@stackwright/nextjs`; `createStackwrightNextConfig` adds `turbopack: {}` for Next.js 16+.
- [x] **Fix About page timeline** — Timeline items use `year`/`event` fields but the about page content was written with `date`/`title`/`description`. Audit and align.

---

## Near-term: Developer Experience

- [ ] **Fix and modernize the CLI `create` command** — The CLI (`@stackwright/cli`) is significantly out of date relative to the current project structure. Needs to scaffold from the current hellostackwrightnext template rather than the old structure.
- [ ] **Expose CLI as a local MCP tool** — Once the CLI is updated, wrap it as an MCP server so Claude Code (and any other MCP-compatible agent) can call tools like `stackwright_create_page`, `stackwright_scaffold_project`, and `stackwright_validate_yaml` directly without leaving the editor. This would make demo videos compelling and lower the barrier for agent-driven content generation.
- [ ] **`STACKWRIGHT_DEBUG` documentation in Getting Started** — Mention the `.env.local.example` flag so developers know how to enable verbose logging when debugging.

---

## Medium-term: Grammar Hardening (architectural priority)

These items are grouped because they share a common purpose: making the Stackwright grammar — the type system that defines what YAML can express — more rigorous, introspectable, and extensible. They are sequenced because each enables the next.

- [x] **Migrate `@stackwright/types` to Zod** — Replace `typescript-json-schema` + hand-written TypeScript interfaces with Zod schemas as the single source of truth. Infer TypeScript types via `z.infer<>`. Generate JSON schemas for IDE YAML validation via `zod-to-json-schema` (replaces the `generate-schemas` script). This is not a tooling upgrade — it is the step that makes the grammar introspectable at runtime. Zod schemas expose their shape via `.shape`; this is what enables the MCP server to describe valid fields to an agent without parsing JSON Schema `definitions`, and what enables runtime validation without a separate AJV pass. Note: JSON schema generation must be retained for IDE YAML validation (`.vscode/settings.json` references).

- [ ] **Runtime YAML validation against the grammar** — Once Zod is in place, add schema validation in the prebuild pipeline and (in development) at render time. Invalid content should fail loudly with a structured error message (which field, which type, which value was expected) rather than reaching the React render tree. This closes the gap between "the schema exists for IDE hints" and "the schema is enforced before execution" — the difference between documentation and a compiler.

- [ ] **First-class content type extensibility** — Expose a `registerContentType(key, zodSchema, component)` API so consumers can add content types without modifying framework source. This mirrors the existing `registerStackwrightComponents()` pattern but at the grammar level. A registered content type contributes its Zod schema to the full grammar, making it agent-writable, CLI-validatable, and MCP-describable automatically. This is the primary extensibility gap identified in the architecture: currently, adding a custom content type requires forking the framework. It should require only a registration call in `_app.tsx`.

## Medium-term: Framework

- [ ] **UI adapter abstraction** — Extract MUI-specific code from `@stackwright/core` into a `@stackwright/ui-mui` package, mirroring the existing `@stackwright/nextjs` adapter pattern. This unblocks `@stackwright/ui-shadcn` and other UI layer swaps without touching core.
- [x] **`tabbed_content` — verify and document** — Live demo added to the getting-started page with three tabs: icon_grid, timeline, and code_block.
- [ ] **Dark mode support** — Theme system supports color definitions; needs a `darkColors` block in `ThemeConfig` and a toggle mechanism in `ThemesProvider`.
- [ ] **Internationalization** — Multi-language content support via per-locale content directories or inline locale maps in YAML.

---

## Medium-term: Paid / Monetization Path

- [ ] **AI-powered project scaffolding** — Given a brief (text description or folder of assets), generate a complete Stackwright project: site config, page YAMLs, theme, and placeholder images. Builds on the fixed CLI.
- [ ] **WYSIWYG editor / publisher** — Visual editor that reads and writes Stackwright YAML. Likely a separate web app backed by the MCP server.
- [ ] **Data-interactive components** — Paid component library for charts, tables, forms, and live data bindings — content types that go beyond static layout.

---

## Infrastructure

- [ ] **MCP server for content types** — A dedicated MCP server that exposes: valid YAML keys and field schemas, component screenshots, and YAML validation. Higher leverage once the component library grows beyond ~10 types.
- [ ] **Automated schema sync check** — CI step that fails if `packages/types/src/types/` has changed but the JSON schemas haven't been regenerated.
- [ ] **Visual regression tests** — Screenshot-based tests for each content type component so UI changes don't silently break layouts.
- [ ] **End-to-end integration tests** — Playwright tests against the hellostackwrightnext example verifying that each content type renders correctly through the full prebuild → Next.js → browser pipeline. Prioritized over unit tests: the framework's value is in the complete YAML-to-page transform, not individual functions in isolation. Start with smoke tests (pages load, no console errors) before adding per-component assertions.
- [ ] **AI-driven visual QA (stretch goal)** — Use a vision-capable model (via MCP or CI hook) to screenshot rendered pages and flag visual regressions or layout breaks in natural language. Most useful once the component library stabilizes past ~10 content types and after the MCP server item is in place. Experimental — treat as a demo/spike rather than production CI infrastructure.
