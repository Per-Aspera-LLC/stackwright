# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# Run development mode (watch all packages)
pnpm dev

# Run the example application
pnpm dev:hellostackwright

# Run all tests
pnpm test

# Run core package tests only
pnpm test:core

# Generate JSON schemas from TypeScript types
cd packages/types && pnpm generate-schemas

# Release management
pnpm changeset          # Create a changeset for changes
pnpm version-packages   # Update versions based on changesets
pnpm release            # Build and publish to NPM
```

## Architecture

Stackwright is a **pnpm monorepo** implementing a YAML-driven React framework. Non-developers define web applications in declarative YAML files; the framework transforms them into production-ready Next.js/React applications.

### Package Dependency Graph

```
User's Next.js App
       ↓
@stackwright/nextjs     ← Next.js adapter (Image, Link, Router wrappers; static gen helpers)
       ↓
@stackwright/core       ← Runtime engine (YAML→React, component registry, layout system)
    ↓  ↓  ↓
@stackwright/types   @stackwright/themes   @stackwright/icons
(TS types +          (YAML-configurable    (MUI icon
 JSON schemas)        MUI theming)          registry)

@stackwright/cli        ← Standalone CLI (scaffolding, AI content generation via OpenAI)
```

### Key Architectural Concepts

**Content Rendering Pipeline**: YAML files are loaded → parsed with `js-yaml` → validated against TypeScript types/JSON schemas → transformed to React components via `contentRenderer.tsx` → rendered with theme and context.

**Component Registry (two registries)**:
- `componentRegistry.ts` — built-in UI components, keyed by lowercase-hyphenated name
- `stackwrightRegistry` — framework-specific components that must be registered at runtime (Image, Link, Router, Route, StaticGeneration). The `@stackwright/nextjs` package provides Next.js implementations.

**Theme System**: Themes are YAML files with `id`, `name`, `colors`, `typography`, and `spacing`. Colors can be hex codes or named references to palette keys. The `useSafeTheme()` hook resolves colors at render time. `ThemesProvider` handles dynamic theme switching.

**Static Generation**: `@stackwright/nextjs` provides `getStaticPropsForSlug` and related helpers for Next.js `getStaticPaths`/`getStaticProps`. The `SlugPage` component in `@stackwright/core` drives slug-based routing.

**JSON Schema Generation**: `@stackwright/types` runs `typescript-json-schema` to produce `theme-schema.json`, `content-schema.json`, and `siteconfig-schema.json` — these enable YAML validation in IDEs. Must be regenerated after type changes (`pnpm generate-schemas`).

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
1. Update the Content Type Reference table in `/AGENTS.md`
2. Update the matching table in `examples/hellostackwrightnext/AGENTS.md`
3. Regenerate JSON schemas: `cd packages/types && pnpm generate-schemas`

The AGENTS.md tables are the primary reference for agents writing YAML content. Stale tables will cause agents to write invalid YAML.

### Naming Conventions

- File names: kebab-case (`main-content-grid.tsx`)
- Component names: PascalCase (`MainContentGrid`)
- YAML files: kebab-case (`about-us.yaml`)
- CLI command names: kebab-case (`generate-content`)

### Build System

Each package uses **tsup** to produce dual-format output (ESM `.mjs` + CJS `.js`) with TypeScript declarations. Tests use **Vitest** with JSDOM. All packages are in alpha (`0.x.x-alpha.x`); releases are managed via Changesets.

**Important**: Do NOT add `"type": "module"` to package.json in any `packages/*` directory. tsup uses `.mjs`/`.js` file extensions to signal ESM vs CJS format. Adding `"type": "module"` causes Node to treat CJS `.js` output as ESM, breaking `require()` in Next.js config files.

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
