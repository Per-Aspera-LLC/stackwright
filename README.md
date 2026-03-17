# Stackwright

<img width="256" height="256" alt="stackwright" src="https://github.com/user-attachments/assets/181b6fd5-0442-4345-a7d0-88f4858c5721" />

**Visual rendering + constrained DSL + AI iteration = non-technical people building enterprise apps that are safe by construction.**

Stackwright is a typed DSL that compiles YAML content files into production-ready Next.js applications. Pages, themes, navigation, and content are defined in a schema-constrained YAML grammar — authored by humans or AI agents. The output is a standard React app you own, can fork, and can extend with custom code at any time.

Because the YAML schema defines a bounded set of expressible behaviors, every application built on Stackwright is **verifiably safe by construction**. You don't audit individual apps — you audit the platform. Then every app built on it inherits those guarantees.

## Why Stackwright?

- **Safe by construction**: The constrained YAML grammar can only express pre-approved behaviors. AI-generated content passes through Zod schema validation at build time and runtime — invalid states are rejected before they reach the browser
- **AI-native authoring**: The narrow, validated schema is designed for reliable AI generation. An MCP server gives AI agents tools to create pages, edit content, validate changes, visually render results, and open PRs — all within a verifiable sandbox
- **Visual feedback loop**: AI agents can screenshot any page, preview raw YAML before committing, and capture before/after diffs — enabling iterative design that converges on brand-appropriate results
- **Start without a developer**: Non-technical teammates describe what they want to an AI agent. The agent writes valid YAML, renders it to verify the visual result, and opens a PR for review
- **Own everything**: The output is a standard Next.js app in a git repo you control. Git is the CMS — version history, branching, PR review, and rollback come free
- **No lock-in**: Any React developer can open the project and extend it immediately. The escape hatch is a feature, not a compromise
- **Graduate naturally**: Begin with YAML-driven pages, add custom React components alongside them as you grow — no migration, no rewrite

## Quick Start

```bash
# Scaffold a new project
npx stackwright scaffold my-site

cd my-site
pnpm install
pnpm dev
```

Or clone the example to see a full working site:

```bash
git clone https://github.com/Per-Aspera-LLC/stackwright.git
cd stackwright
pnpm install
pnpm build
pnpm dev:hellostackwright
```

## How It Works

Pages are YAML files in `pages/`. Each page is a directory containing `content.yml`:

```
pages/
  content.yml          → /  (root page)
  about/
    content.yml        → /about
  getting-started/
    content.yml        → /getting-started
    hero.png           → co-located image, auto-copied to public/
```

A minimal page:

```yaml
content:
  content_items:
    - main:
        label: "hero"
        heading:
          text: "Hello World"
          textSize: "h1"
        textBlocks:
          - text: "My first Stackwright page."
            textSize: "body1"
        buttons:
          - text: "Learn More"
            variant: "contained"
            href: "/about"
```

Site-wide config — navigation, footer, and theme — lives in `stackwright.yml`:

```yaml
title: "My Site"
navigation:
  - label: "Home"
    href: "/"
  - label: "About"
    href: "/about"
customTheme:
  colors:
    primary: "#fdc13c"
    secondary: "#1a9fd4"
    background: "#fdfdfd"
    text: "#393837"
```

Images can be co-located alongside their page YAML files using `./relative` paths (e.g., `src: ./hero.png`). The prebuild pipeline copies them to `public/images/` and rewrites paths automatically.

## Content Types

| YAML key | Description |
|---|---|
| `main` | Hero/section block: heading, text, image, buttons, configurable layout |
| `carousel` | Image/text slideshow with autoplay and keyboard navigation |
| `timeline` | Vertical timeline with year and event fields |
| `icon_grid` | Grid of icons with labels — feature lists, tech stacks |
| `feature_list` | Multi-column feature cards with icons and descriptions |
| `testimonial_grid` | Grid of testimonial cards with quotes and attribution |
| `tabbed_content` | Wraps other content types in a tabbed UI |
| `code_block` | Syntax-highlighted code with language label |
| `faq` | Expandable FAQ accordion |
| `pricing_table` | Pricing plan comparison cards |
| `alert` | Styled admonition/callout (info, warning, success, danger, note, tip) |
| `contact_form_stub` | Contact information display with mailto link |
| `media` | Standalone image or media block |
| `video` | Video player with multiple source support |
| `grid` | Responsive multi-column grid layout |
| `collection_list` | Dynamic list from a data collection |

All content types support optional `color` and `background` overrides, and render responsively from 320px to 1440px.

## MCP Server

Stackwright includes an MCP (Model Context Protocol) server that gives AI agents direct tools for content authoring, visual verification, and git workflow:

```bash
# Run the MCP server (for use with Claude Code, Claude Desktop, etc.)
pnpm stackwright-mcp
```

**Content & site tools**: Create and edit pages, read and write site config, validate YAML against the schema, manage collections, compose entire sites atomically.

**Visual rendering tools**: Screenshot any page, preview raw YAML without saving, capture before/after diffs for visual comparison. AI agents can see their own output and iterate toward brand-appropriate designs.

**Git workflow tools**: Stage content changes, open PRs for human review — the full editorial loop from natural language to reviewed, merged content.

This enables a workflow where non-developers describe changes in natural language and the AI agent produces validated, visually verified, reviewable content changes.

## CLI

```bash
# Create a new project
stackwright scaffold my-site

# Add a page
stackwright page add about --heading "About Us"

# List pages
stackwright page list

# Validate content against the schema
stackwright page validate

# Show available content types from the live schema
stackwright types

# Show installed package versions
stackwright info

# Preview a page as a screenshot (requires Playwright)
stackwright preview /about
stackwright preview /pricing --width 375 --height 667

# Hot-reload during development (watches YAML and images)
stackwright prebuild --watch
```

## Package Structure

```
@stackwright/core          — YAML→React compiler, component registry, layout system
@stackwright/nextjs        — Next.js adapter (Image, Link, Router, static gen helpers)
@stackwright/themes        — YAML-configurable theming with CSS custom properties
@stackwright/types         — Zod schemas, TypeScript types, and JSON schemas for validation
@stackwright/icons         — Lucide icon registry
@stackwright/build-scripts — Prebuild pipeline (image co-location, path rewriting, watch mode)
@stackwright/cli           — CLI for scaffolding, page management, validation, preview
@stackwright/mcp           — MCP server for AI agent integration and visual rendering
```

## IDE Support

`@stackwright/types` generates JSON schemas (`content-schema.json`, `theme-schema.json`, `siteconfig-schema.json`) that provide autocomplete and validation in YAML editors. Regenerate after type changes with `pnpm generate-schemas`.

## The Safety Model

Stackwright's constrained YAML grammar creates a fundamentally different security posture than traditional application development:

- **Bounded expressiveness**: The Zod schema defines exactly what behaviors are possible. There is no escape hatch to arbitrary code execution within the YAML layer.
- **Build-time validation**: Every content change is validated against the schema before it reaches the browser. Invalid states are rejected, not rendered.
- **Auditable surface area**: Security review reduces to reviewing the component library — a fixed, bounded codebase — rather than auditing every application built on the platform.
- **Safe AI generation**: When an AI agent generates YAML, it literally cannot express unsafe behavior. The schema is the security policy.

This model extends naturally to backend components: a `data_table` component that can only query through a connection whitelist, a `form` that can only POST to approved endpoints, an `approval_flow` that can only route to defined roles. **The schema constrains what's expressible; the platform enforces what's safe.**

## Examples

See `examples/hellostackwrightnext/` for a complete working site demonstrating all content types, the theme system, co-located images, and the full prebuild pipeline.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, branching workflow, testing, and development conventions. For architectural rationale, see [PHILOSOPHY.md](./PHILOSOPHY.md).

## License

MIT
