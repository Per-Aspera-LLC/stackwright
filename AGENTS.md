## Stackwright Framework - AI Guide for Agents

Welcome to Stackwright! This is a YAML-driven React application framework that enables rapid development of professional websites and applications through a "content as code" approach. In this guide, you'll find essential knowledge required to be productive in the Stackwright project. For contributor guidelines (branching, commits, testing, changesets), see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Quick Start for New Projects

The fastest way to get started with Stackwright is using **launch-stackwright**:

**Recommended: Full otter raft experience (auto-installs dependencies)**
```bash
npx launch-stackwright my-site --otter-raft
cd my-site
pnpm dev
```

**Alternative: Manual setup**
```bash
npx launch-stackwright my-site
cd my-site
pnpm install
pnpm dev
```

Both set up:
- ✅ A fully configured Next.js + Stackwright project
- ✅ The otter raft (AI agents) ready to build your site
- ✅ MCP server auto-configuration for Code Puppy

See the [Otter Raft documentation](./packages/otters/README.md) for how to use the AI agents to build complete sites through conversation.

- **Framework Architecture**: To understand the big picture, read:
  - `packages/core/src/index.ts`: Core framework initialization
  - `packages/nextjs/src/components/NextDocument.tsx`: Next.js integration
  - `packages/themes/src/ThemesProvider.tsx`: Theme provider for theme handling
- **Developer Workflows**
  - Build: Run `pnpm build` from the project root
  - Test: Run `pnpm test` from the project root (runs vitest across all packages)
- **Project Conventions**: Note these important patterns that differ from common practices
  - **File Organization**
    - All source code is in `packages` directory
    - Core framework components are in `src/components` of `@stackwright/core` package
    - Themes are defined in YAML files within the `themes` directory of the same package
  - **Naming Conventions**
    - Kebab-case for file names (e.g., `main-content-grid.tsx`)
    - PascalCase for components (e.g., `DynamicPage`)

### Component Registration

The `stackwrightRegistry` is a singleton that must be populated before rendering. In Next.js apps:
- Call `registerNextJSComponents()` from `@stackwright/nextjs` in `pages/_app.tsx` (Pages Router) or `app/layout.tsx` (App Router)
- Call `registerDefaultIcons()` from `@stackwright/icons` in the same location
- Do **not** rely on module import side effects for registration — it must be explicit

`createStackwrightNextConfig()` from `@stackwright/nextjs` should be used in `next.config.js` instead of manual webpack configuration.

### Build System Notes

- Each package uses **tsup** for dual-format output (ESM `.mjs` + CJS `.js`)
- Do **NOT** add `"type": "module"` to any `packages/*` package.json. tsup's `.mjs`/`.js` extension convention handles format signaling. Adding `"type": "module"` breaks `require()` calls in Next.js config files.

### Image Co-location Pipeline

Images can be placed alongside their page YAML files in `content/pages/`. Use `./relative` paths in YAML (e.g. `src: ./hero.png`). These are processed by the `stackwright-prebuild` script (from `@stackwright/build-scripts`) which runs before `next build` and `next dev`:
1. Image is copied to `public/images/` preserving directory structure
2. Path is rewritten to `/images/...` in the processed JSON
3. `getStaticProps` reads from the processed JSON — no `fs` work at render time

**Required:** Add these hooks to the Next.js app's `package.json`:
```json
"prebuild": "stackwright-prebuild",
"predev": "stackwright-prebuild"
```
Without these hooks, co-located images will not be found at runtime.

### Content Type Reference

**AGENTS: This table is auto-generated from the live Zod schemas. Run `pnpm stackwright -- generate-agent-docs` to regenerate. Do NOT edit the content between the markers manually.**

<!-- stackwright:content-type-table:start -->
The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.

| YAML key | Required fields | Optional fields |
|---|---|---|
| `carousel` | `label` (string), `heading` (string), `items` (CarouselItem[]) | `color` (string), `background` (string), `autoPlaySpeed` (number), `infinite` (boolean), `autoPlay` (boolean) |
| `main` | `label` (string), `heading` (TextBlock), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `media` (MediaItem), `graphic_position` (`left` | `right`), `buttons` (ButtonContent[]), `textToGraphic` (number) |
| `tabbed_content` | `label` (string), `heading` (TextBlock), `tabs` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) | `color` (string), `background` (string) |
| `media` | `label` (string), `src` (string) | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`) |
| `timeline` | `label` (string), `items` (TimelineItem[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `icon_grid` | `label` (string), `icons` (IconContent[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `code_block` | `label` (string), `code` (string) | `color` (string), `background` (string), `language` (string), `lineNumbers` (boolean) |
| `feature_list` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `testimonial_grid` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `faq` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `pricing_table` | `label` (string), `plans` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `alert` | `label` (string), `variant` (`info` | `warning` | `success` | `danger` | `note` | `tip`), `body` (string) | `color` (string), `background` (string), `title` (string) |
| `contact_form_stub` | `label` (string), `email` (string) | `color` (string), `background` (string), `heading` (TextBlock), `description` (string), `email_subject` (string), `phone` (string), `address` (string), `button_text` (string) |
| `text_block` | `label` (string), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `heading` (TextBlock), `buttons` (ButtonContent[]) |
| `grid` | `label` (string), `columns` (GridColumn[]) | `color` (string), `background` (string), `heading` (TextBlock), `gap` (string), `stackBelow` (number) |
| `collection_list` | `label` (string), `source` (string), `layout` (default), `card` (object) | `columns` (number), `limit` (number), `hrefPrefix` (string), `heading` (TextBlock), `background` (string), `color` (string) |
| `video` | `label` (string), `src` (string) | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`), `poster` (string), `autoplay` (boolean), `loop` (boolean), `muted` (boolean), `controls` (boolean), `preload` (`auto` | `metadata` | `none`), `sources` (object[]) |
| `map` | `label` (string), `center` (object), `zoom` (number) | `color` (string), `background` (string), `markers` (object[]), `layers` (object[]), `view` (`map` | `globe`), `terrain` (boolean), `height` (string | number), `width` (string | number) |

**Sub-type reference:**

| Type | Fields |
|---|---|
| `TextBlock` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string) |
| `ButtonContent` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string), `variant` (`text` | `outlined` | `contained`), `variantSize`? (`small` | `medium` | `large`), `href`? (string), `action`? (string), `icon`? (MediaItem), `alignment`? (`left` | `center` | `right`), `bgColor`? (string) |
| `MediaItem` | Discriminated union: `type: "media"` \| `type: "icon"` \| `type: "image"` \| `type: "video"`. `type` field is required and acts as discriminator. |
| `ImageContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("image"), `aspect_ratio`? (number) |
| `IconContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("icon"), `size`? (number | TypographyVariant) |
| `CarouselItem` | `title` (string), `text` (string), `media` (MediaItem), `background`? (string) |
| `TimelineItem` | `year` (string), `event` (string) |
| `GridColumn` | `width`? (number), `content_items` (object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object | object[]) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
<!-- stackwright:content-type-table:end -->

### Dark Mode & Color Preferences

Stackwright has first-class dark mode and cookie-based preference persistence:

- **`darkColors`** field in theme YAML — same shape as `colors`, used when dark mode is active.
- **`ThemeProvider`** manages `colorMode` (`'light'` | `'dark'` | `'system'`), exposes `setColorMode()` via context. Components read `theme.colors` and get the resolved palette automatically — zero changes needed in content components.
- **`ColorModeScript`** (from `@stackwright/themes`) — a blocking `<script>` placed in `<head>` that reads the `sw-color-mode` cookie before React hydrates, preventing flash-of-wrong-theme.
- **`StackwrightDocument`** (from `@stackwright/nextjs`) — a drop-in `_document.tsx` that includes `ColorModeScript` automatically.
- **Cookie utilities** (`@stackwright/core`): `getCookie`, `setCookie`, `removeCookie` — SSR-safe, zero dependencies.
- **Consent utilities** (`@stackwright/core`): `getConsentState`, `setConsentState`, `hasConsent` — IAB TCF categories (`necessary`, `functional`, `analytics`, `marketing`).

### Integration Points and Cross-Component Communication
- **Service Boundaries**: No obvious service boundaries — all code resides within the project's monorepo.
- **Data Flows**: Data primarily flows from YAML configuration files → prebuild pipeline → JSON → React components via the core framework.
- **External Dependencies**
  - **Lucide React**: Icon library (replaced MUI icons). Static imports registered via `registerDefaultIcons()`.
  - **Radix UI**: Headless primitives powering `@stackwright/ui-shadcn` (Tabs, Accordion).
  - **Tailwind CSS**: Used exclusively by `@stackwright/ui-shadcn`. Core components use inline `style={{}}` props — no Tailwind in `@stackwright/core`.
  - **js-yaml**: YAML parsing throughout the framework.
  - **Zod (v4)**: Runtime schema validation, JSON schema generation, and MCP tool introspection.
- **Cross-Component Communication**
  - Themes and color mode can be changed dynamically: `ThemeProvider` exposes `setTheme` and `setColorMode` via context.
  - Custom events (e.g., `onChange`) can be registered by child components to interact with parents.

### Troubleshooting

See [CONTRIBUTING.md](./CONTRIBUTING.md#troubleshooting) for common issues and debugging tips.

### References
- **Framework Documentation**
  - [React Documentation](https://react.dev/)
  - [Next.js Documentation](https://nextjs.org/docs)
  - [Lucide Icons](https://lucide.dev/)
  - [Radix UI Primitives](https://www.radix-ui.com/)
  - [Tailwind CSS](https://tailwindcss.com/) (used by `@stackwright/ui-shadcn` only)
- **Development Tools**
  - [PNPM Documentation](https://pnpm.io/)
  - [Changesets Documentation](https://github.com/changesets/changesets)
  - [TypeScript Documentation](https://www.typescriptlang.org/docs/)
  - [Zod Documentation](https://zod.dev/)
- **Monorepo Management**
  - [PNPM Workspaces](https://pnpm.io/workspaces)
### Page-Level Sidebar Override (`navSidebar`)

Pages can override the site-wide sidebar defined in `stackwright.yml` using the `navSidebar` field in their `content.yml`.

**Resolution order (highest wins):**
1. Page-level `navSidebar` in `content.yml` (explicit override)
2. Site-level `sidebar` in `stackwright.yml` (default from Theme Otter)
3. No sidebar

**Use cases:**
- Dashboard pages: `navSidebar: null` to maximize content width
- Documentation chapters: different sidebar with section-specific navigation
- Landing pages: inherit site sidebar from theme

**YAML examples:**

```yaml
# Hide sidebar on this page (full-width content)
content:
  navSidebar: null
  content_items:
    - type: main
      label: "dashboard"
      heading:
        text: "Live Dashboard"
        textSize: "h1"

# Override sidebar navigation for this page
content:
  navSidebar:
    navigation:
      - label: "Chapter 1"
        href: "/docs/chapter-1"
      - label: "Chapter 2"
        href: "/docs/chapter-2"
    collapsed: false
  content_items:
    - type: text_block
      label: "chapter-2-content"
      textBlocks:
        - text: "Chapter 2 content here..."
          textSize: "body1"
```

**Otter responsibilities:**
- **Theme Otter** sets the site-wide sidebar defaults in `stackwright.yml`
- **Page Otter** can add `navSidebar` overrides in any page's `content.yml`
- If Theme Otter chose a sidebar theme, Page Otter inherits it by default (no need to repeat)
