# Stackwright
<img width="256" height="256" alt="stackwright" src="https://github.com/user-attachments/assets/181b6fd5-0442-4345-a7d0-88f4858c5721" />

**A typed grammar for web applications. Write content in YAML — get a production Next.js app.**

Stackwright is a domain-specific language for building web applications. YAML files are the source. A typed schema defines what is valid. The framework compiles it to a standard Next.js application any developer can extend.

The output is never locked in. It is always a git repo, always standard React, always yours.

---

## Why This Approach

Most tools for non-developers either own your content (no-code platforms) or require a developer to operate (headless CMSes, static site generators). Stackwright takes a different position: give the content a typed grammar, make the grammar the verification surface, and let both humans and AI agents write against it.

**The grammar is what makes AI authoring reliable.** Asking an LLM to generate arbitrary React or write an app from a Google doc produces an unconstrained output that is hard to verify. Asking an agent to generate YAML against a typed schema produces output that is mechanically validatable before it ever renders. The verification problem shifts from "read all the code" to "does this YAML conform to the schema?" — a tractable problem for tooling, reviewers, and agents alike.

**The output is always escapable.** Every Stackwright site is a standard Next.js application. When you outgrow what the framework provides, a developer opens the repo and writes React components alongside the YAML-driven pages — no migration, no export, no rewrite. The escape hatch is a git commit.

---

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

---

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

Each content file is a program in the Stackwright grammar — a list of typed content blocks that the framework compiles to React:

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

---

## Content Types

These are the terminals of the Stackwright grammar — the valid constructs a content file can contain:

| YAML key | Description |
|---|---|
| `main` | Hero/section block: heading, text, image, buttons |
| `timeline` | Vertical timeline with year and event fields |
| `carousel` | Image/text slideshow with autoplay support |
| `icon_grid` | Grid of icons with labels — feature lists, tech stacks |
| `tabbed_content` | Wraps other content types in a tabbed UI |
| `code_block` | Formatted code with language label |

The schema for each type is defined in `@stackwright/types` and published as JSON Schema for IDE validation. An agent given the schema can generate valid content with high reliability.

---

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

---

## Package Structure

```
@stackwright/core         — YAML→React compiler, component registry, layout system
@stackwright/nextjs       — Next.js adapter (Image, Link, Router, static gen helpers)
@stackwright/themes       — YAML-configurable MUI theming
@stackwright/types        — Grammar definition: TypeScript types + JSON schemas
@stackwright/icons        — MUI icon registry
@stackwright/build-scripts — Prebuild pipeline (image co-location, path rewriting)
@stackwright/cli          — CLI for scaffolding, page management, validation
```

---

## For AI Agents

Stackwright is designed to be authored by AI agents. See `AGENTS.md` for the content type reference — field names, required vs. optional, valid enum values — in a format optimized for agent consumption. The JSON schemas in `@stackwright/types` are the machine-readable grammar specification; an agent with access to these can generate and validate content without hallucinating field names or structures.

The intended workflow: a non-technical user describes what they want in natural language. An agent writes valid YAML, validates it against the schema, and opens a PR. A developer (or the user via a simple review) merges it. The content deploys. No developer required for content authoring; no lock-in to a platform.

---

## Examples

See `examples/hellostackwrightnext/` for a complete working site demonstrating all content types, the theme system, co-located images, and the full prebuild pipeline.

---

## Contributing

Contributions are welcome. See [CLAUDE.md](./CLAUDE.md) for build commands, architecture overview, and development conventions. See [PHILOSOPHY.md](./PHILOSOPHY.md) for the design principles that should guide architectural decisions.

## License

MIT
