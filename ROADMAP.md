# Stackwright Roadmap

This file tracks planned work across the project. Items are roughly ordered by priority within each section. Move items to a changeset when work begins.

---

## Near-term: Developer Experience

- [ ] **Fix and modernize the CLI `create` command** — The CLI (`@stackwright/cli`) is significantly out of date relative to the current project structure. Needs to scaffold from the current hellostackwrightnext template rather than the old structure.
- [x] **Expose CLI as a local MCP tool** — `@stackwright/mcp` package ships a stdio-based MCP server (`pnpm stackwright-mcp`) with 8 tools: `stackwright_get_content_types`, `stackwright_list_pages`, `stackwright_add_page`, `stackwright_validate_pages`, `stackwright_validate_site`, `stackwright_list_themes`, `stackwright_get_project_info`, and `stackwright_scaffold_project`. Claude Code and any MCP-compatible agent can call these directly without leaving the editor.
- [ ] **`STACKWRIGHT_DEBUG` documentation in Getting Started** — Mention the `.env.local.example` flag so developers know how to enable verbose logging when debugging.

---

## Medium-term: Grammar Hardening (architectural priority)

These items are grouped because they share a common purpose: making the Stackwright grammar — the type system that defines what YAML can express — more rigorous, introspectable, and extensible. They are sequenced because each enables the next.

- [x] **Migrate `@stackwright/types` to Zod** — Replace `typescript-json-schema` + hand-written TypeScript interfaces with Zod schemas as the single source of truth. Infer TypeScript types via `z.infer<>`. Generate JSON schemas for IDE YAML validation via `zod-to-json-schema` (replaces the `generate-schemas` script). This is not a tooling upgrade — it is the step that makes the grammar introspectable at runtime. Zod schemas expose their shape via `.shape`; this is what enables the MCP server to describe valid fields to an agent without parsing JSON Schema `definitions`, and what enables runtime validation without a separate AJV pass. Note: JSON schema generation must be retained for IDE YAML validation (`.vscode/settings.json` references).

- [x] **Runtime YAML validation against the grammar** — Zod validation added to the prebuild pipeline (`@stackwright/build-scripts`). Both site config (`stackwright.yml`) and each page `content.yml` are validated after `yaml.load()` before image processing; invalid content exits with a structured field-level error message. Test fixtures updated to satisfy the schema; three new validation test cases added.

- [x] **First-class content type extensibility** — `registerContentType(key, zodSchema, component)` added to `@stackwright/core`. A single call in `_app.tsx` registers both the React component (into `componentRegistry`) and the Zod schema (into `contentTypeRegistry`). Custom types render via the existing `contentRenderer` pipeline; in development, invalid props are caught and logged via `console.warn` before spreading. `getRegisteredContentTypes()` and `getContentTypeSchema()` are exported for MCP/CLI introspection. 8 new tests added.

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

- [x] **MCP server for content types** — `@stackwright/mcp` exposes valid YAML keys and field schemas (via Zod runtime introspection) and YAML validation for both pages and site config. 14 tests. **Component screenshots not yet implemented** — deferred until the component library grows beyond ~10 types; will require Playwright-based capture and MCP image resource support.
- [ ] **MCP component screenshots** — Add a `stackwright_get_component_screenshot` tool that returns rendered screenshots of each content type as MCP image resources. Depends on visual regression test infrastructure (Playwright). Revisit once component count exceeds ~10.
- [ ] **Automated schema sync check** — CI step that fails if `packages/types/src/types/` has changed but the JSON schemas haven't been regenerated.
- [ ] **Visual regression tests** — Screenshot-based tests for each content type component so UI changes don't silently break layouts.
- [ ] **End-to-end integration tests** — Playwright tests against the hellostackwrightnext example verifying that each content type renders correctly through the full prebuild → Next.js → browser pipeline. Prioritized over unit tests: the framework's value is in the complete YAML-to-page transform, not individual functions in isolation. Start with smoke tests (pages load, no console errors) before adding per-component assertions.
- [ ] **AI-driven visual QA (stretch goal)** — Use a vision-capable model (via MCP or CI hook) to screenshot rendered pages and flag visual regressions or layout breaks in natural language. Most useful once the component library stabilizes past ~10 content types and after the MCP server item is in place. Experimental — treat as a demo/spike rather than production CI infrastructure.
