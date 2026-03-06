# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Branching Workflow

- **`dev`** is the integration branch. Feature branches are created from `dev` and PRs target `dev`.
- **`main`** is the release branch. `dev` is merged to `main` only when cutting a release.
- When creating a new feature branch: `git checkout -b feat/issue-XX-description dev`

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages (excludes examples)
pnpm build

# Build everything including examples
pnpm build:all

# Build individual packages
pnpm build:core
pnpm build:types
pnpm build:themes
pnpm build:nextjs
pnpm build:cli
pnpm build:build-scripts
pnpm build:mcp

# Run the MCP server (stdio — for use with Claude Code or Claude for Desktop)
pnpm stackwright-mcp

# Run development mode (watch all packages)
pnpm dev

# Run the example application
pnpm dev:hellostackwright

# Run CLI commands (from monorepo root — note the --)
pnpm stackwright -- --help
pnpm stackwright -- types
pnpm stackwright -- info
# Project-aware commands must be run from inside a Stackwright project:
# cd examples/hellostackwrightnext && pnpm stackwright -- page list

# Run all unit tests
pnpm test

# Run core package tests only
pnpm test:core

# Run Playwright E2E tests (requires chromium system deps)
pnpm test:e2e

# Generate JSON schemas from Zod schemas
cd packages/types && pnpm generate-schemas

# Release management
pnpm changeset          # Create a changeset for changes
pnpm version-packages   # Update versions based on changesets
pnpm release            # Build and publish to NPM
```

## Architecture

Stackwright is a **pnpm monorepo** implementing a typed DSL for web applications. YAML is the syntax. `@stackwright/types` is the grammar. The framework compiles content files into production-ready Next.js/React applications. See `PHILOSOPHY.md` for the full architectural rationale.

### Package Dependency Graph

```
User's Next.js App
       ↓
@stackwright/nextjs     ← Next.js adapter (Image, Link, Router wrappers; static gen helpers)
       ↓
@stackwright/core       ← Compiler/runtime (YAML→React, component registry, layout system)
    ↓  ↓  ↓
@stackwright/types   @stackwright/themes   @stackwright/icons
(grammar: TS types +  (YAML-configurable    (MUI icon
 JSON schemas)         MUI theming)          registry)

@stackwright/cli        ← Standalone CLI (scaffolding, validation, content generation)
```

### Key Architectural Concepts

**Content Rendering Pipeline**: YAML files are loaded → parsed with `js-yaml` → validated against the grammar (TypeScript types/JSON schemas) → compiled to React components via `contentRenderer.tsx` → rendered with theme and context.

**Component Registry (two registries)**:
- `componentRegistry.ts` — built-in UI components, keyed by lowercase-hyphenated name
- `stackwrightRegistry` — framework-specific components that must be registered at runtime (Image, Link, Router, Route, StaticGeneration). The `@stackwright/nextjs` package provides Next.js implementations.

**Theme System**: Themes are YAML files with `id`, `name`, `colors`, `typography`, and `spacing`. Colors can be hex codes or named references to palette keys. The `useSafeTheme()` hook resolves colors at render time. `ThemesProvider` handles dynamic theme switching.

**Static Generation**: `@stackwright/nextjs` provides `getStaticPropsForSlug` and related helpers for Next.js `getStaticPaths`/`getStaticProps`. The `SlugPage` component in `@stackwright/core` drives slug-based routing.

**Grammar / JSON Schema Generation**: `@stackwright/types` is the single source of truth for the Stackwright grammar. Zod schemas are the source of truth; TypeScript types are inferred via `z.infer<>`. `zod-to-json-schema` generates `theme-schema.json`, `content-schema.json`, and `siteconfig-schema.json` — the machine-readable grammar specification used for IDE YAML validation. Must be regenerated after type changes (`pnpm generate-schemas`). Zod schemas are introspectable at runtime via `schema.def` (Zod v4) enabling MCP tools and future runtime validation.

### Key Files

- `packages/core/src/utils/contentRenderer.tsx` — core YAML-to-React transformation engine
- `packages/core/src/utils/componentRegistry.ts` — built-in component registration
- `packages/core/src/utils/stackwrightComponentRegistry.ts` — framework component registration
- `packages/core/src/components/DynamicPage.tsx` — main dynamic page component
- `packages/nextjs/src/components/` — Next.js-specific Image, Link, Router wrappers
- `packages/themes/src/ThemesProvider.tsx` — theme provider and switching
- `packages/types/src/generate-schemas.ts` — schema generation script

### Example Application

`examples/hellostackwrightnext/` is a Next.js app demonstrating the full stack:
- `content/pages/` — YAML page definitions (images can be co-located here using `./relative` paths)
- `content/site.yaml` — global site config (theme, navigation, app bar, footer)
- `pages/_app.tsx` — where `registerNextJSComponents()` and `registerDefaultIcons()` are called
- `next.config.js` — uses `createStackwrightNextConfig()` from `@stackwright/nextjs`

### Content Type Maintenance Rule

**When modifying `packages/types/src/types/` — adding, removing, or changing any content type, field, or enum — you MUST:**
1. Run `pnpm stackwright -- generate-agent-docs` to regenerate AGENTS.md tables in both `/AGENTS.md` and `examples/hellostackwrightnext/AGENTS.md`
2. Regenerate JSON schemas: `cd packages/types && pnpm generate-schemas`
3. Update or add unit tests in `packages/core/test/` for the affected component
4. Verify E2E tests still pass (`pnpm test:e2e`) — add example usage in `examples/hellostackwrightnext/` for new content types so E2E coverage includes them

The AGENTS.md tables are auto-generated from the live Zod schemas. Do NOT edit the content between the `<!-- stackwright:content-type-table:start/end -->` markers manually — run `generate-agent-docs` instead. CI will fail if the tables are out of sync.

### Testing Requirements

**Unit tests** (`pnpm test`): Vitest with JSDOM. Tests live in `packages/*/test/`. When adding or modifying components, update the corresponding unit tests in `packages/core/test/`.

**E2E tests** (`pnpm test:e2e`): Playwright tests in `packages/e2e/` that verify the full YAML → prebuild → Next.js build → browser pipeline against `examples/hellostackwrightnext/`. When adding new content types, add example usage in the example app so E2E smoke tests cover them. The E2E tests check that every page renders content, has no error boundaries, produces no critical console errors, and that all nav links resolve.

### Changeset Requirement

**Every PR that changes user-facing behavior MUST include a changeset.** Run `pnpm changeset` before committing, select the affected packages, choose the bump type (patch for fixes, minor for features), and write a short summary. Commit the generated `.changeset/*.md` file with your PR. CI will fail if a changeset is missing for changed packages.

### Naming Conventions

- File names: kebab-case (`main-content-grid.tsx`)
- Component names: PascalCase (`MainContentGrid`)
- YAML files: kebab-case (`about-us.yaml`)
- CLI command names: kebab-case (`generate-content`)

### Build System

Each package uses **tsup** to produce dual-format output (ESM `.mjs` + CJS `.js`) with TypeScript declarations. Tests use **Vitest** with JSDOM. All packages are in alpha (`0.x.x-alpha.x`); releases are managed via Changesets.

**Important**: Do NOT add `"type": "module"` to package.json in any `packages/*` directory. tsup uses `.mjs`/`.js` file extensions to signal ESM vs CJS format. Adding `"type": "module"` causes Node to treat CJS `.js` output as ESM, breaking `require()` in Next.js config files.

### Responsive Design

Core components (`packages/core/src/components/`) use **inline `style={{}}` props** exclusively — not Tailwind utility classes. This is architecturally deliberate: `@stackwright/core` has no CSS build pipeline (tsup compiles JS/TS only), and layout values are dynamic (driven by YAML theme config at runtime). Only `@stackwright/ui-shadcn` uses Tailwind, pre-compiling its own CSS at build time. Do not add CSS files, media query stylesheets, or Tailwind classes to `packages/core`.

**Two proven responsive patterns:**

1. **CSS-only (preferred):** `gridTemplateColumns: "repeat(auto-fill, minmax(Xpx, 1fr))"` — naturally responsive, no JS, no SSR hydration flash. Used by `IconGrid`, `FeatureList`, `TestimonialGrid`. Choose a sensible `minmax` minimum (120px for icon grids, 280px for content cards).

2. **JS hook (when CSS alone is insufficient):** `useBreakpoints()` from `packages/core/src/hooks/useBreakpoints.ts` — returns `{ isXs, isSm, isMd, isLg, isXl, isSmUp, isMdUp, isLgUp, isXlUp, isSmDown, isMdDown, isLgDown }`. Has a one-frame SSR flash (returns all `false` on first render, syncs via `useEffect` after hydration). Only use when CSS cannot express the logic — e.g., conditionally rendering entirely different component trees (TopAppBar's hamburger menu vs desktop nav links). Used by `Carousel`, `TopAppBar`.

**Rules for new and modified components:**
- All grid/multi-column components must render correctly from **320px to 1440px** viewport width.
- Never hardcode a fixed column count as `repeat(N, 1fr)`. Use `repeat(auto-fill, minmax(Xpx, 1fr))` instead.
- For flex layouts that must stack on mobile, use `flexWrap: 'wrap'` with a `minWidth` on children to control the wrap breakpoint. Use `minWidth: 'min(Xpx, 100%)'` to prevent overflow on very narrow viewports.
- For text that may overflow on narrow viewports (emails, URLs, long strings), add `wordBreak: 'break-word'` or `wordBreak: 'break-all'` as appropriate.

### Image Co-location Pipeline

Images can be co-located with their page YAML files in `pages/`. Using a relative path starting with `./` in YAML (e.g., `src: ./hero-image.png`) triggers automatic processing during the prebuild step:

1. `stackwright-prebuild` (from `@stackwright/build-scripts`) runs before `next build` / `next dev`
2. Images are copied to `public/images/` preserving directory structure
3. Paths are rewritten to `/images/...` in the processed JSON
4. `getStaticProps` reads from `public/stackwright-content/*.json` — no `fs` work at render time

Site config images (in `stackwright.yml`) that use bare filenames (e.g., `wave-tile.png`) must be in the project root. Images referenced with `./` can be anywhere relative to the config file.

Add these hooks to the example app's `package.json` (already done in `hellostackwrightnext`):
```json
"prebuild": "stackwright-prebuild",
"predev": "stackwright-prebuild"
```

### Component Registration

`registerNextJSComponents()` from `@stackwright/nextjs` must be called explicitly before rendering — it registers Next.js Image, Link, Router, and Route adapters into the `stackwrightRegistry`. The registration call should live in `pages/_app.tsx` (Pages Router) or `app/layout.tsx` (App Router). Do not rely on module import side effects to trigger registration.

### Troubleshooting

- **ESM "Cannot find module" errors**: Missing `.js` extensions in ESM imports in built output. Also check that no `packages/*` package.json has `"type": "module"` set.
- **`module is not defined` in ES module scope**: A package has `"type": "module"` in its package.json. Remove it — tsup extension conventions are sufficient.
- **Schema generation fails**: Fix TypeScript errors in source before running `pnpm generate-schemas`.
- **Changeset validation fails**: Run `pnpm changeset` and commit the generated file.
- **Build fails after dependency updates**: Run `pnpm install` from root.
- **Clear build cache**: Delete `packages/*/dist` directories.
- **Components not rendering / blank page**: Verify `registerNextJSComponents()` is called before first render in `_app.tsx` or `layout.tsx`.
