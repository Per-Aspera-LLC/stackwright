# Stackwright Roadmap

This file tracks planned work across the project. Items are roughly ordered by priority within each section. Move items to a changeset when work begins.

---

## Near-term: Stabilization

- [x] **Content type: `code_block`** — A dedicated code block content type that renders with monospace font and background. Implemented in `packages/core/src/components/base/CodeBlock.tsx`.
- [ ] **Real Privacy Policy and Terms of Service pages** — Currently both footer links point to GitHub as a placeholder.
- [x] **Regenerate JSON schemas** — Run `pnpm generate-schemas` after recent type changes (`components` made optional in `ThemeConfig`).
- [x] **Next.js 16 / Turbopack compatibility** — Prebuild pipeline (`@stackwright/build-scripts`) eliminates `fs` from `@stackwright/nextjs`; `createStackwrightNextConfig` adds `turbopack: {}` for Next.js 16+.
- [ ] **Fix About page timeline** — Timeline items use `year`/`event` fields but the about page content was written with `date`/`title`/`description`. Audit and align.

---

## Near-term: Developer Experience

- [ ] **Fix and modernize the CLI `create` command** — The CLI (`@stackwright/cli`) is significantly out of date relative to the current project structure. Needs to scaffold from the current hellostackwrightnext template rather than the old structure.
- [ ] **Expose CLI as a local MCP tool** — Once the CLI is updated, wrap it as an MCP server so Claude Code (and any other MCP-compatible agent) can call tools like `stackwright_create_page`, `stackwright_scaffold_project`, and `stackwright_validate_yaml` directly without leaving the editor. This would make demo videos compelling and lower the barrier for agent-driven content generation.
- [ ] **`STACKWRIGHT_DEBUG` documentation in Getting Started** — Mention the `.env.local.example` flag so developers know how to enable verbose logging when debugging.

---

## Medium-term: Framework

- [ ] **UI adapter abstraction** — Extract MUI-specific code from `@stackwright/core` into a `@stackwright/ui-mui` package, mirroring the existing `@stackwright/nextjs` adapter pattern. This unblocks `@stackwright/ui-shadcn` and other UI layer swaps without touching core.
- [ ] **`tabbed_content` — verify and document** — The type exists and is registered but has no example usage in the hellostackwrightnext site. Needs a real usage example and visual confirmation it renders correctly.
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
