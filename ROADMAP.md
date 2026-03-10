# Stackwright Roadmap

This file tracks planned work across the project. Items are roughly ordered by priority within each section. Move items to a changeset when work begins.

---

## Near-term: Developer Experience

- [x] **Fix and modernize the CLI `create` command** — Scaffold command updated (#77). Follow-up: template `_app.tsx` still missing shadcn UI registration (#127).
- [x] **Expose CLI as a local MCP tool** — `@stackwright/mcp` package ships a stdio-based MCP server (`pnpm stackwright-mcp`) with 15 tools. Content: `stackwright_get_content_types`, `stackwright_preview_component`, `stackwright_list_pages`, `stackwright_get_page`, `stackwright_write_page`, `stackwright_add_page`, `stackwright_validate_pages`. Site: `stackwright_get_site_config`, `stackwright_write_site_config`, `stackwright_validate_site`, `stackwright_list_themes`. Project: `stackwright_get_project_info`, `stackwright_scaffold_project`. Git: `stackwright_stage_changes`, `stackwright_open_pr`. Claude Code and any MCP-compatible agent can call these directly without leaving the editor.
- [x] **`STACKWRIGHT_DEBUG` documentation** — Debug logging pattern and `STACKWRIGHT_DEBUG` flag documented in CLAUDE.md and example app README (#116).

---

## Medium-term: Grammar Hardening (architectural priority)

These items are grouped because they share a common purpose: making the Stackwright grammar — the type system that defines what YAML can express — more rigorous, introspectable, and extensible. They are sequenced because each enables the next.

- [x] **Migrate `@stackwright/types` to Zod** — Replace `typescript-json-schema` + hand-written TypeScript interfaces with Zod schemas as the single source of truth. Infer TypeScript types via `z.infer<>`. Generate JSON schemas for IDE YAML validation via `zod-to-json-schema` (replaces the `generate-schemas` script). This is not a tooling upgrade — it is the step that makes the grammar introspectable at runtime. Zod schemas expose their shape via `.shape`; this is what enables the MCP server to describe valid fields to an agent without parsing JSON Schema `definitions`, and what enables runtime validation without a separate AJV pass. Note: JSON schema generation must be retained for IDE YAML validation (`.vscode/settings.json` references).

- [x] **Runtime YAML validation against the grammar** — Zod validation added to the prebuild pipeline (`@stackwright/build-scripts`). Both site config (`stackwright.yml`) and each page `content.yml` are validated after `yaml.load()` before image processing; invalid content exits with a structured field-level error message. Test fixtures updated to satisfy the schema; three new validation test cases added.

- [x] **First-class content type extensibility** — `registerContentType(key, zodSchema, component)` added to `@stackwright/core`. A single call in `_app.tsx` registers both the React component (into `componentRegistry`) and the Zod schema (into `contentTypeRegistry`). Custom types render via the existing `contentRenderer` pipeline; in development, invalid props are caught and logged via `console.warn` before spreading. `getRegisteredContentTypes()` and `getContentTypeSchema()` are exported for MCP/CLI introspection. 8 new tests added.

## Medium-term: Framework

- [x] **Replace MUI with shadcn/ui** — All 19 MUI-dependent components in `@stackwright/core` rewritten to plain HTML + inline styles. New `@stackwright/ui-shadcn` package provides Radix UI + Tailwind CSS components (Button, Tabs, Accordion, Badge, Separator) themed via CSS custom properties. `@stackwright/icons` migrated from `@mui/icons-material` to `lucide-react`. Zero MUI/Emotion dependencies remain (#97).
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

- [x] **MCP server for content types** — `@stackwright/mcp` exposes valid YAML keys and field schemas (via Zod runtime introspection), YAML validation for pages and site config, read/write page tools, git staging and PR creation, and component preview screenshots. 15 tools, 35 tests.
- [x] **MCP component screenshots** — `stackwright_preview_component` tool renders component screenshots via Playwright and returns them as MCP image resources (#109).
- [x] **Automated schema sync check** — CI `check-schemas` job regenerates JSON schemas and fails if they differ from the committed files (#96).
- [x] **Visual regression tests** — Screenshot-based tests added (#109). Note: CI currently uses `--update-snapshots` so regressions are local-only detection.
- [x] **End-to-end integration tests** — Playwright E2E tests added (#84) in `packages/e2e/`. Smoke tests verify pages load, no console errors, nav links resolve.
- [x] **MCP site config write tool** — `stackwright_write_site_config` MCP tool enables agents to programmatically update themes, navigation, and footer configuration (#124).
- [ ] **AI-driven visual QA (stretch goal)** — Use a vision-capable model (via MCP or CI hook) to screenshot rendered pages and flag visual regressions or layout breaks in natural language. Most useful once the component library stabilizes past ~10 content types and after the MCP server item is in place. Experimental — treat as a demo/spike rather than production CI infrastructure.

---

## Code Quality (from architectural review)

- [x] **Wire up theme spacing tokens** — All components now use `theme.spacing` tokens instead of hardcoded pixel values (#128).
- [x] **Remove production console.log calls** — Debug logging gated behind `STACKWRIGHT_DEBUG` flag; `aspect_ratio` prop destructured to prevent DOM leak (#129).
- [x] **Add unit tests for `packages/nextjs/`** — Full test coverage added for NextStackwrightImage, NextStackwrightLink, NextStackwrightRouter, NextStackwrightRoute, createStackwrightNextConfig, and registerNextJSComponents (#130).
- [ ] **Refactor content type discrimination** — `Object.entries(item)[0]` is fragile; consider explicit `type` field (breaking change) (#131).
- [x] **Fix Carousel cleanup and accessibility** — Auto-play interval properly cleared on unmount; keyboard navigation (arrow keys) and ARIA attributes added (#118, #132).
