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
```bash
git clone https://github.com/Per-Aspera-LLC/stackwright.git
cd stackwright
pnpm install
pnpm build
pnpm dev:hellostackwright
```

> **Tip:** Stackwright uses Turborepo for incremental builds. Use `pnpm turbo:build` for faster builds with caching.

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
    - type: main
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
  typography:
    fontFamily:
      primary: "Inter"
      secondary: "system-ui"
    scale:
      xs: "0.75rem"
      sm: "0.875rem"
      base: "1rem"
      lg: "1.125rem"
      xl: "1.25rem"
      2xl: "1.5rem"
      3xl: "1.875rem"
```

Images can be co-located alongside their page YAML files using `./relative` paths (e.g., `src: ./hero.png`). The prebuild pipeline copies them to `public/images/` and rewrites paths automatically.

### Font Auto-Loading

Fonts defined in your theme are automatically loaded from Google Fonts — no manual `<link>` tags needed.

```yaml
customTheme:
  typography:
    fontFamily:
      primary: "JetBrains Mono"
      secondary: "Inter"
```

The prebuild step reads these values and generates the appropriate `<link>` tags in your `<head>`. Common system fonts (serif, sans-serif, monospace) are automatically excluded from loading. `StackwrightDocument` handles the injection — just define fonts in your theme YAML.

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
| `text_block` | Text content with heading, paragraphs, and buttons |
| `map` | MapLibre GL interactive map with markers and layers |


> **Note:** All content items use an explicit `type` field for discrimination (e.g., `type: main`). This replaced the older nested-key pattern (`main: {...}`) for clearer TypeScript discriminated unions and better validation error messages.

## Dark Mode

Stackwright has first-class dark mode support with zero flash on page load:

- Define `darkColors` in your theme alongside `colors` for automatic dark/light switching
- `ThemeProvider` exposes `setColorMode('dark' | 'light' | 'system')` via context
- User preference is persisted in a cookie — return visitors see their saved theme
- `StackwrightDocument` includes a blocking `<ColorModeScript>` that prevents flash-of-wrong-theme

```yaml
customTheme:
  colors:
    primary: "#fdc13c"
    # ... light mode
  darkColors:
    primary: "#fbbf24"
    # ... dark mode
```

## Cookie & Consent Utilities

`@stackwright/core` provides SSR-safe cookie utilities:

- `getCookie(name)`, `setCookie(name, value, options)`, `removeCookie(name)` — no dependencies
- `getConsentState()`, `setConsentState()`, `hasConsent(category)` — IAB TCF-style consent management (categories: necessary, functional, analytics, marketing)

These are useful for analytics integrations, GDPR compliance banners, and user preference storage.


## The Otter Raft 🦦

Stackwright includes **The Otter Raft** — a group of specialized AI agents that work together to build complete sites through conversation:

- 🦦🏗️ **Foreman Otter** — Coordinates the entire build pipeline
- 🦦🎨 **Brand Otter** — Discovers your brand through conversation
- 🦦🌈 **Theme Otter** — Designs your visual theme (colors, fonts, spacing)
- 🦦📄 **Page Otter** — Builds content pages in your brand voice

When you use `launch-stackwright`, the raft is automatically configured and ready to use with Code Puppy.

See [packages/otters/README.md](./packages/otters/README.md) for full documentation.

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

# Manage collections
stackwright collection list
stackwright collection add

# Manage site configuration
stackwright site get
stackwright site validate
stackwright site write

# View the product board (priority-tiered from GitHub Issues)
stackwright board

# Compose an entire site atomically
stackwright compose

# Git workflow (for AI agent integration)
stackwright git stage
stackwright git open-pr
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
@stackwright/ui-shadcn     — Radix + Tailwind headless UI primitives (Tabs, Accordion)
@stackwright/collections   — Data collection providers (file-based, extensible)
@stackwright/maplibre      — MapLibre GL interactive map component
launch-stackwright         — One-command project launcher with otter raft included 🦦
```

## IDE Support

`@stackwright/types` generates JSON schemas (`content-schema.json`, `theme-schema.json`, `siteconfig-schema.json`) that provide autocomplete and validation in YAML editors. Regenerate after type changes with `pnpm generate-schemas`.

## Built-in Search

Every Stackwright site comes with fuzzy full-text search out of the box. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux) to open the search modal.

- **Fuzzy matching** — Tolerates typos and partial matches via Fuse.js
- **Schema-aware** — Indexes page titles, headings, and body content
- **Keyboard-first** — Navigate results with arrow keys, select with Enter, dismiss with Escape
- **Instant results** — Debounced 300ms for fast filtering

The search index is generated at build time during prebuild — no external services required.

### Adding Search to Your Site

The SearchModal is automatically included in the page layout. To customize the keyboard shortcut or trigger:

```tsx
// In your _app.tsx or layout
import { SearchModal } from '@stackwright/core';

<>
  <YourApp />
  <SearchModal shortcut="Cmd+K" placeholder="Search..." />
</>
```

## Safe by Construction

Stackwright's security model is called **Safe by Construction**.

The mechanism is **The Bounded Contract**: a strict Zod schema defines exactly what is expressible. Every generated application **inherits** those guarantees — we call this **Verified Inheritance**. The schema is the parent class; every app is a derived type with the same safety properties.

The safety guarantees come from two interlocking layers:

### Layer 1: Build-time Enforcement

Every YAML content file passes through Zod schema validation at build time via `stackwright-prebuild`. The validator runs before Next.js even starts — invalid content fails the build, not the browser.

```ts
// What validation catches:
siteConfigSchema.safeParse(rawConfig);   // stackwright.yml
pageContentSchema.safeParse(rawContent);  // content.yml files
```

The schemas are strict: required fields are required, types are enforced, and unknown `type` values are caught with a warning (prevents silent failures from typos like `feture_list`).

### Layer 2: Typed Generated Output

The validated YAML is compiled into typed JSON that powers React components with full TypeScript discriminated unions:

```ts
// ContentItem is a discriminated union on `type`
type ContentItem =
  | CarouselContent | MainContent | TabbedContent | GridContent
  | FeatureListContent | FaqContent | AlertContent | ...;

// Components narrow on type — exhaustive matching guaranteed
function renderContent(item: ContentItem) {
  switch (item.type) {
    case 'alert': return <Alert {...item} />;        // item.alert fields typed
    case 'faq':   return <Faq {...item} />;         // item.faq fields typed
    // TypeScript errors if a case is missing — no silent fallthrough
  }
}
```

For `@stackwright-pro/openapi`:

| Protection | What It Prevents |
|------------|-----------------|
| **Endpoint Locking** | Generated client only has methods for spec-defined endpoints (e.g., `getEquipment()`, not `fetch(url)`) |
| **SHA-256 Allowlist** | Only pre-approved specs can generate code |
| **SSRF Download Protection** | Spec downloads blocked to private IPs, localhost, cloud metadata |
| **Runtime SSRF Blocking** | Generated client validates baseUrl at instantiation |
| **Zod Runtime Validation** | API responses validated before reaching UI |

### What This Protects Against

| Threat | Protection |
|--------|------------|
| Content injection | YAML is parsed as data, not code |
| XSS via content | Text is never interpolated as HTML |
| SSRF attacks | Generated clients only call spec-defined endpoints |
| Malformed API data | Zod validates responses at runtime |
| Schema drift | Generated TypeScript types stay in sync with Zod schemas |

### What This Doesn't Cover

Stackwright constrains the YAML layer and generated clients. Custom React components (written outside the YAML layer) are standard Next.js — they're your code, and security responsibility is yours. The framework makes it easy to stay inside the safe path; it doesn't prevent you from stepping outside it.

**Bottom line**: You audit the Zod schemas once. Every app built on the platform inherits those guarantees. This is "verifiable safe" — not "we scanned it and it looks okay."

> **Why this matters for government and enterprise**: You audit the schema once. Every application built on Stackwright inherits those guarantees. This isn't "we scanned it afterward" — it's mathematical proof that invalid inputs cannot reach the runtime.

### Plugin Security

For information about securing plugins and extensions, see [docs/PLUGIN_SECURITY.md](./docs/PLUGIN_SECURITY.md).

## Examples

See `examples/hellostackwrightnext/` for a complete working site demonstrating all content types, the theme system, co-located images, and the full prebuild pipeline.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, branching workflow, testing, and development conventions. For architectural rationale, see [PHILOSOPHY.md](./PHILOSOPHY.md).

## License

MIT
