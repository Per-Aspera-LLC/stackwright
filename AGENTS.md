## Stackwright Framework - AI Guide for Agents

Welcome to Stackwright! This is a YAML-driven React application framework that enables rapid development of professional websites and applications through a "content as code" approach. In this guide, you'll find essential knowledge required to be productive in the Stackwright project.

### Key Concepts
- **Framework Architecture**: To understand the big picture, read:
  - `packages/core/src/index.ts`: Core framework initialization
  - `packages/nextjs/src/components/NextDocument.tsx`: Next.js integration
  - `packages/themes/src/ThemesProvider.tsx`: Theme provider for theme handling
- **Developer Workflows**
  - Build: Run `pnpm build` from the project root
  - Test (currently not implemented): See [Troubleshooting](#troubleshooting) section below
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

Images can be placed alongside their page YAML files in `content/pages/`. Use `./relative` paths in YAML — these are automatically processed at `getStaticProps` time by `processImagesInContent()` and `processImagesInConfig()` in `packages/nextjs/src/components/NextStackwrightStaticGeneration.ts`:
1. File is copied to `public/images/` preserving directory structure
2. Path is rewritten to `/images/...` for rendering

No prebuild step is needed.

### Content Type Reference

**AGENTS: This table is the source of truth for valid YAML content types. If you add, remove, or change fields in `packages/types/src/types/`, you MUST update this table and the matching table in `examples/hellostackwrightnext/AGENTS.md`.**

The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.

| YAML key | Required fields | Optional fields |
|---|---|---|
| `main` | `label`, `heading` (TextBlock), `textBlocks` (TextBlock[]) | `media` (MediaItem), `graphic_position` (`left`\|`right`), `buttons` (ButtonContent[]), `textToGraphic` (0-100, default 58), `background` |
| `carousel` | `label`, `heading` (string), `items` (CarouselItem[]) | `autoPlay` (bool), `autoPlaySpeed` (ms), `infinite` (bool), `background` |
| `timeline` | `label`, `items` (TimelineItem[]) | `heading` (TextBlock) |
| `icon_grid` | `label`, `icons` (IconContent[]) | `heading` (TextBlock) |
| `tabbed_content` | `label`, `heading` (TextBlock), `tabs` (ContentItem[]) | — |
| `media` | `label`, `src` (string) | `alt`, `height`, `width`, `style` (`contained`\|`overflow`) |
| `code_block` | `label`, `code` (string) | `language` (string), `lineNumbers` (bool, default false), `background` |

**Sub-type reference:**

| Type | Fields |
|---|---|
| `TextBlock` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string) |
| `ButtonContent` | `text`, `textSize`, `variant` (`text`\|`outlined`\|`contained`), `href`?, `bgColor`?, `textColor`?, `variantSize`? (`small`\|`medium`\|`large`), `icon`? (MediaItem), `alignment`? (`left`\|`center`\|`right`) |
| `MediaItem` | `src` (string), `alt`?, `height`?, `width`?, `aspect_ratio`? (number), `style`? (`contained`\|`overflow`) |
| `IconContent` | extends MediaItem + `size`? (number \| TypographyVariant), `color`? |
| `CarouselItem` | `title` (string), `text` (string), `media` (MediaItem), `background`? |
| `TimelineItem` | `year` (string), `event` (string) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`

### Integration Points and Cross-Component Communication
- **Service Boundaries**: No obvious service boundaries, all code resides within the project's monorepo
- **Data Flows**: Data primarily flows from configuration files to React components via the core framework
- **External Dependencies**
  - Material-UI: Provides pre-built UI components and styles
  - Emotion: Allows for dynamic styling of components
- **Cross-Component Communication**
  - Themes can be changed dynamically using the `ThemesProvider` component
  - Custom events (e.g., `onChange`) can be registered by child components to interact with parents

### Troubleshooting
- **Common Issues**
  - "Cannot find module" ESM Errors: Missing `.js` extensions in ESM imports. Also verify no `packages/*` package.json has `"type": "module"`.
  - `module is not defined in ES module scope`: A package has `"type": "module"` set. Remove it.
  - Components not rendering / blank page: `registerNextJSComponents()` was not called before first render.
  - Schema Generation Fails: TypeScript compilation errors in source files. Fix TypeScript errors before running `pnpm generate-schemas`.
  - Changeset Validation Fails: Modified packages without changeset. Run `pnpm changeset` and commit the generated file.
  - Build Fails After Dependencies Update: Version mismatches in monorepo. Run `pnpm install` from root to resolve dependencies.
- **Debugging Tips**
  - Check package versions: Use `pnpm list` to verify installations
  - Clear build cache: Delete `packages/*/dist` directories
  - Regenerate schemas: Run `pnpm generate-schemas` after changes

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