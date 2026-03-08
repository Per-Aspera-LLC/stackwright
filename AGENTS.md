## Stackwright Framework - AI Guide for Agents

Welcome to Stackwright! This is a YAML-driven React application framework that enables rapid development of professional websites and applications through a "content as code" approach. In this guide, you'll find essential knowledge required to be productive in the Stackwright project. For contributor guidelines (branching, commits, testing, changesets), see [CONTRIBUTING.md](./CONTRIBUTING.md).

### Key Concepts
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
| `tabbed_content` | `label` (string), `heading` (TextBlock), `tabs` (object[]) | `color` (string), `background` (string) |
| `media` | `label` (string), `src` (string), `type` ("media") | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`) |
| `timeline` | `label` (string), `items` (TimelineItem[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `icon_grid` | `label` (string), `icons` (IconContent[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `code_block` | `label` (string), `code` (string) | `color` (string), `background` (string), `language` (string), `lineNumbers` (boolean) |
| `feature_list` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `testimonial_grid` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `faq` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `pricing_table` | `label` (string), `plans` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `alert` | `label` (string), `variant` (`info` | `warning` | `success` | `danger` | `note` | `tip`), `body` (string) | `color` (string), `background` (string), `title` (string) |
| `contact_form_stub` | `label` (string), `email` (string) | `color` (string), `background` (string), `heading` (TextBlock), `description` (string), `email_subject` (string), `phone` (string), `address` (string), `button_text` (string) |

**Sub-type reference:**

| Type | Fields |
|---|---|
| `TextBlock` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string) |
| `ButtonContent` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string), `variant` (`text` | `outlined` | `contained`), `variantSize`? (`small` | `medium` | `large`), `href`? (string), `action`? (string), `icon`? (MediaItem), `alignment`? (`left` | `center` | `right`), `bgColor`? (string) |
| `MediaItem` | Discriminated union: `type: "media"` \| `type: "icon"` \| `type: "image"`. `type` field is required and acts as discriminator. |
| `ImageContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("image"), `aspect_ratio`? (number) |
| `IconContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("icon"), `size`? (number | TypographyVariant) |
| `CarouselItem` | `title` (string), `text` (string), `media` (MediaItem), `background`? (string) |
| `TimelineItem` | `year` (string), `event` (string) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
<!-- stackwright:content-type-table:end -->

### Integration Points and Cross-Component Communication
- **Service Boundaries**: No obvious service boundaries, all code resides within the project's monorepo
- **Data Flows**: Data primarily flows from configuration files to React components via the core framework
- **External Dependencies**
  - Material-UI: Provides pre-built UI components and styles
  - Emotion: Allows for dynamic styling of components
- **Cross-Component Communication**
  - Themes can be changed dynamically: `ThemeProvider` exposes `setTheme` via context (call `useTheme().setTheme(newTheme)` from any child component)
  - Custom events (e.g., `onChange`) can be registered by child components to interact with parents

### Troubleshooting

See [CONTRIBUTING.md](./CONTRIBUTING.md#troubleshooting) for common issues and debugging tips.

### References
- **Framework Documentation**
  - [React Documentation](https://react.dev/)
  - [Material-UI Documentation](https://mui.com/)
  - [Next.js Documentation](https://nextjs.org/docs)
- **Development Tools**
  - [PNPM Documentation](https://pnpm.io/)
  - [Changesets Documentation](https://github.com/changesets/changesets)
  - [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- **Monorepo Management**
  - [PNPM Workspaces](https://pnpm.io/workspaces)
  - [Turborepo Guide](https://turbo.build/repo/docs) (potential future enhancement)