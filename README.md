# Stackwright
<img width="256" height="256" alt="stackwright" src="https://github.com/user-attachments/assets/181b6fd5-0442-4345-a7d0-88f4858c5721" />

**Build real web applications from human-readable YAML**

Stackwright bridges the gap between no-code builders and custom development. Write your site in simple YAML files, get a production-ready Next.js application that any developer can extend — no migration, no rewrite, no lock-in.

## Why Stackwright?

- **Start without a developer**: Non-technical teammates define pages, content, and themes in YAML
- **Own everything**: The output is a standard Next.js app in a git repo you control
- **No lock-in**: Any React developer can open the project and extend it immediately
- **Graduate naturally**: Begin with YAML-driven pages, add custom React components alongside them as you grow

Perfect for startups who need more than Squarespace but aren't ready to build from scratch, and for teams who want non-developers to contribute content without a CMS subscription.

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

## Content Types

| YAML key | Description |
|---|---|
| `main` | Hero/section block: heading, text, image, buttons |
| `timeline` | Vertical timeline with year and event fields |
| `carousel` | Image/text slideshow with autoplay support |
| `icon_grid` | Grid of icons with labels — feature lists, tech stacks |
| `tabbed_content` | Wraps other content types in a tabbed UI |
| `code_block` | Formatted code with language label |

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

# Show installed package versions
stackwright info
```

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

## Examples

See `examples/hellostackwrightnext/` for a complete working site demonstrating all content types, the theme system, co-located images, and the full prebuild pipeline.

## Contributing

Contributions are welcome. See [CLAUDE.md](./CLAUDE.md) for build commands, architecture overview, and development conventions.

## License

MIT
