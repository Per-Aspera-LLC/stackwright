# Stackwright Roadmap

This file tracks planned work across the project. Items are roughly ordered by priority within each section. Move items to a changeset when work begins.

---

## Near-term: Developer Experience

- [ ] **Fix and modernize the CLI `create` command** — The CLI (`@stackwright/cli`) is significantly out of date relative to the current project structure. Needs to scaffold from the current hellostackwrightnext template rather than the old structure.
- [ ] **Expose CLI as a local MCP tool** — Once the CLI is updated, wrap it as an MCP server so Claude Code (and any other MCP-compatible agent) can call tools like `stackwright_create_page`, `stackwright_scaffold_project`, and `stackwright_validate_yaml` directly without leaving the editor. This would make demo videos compelling and lower the barrier for agent-driven content generation.
- [ ] **`STACKWRIGHT_DEBUG` documentation in Getting Started** — Mention the `.env.local.example` flag so developers know how to enable verbose logging when debugging.

---

## Medium-term: Grammar Hardening (architectural priority)

These items are grouped because they share a common purpose: making the Stackwright grammar — the type system that defines what YAML can express — more rigorous, introspectable, and extensible. They are sequenced because each enables the next.

- [x] **Migrate `@stackwright/types` to Zod** — Replace `typescript-json-schema` + hand-written TypeScript interfaces with Zod schemas as the single source of truth. Infer TypeScript types via `z.infer<>`. Generate JSON schemas for IDE YAML validation via `zod-to-json-schema` (replaces the `generate-schemas` script). This is not a tooling upgrade — it is the step that makes the grammar introspectable at runtime. Zod schemas expose their shape via `.shape`; this is what enables the MCP server to describe valid fields to an agent without parsing JSON Schema `definitions`, and what enables runtime validation without a separate AJV pass. Note: JSON schema generation must be retained for IDE YAML validation (`.vscode/settings.json` references).

- [x] **Runtime YAML validation against the grammar** — Zod validation added to the prebuild pipeline (`@stackwright/build-scripts`). Both site config (`stackwright.yml`) and each page `content.yml` are validated after `yaml.load()` before image processing; invalid content exits with a structured field-level error message. Test fixtures updated to satisfy the schema; three new validation test cases added.

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
