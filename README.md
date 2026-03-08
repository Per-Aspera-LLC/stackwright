# Stackwright

<img width="256" height="256" alt="stackwright" src="https://github.com/user-attachments/assets/181b6fd5-0442-4345-a7d0-88f4858c5721" />

**Build real web applications from human-readable YAML — authored by humans or AI agents**

Stackwright is a typed DSL that compiles YAML content files into production-ready Next.js applications. Define pages, themes, and navigation in YAML; get a standard React app you own, can fork, and can extend with custom code at any time.

## Why Stackwright?

- **Start without a developer**: Non-technical teammates define pages, content, and themes in YAML — or describe what they want to an AI agent and let it write the YAML for them
- **AI-native authoring**: The narrow, validated YAML schema is designed for reliable AI generation. An MCP server gives AI agents tools to create pages, edit content, validate changes, and open PRs
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

All content types support optional `color` and `background` overrides, and render responsively from 320px to 1440px.

## MCP Server

Stackwright includes an MCP (Model Context Protocol) server that gives AI agents direct tools for content authoring:

```bash
# Run the MCP server (for use with Claude Code, Claude Desktop, etc.)
pnpm stackwright-mcp
```

Available tools include creating and editing pages, reading and writing site config, validating YAML against the schema, previewing components, managing git branches, and opening PRs. This enables a workflow where non-developers describe changes in natural language and the AI agent produces validated, reviewable content changes.

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
@stackwright/cli           — CLI for scaffolding, page management, validation
@stackwright/mcp           — MCP server for AI agent integration
```

## IDE Support

`@stackwright/types` generates JSON schemas (`content-schema.json`, `theme-schema.json`, `siteconfig-schema.json`) that provide autocomplete and validation in YAML editors. Regenerate after type changes with `pnpm generate-schemas`.

## Examples

See `examples/hellostackwrightnext/` for a complete working site demonstrating all content types, the theme system, co-located images, and the full prebuild pipeline.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, branching workflow, testing, and development conventions. For architectural rationale, see [PHILOSOPHY.md](./PHILOSOPHY.md).

## License

MIT
