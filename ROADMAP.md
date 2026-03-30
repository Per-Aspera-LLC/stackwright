# Stackwright Roadmap

This document describes the *direction* of the project — the architectural rationale, the product trajectory, and the vision that shapes prioritization. It is narrative, not a checklist.

**For the live, prioritized list of what's being worked on:**
```bash
# Terminal (humans)
pnpm stackwright -- board

# MCP tool (agents)
stackwright_get_board
```

These query open GitHub Issues sorted by [priority labels](#priority-labels). Issues are the single source of truth for planned work.

---

## Grammar Hardening

The type system that defines what YAML can express — the Stackwright grammar — is the product's core moat. The grammar must be rigorous, introspectable, and extensible.

**Completed foundation:** Zod schemas are the single source of truth for the grammar. TypeScript types are inferred via `z.infer<>`. JSON schemas are generated for IDE YAML validation. Runtime validation runs in the prebuild pipeline. Content types are extensible via `registerContentType()`. MCP tools introspect the schema at runtime.

**Next architectural step: explicit `type` field (#131).** The content renderer currently uses `Object.entries(item)[0]` to discriminate content types — a pattern that relies on JS object insertion order, prevents TypeScript discriminated unions, and produces poor error messages. Migrating to an explicit `type` field on every content item is a breaking change that enables proper discriminated union narrowing and clearer validation errors. This is sequenced after the grammar foundation is solid because it touches every YAML file, test, and content type.

---

## Visual Rendering & AI Design Loop

**Shipped.** The visual rendering infrastructure is now in place — AI agents and the CLI can screenshot pages, preview raw YAML, and capture before/after diffs.

**What's live:**
- MCP tools: `stackwright_render_page`, `stackwright_render_diff`, `stackwright_render_yaml`, `stackwright_check_dev_server`
- CLI: `stackwright preview` command
- E2E tests: full render pipeline verified against the example app

**Next step: branding expert agent.** The visual rendering tools are foundational infrastructure for an AI agent that can:
1. Chat with a user about their company, values, and aesthetic preferences
2. Generate theme and content variations
3. Render each variation and evaluate it visually
4. Iterate toward a design that captures the right brand "feel"
5. Ship the result via `stackwright_open_pr`

This agent is the proof point for the platform's thesis: that non-technical people can build professional, brand-appropriate applications through conversation — with the constrained DSL guaranteeing safety and the visual feedback loop guaranteeing quality.

---

## Framework Direction

Stackwright ships 18 content types (carousel, main, tabbed_content, media, video, timeline, icon_grid, code_block, feature_list, testimonial_grid, faq, pricing_table, alert, contact_form_stub, grid, collection_list, text_block, map). Dark mode, SEO metadata, cookie persistence, and responsive design are first-class.

**Next framework priorities** are tracked as GitHub Issues. Themes from PHILOSOPHY.md that shape prioritization:

- **Constrain first, extend later.** New content types should represent genuinely distinct layout patterns, not one-off customizations. The bar for adding to `@stackwright/core` is deliberately high.
- **The escape hatch is a feature.** Every architectural decision must preserve the ability for a React developer to open the project and extend it without knowing Stackwright exists.
- **AI writes the YAML; the framework enforces correctness.** Schema reliability matters more than schema expressiveness.

---

## Monetization Path

See `.claude/stackwright-pro-vision.md` for the full product vision. Summary of the trajectory:

**Near-term: CMS collection providers.** Third-party CMS SDKs (Contentful, Sanity, Shopify, Airtable, Notion) break frequently. Maintaining these integrations as `@stackwright-pro/collections-*` packages is a real, ongoing service — not a one-time implementation. Each implements the `CollectionProvider` interface; switching backends is a one-line change.

**Medium-term: OpenAPI integration.** `@stackwright-pro/openapi` takes an OpenAPI spec and emits a typed `CollectionProvider`, Zod schemas, TypeScript types, and a client module. Turns "here is an API spec" into "here is a working, validated UI" in hours.

**Long-term: safe enterprise application platform.** YAML-defined backend components — data tables, forms, approval flows, API integrations — all constrained by Zod schemas, all verifiably safe by construction. Subject matter experts define workflows; the platform enforces safety. The same compositional approach — declarative, schema-constrained, AI-writable, visually verifiable — extended from marketing sites to enterprise applications. The one-sentence pitch: visual rendering + constrained DSL + AI iteration = non-technical people building enterprise apps that are safe by construction.

**Adjacent opportunities:** AI-powered project scaffolding, visual editor backed by the MCP server, data-interactive component library (charts, tables, forms).

---

## Infrastructure Direction

The MCP server is the primary non-developer interface (see PHILOSOPHY.md: "The GUI Is AI"). It currently provides 20 tools spanning content authoring, site configuration, visual rendering, git workflow, and project management.

**Recent milestones:**
- Visual rendering tools shipped — AI agents can now see their output
- `stackwright preview` CLI command — screenshot pages from the terminal
- E2E render pipeline tests — visual tooling verified end-to-end
- Whole-site composition (`stackwright_compose_site`) with cross-page validation

**Next infra priorities:** Branding expert agent, E2E screenshot comparison on merge (#141), AI-driven visual QA. All build on the visual rendering infrastructure now in place.

---

## Priority Labels

Issues use four priority labels. The architect sets tiers; agents and contributors respect them.

| Label | Meaning |
|-------|---------|
| `priority:now` 🔴 | Actively in progress or next up |
| `priority:next` 🟡 | Committed — starting soon |
| `priority:later` 🟢 | Planned but not yet committed |
| `priority:vision` 🟣 | Aspirational — shapes direction, no timeline |

Run `pnpm stackwright -- board` to see the current board, or call `stackwright_get_board` via MCP.
