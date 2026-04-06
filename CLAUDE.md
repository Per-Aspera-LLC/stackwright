# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. For general contributor guidelines (branching, commits, testing, changesets, naming conventions, troubleshooting), see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Branching & Commits

- **`dev`** is the integration branch; **`main`** is the release branch. Feature branches branch from `dev`, PRs target `dev`.
- `git fetch origin dev && git checkout -b feat/issue-XX-description origin/dev`
- Use conventional commit prefixes (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`). Commit early and often at logical checkpoints.

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
pnpm build:scaffold-core

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
# View the priority-tiered product board (queries GitHub Issues)
pnpm stackwright -- board

# Preview a page as a screenshot (requires a running dev server + Playwright)
pnpm stackwright -- preview /about
pnpm stackwright -- preview / --width 375 --height 667 --output mobile.png

# Project-aware commands must be run from inside a Stackwright project:
# cd examples/stackwright-docs && pnpm stackwright -- page list

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

### SBOM Generation

Stackwright automatically generates SBOM (Software Bill of Materials) for every build:

```bash
# SBOM is generated automatically during prebuild
pnpm build  # Generates .stackwright/sbom/

# CLI commands for SBOM
pnpm stackwright -- sbom generate   # Regenerate SBOM
pnpm stackwright -- sbom validate   # Validate SBOM schemas
pnpm stackwright -- sbom diff       # Compare two builds

# Skip SBOM generation (rarely needed)
pnpm build -- --no-sbom
```

SBOM formats: SPDX 2.3, CycloneDX 1.5, and Stackwright Build Manifest.

## Turborepo Commands

Stackwright uses Turborepo for incremental builds and intelligent caching. Turbo commands are prefixed with `turbo:` to avoid conflicts with existing pnpm commands.

```bash
# Build all packages (with caching)
pnpm turbo:build

# Build specific packages
pnpm turbo:build:core
pnpm turbo:build:types
pnpm turbo:build:themes

# Test all packages (automatically runs build first)
pnpm turbo:test

# Run dev mode on all packages
pnpm turbo:dev

# Lint all packages
pnpm turbo:lint

# Format all packages
pnpm turbo:format
```

**Turborepo caching:**
- Local cache is stored in `.turbo/` directory
- Cache keys are based on source file hashes and inputs
- To force a fresh build: `turbo run build --force`
- To see what's cached: `turbo run build --dry-run=json`

## Architecture

Stackwright is a **pnpm monorepo** implementing a typed DSL for web applications — a platform where visual rendering + constrained DSL + AI iteration = non-technical people building enterprise apps that are safe by construction. YAML is the syntax. `@stackwright/types` is the grammar. Zod schemas enforce the safety boundary. The framework compiles content files into production-ready Next.js/React applications. See `PHILOSOPHY.md` for the full architectural rationale.

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

**Scaffold Dependency Chain:**
```
@stackwright/scaffold-core ← Hook system for extensible scaffold processing
       ↓
@stackwright/cli           ← Uses hooks for MCP config, Pro package integration
       ↓
@stackwright/launch-stackwright ← Registers MCP config via hooks
```

### Key Architectural Concepts

**Content Rendering Pipeline**: YAML files are loaded → parsed with `js-yaml` → validated against the grammar (TypeScript types/JSON schemas) → compiled to React components via `contentRenderer.tsx` → rendered with theme and context.

**Component Registry (two registries)**:
- `componentRegistry.ts` — built-in UI components, keyed by lowercase-hyphenated name
- `stackwrightRegistry` — framework-specific components that must be registered at runtime (Image, Link, Router, Route, StaticGeneration). The `@stackwright/nextjs` package provides Next.js implementations.

**Theme System**: Themes are YAML files with `id`, `name`, `colors`, `typography`, and `spacing`. Colors can be hex codes or named references to palette keys. The `useSafeTheme()` hook resolves colors at render time. `ThemesProvider` handles dynamic theme switching.

**Static Generation**: `@stackwright/nextjs` provides `getStaticPropsForSlug` and related helpers for Next.js `getStaticPaths`/`getStaticProps`. The `SlugPage` component in `@stackwright/core` drives slug-based routing.

**Grammar / JSON Schema Generation**: `@stackwright/types` is the single source of truth for the Stackwright grammar. Zod schemas are the source of truth; TypeScript types are inferred via `z.infer<>`. `zod-to-json-schema` generates `theme-schema.json`, `content-schema.json`, and `siteconfig-schema.json` — the machine-readable grammar specification used for IDE YAML validation. Must be regenerated after type changes (`pnpm generate-schemas`). Zod schemas are introspectable at runtime via `schema.def` (Zod v4) enabling MCP tools and future runtime validation.

### The No Hard Dependencies Principle

Stackwright packages follow a strict **no hard dependencies** pattern. This enables independent release cycles, testability without other packages installed, and clear separation of concerns.

#### 1. Type-Only Imports

Use `import type` for TypeScript interfaces. These imports are erased at compile time:

```typescript
// ✅ Good - type-only import
import type { ContentBlock, ComponentProps } from '@stackwright/types';

// ❌ Bad - runtime import (creates hard dependency)
import { ContentBlock } from '@stackwright/types';
```

#### 2. Interface Contracts

Define interfaces that match patterns without importing them. This enables compile-time safety while maintaining runtime independence:

```typescript
// Pro package defines its own interface compatible with OSS
export interface ComponentRegistry {
  register(name: string, component: React.ComponentType<any>): void;
  get(name: string): React.ComponentType<any> | undefined;
}
```

#### 3. Registration Functions

Components integrate via registration functions that the user calls:

```typescript
// Pro package exports a registration function
export function registerFormWidgets(registry: ComponentRegistry): void {
  registry.register('MyWidget', MyWidget);
}

// User calls it in their app
import { getRegistry } from '@stackwright/core';
import { registerFormWidgets } from '@stackwright-pro/widgets';

registerFormWidgets(getRegistry());
```

This pattern:
- ✅ Zero runtime coupling between packages
- ✅ User explicitly controls what gets registered
- ✅ Packages can be tested without other packages installed

### Scaffold Hooks System

`@stackwright/scaffold-core` provides a hook system for extensible post-scaffold processing. Pro packages register hooks that run at lifecycle points.

**Hook lifecycle points:**
| Hook | When | Use Case |
|------|------|----------|
| `preScaffold` | Before scaffolding | Validate credentials |
| `preInstall` | After files, before install | Modify package.json, configure MCP |
| `postInstall` | After pnpm install | Verify installation |
| `postScaffold` | After complete | Final configuration |

**Pro package integration:**
```typescript
import { registerScaffoldHook } from '@stackwright/scaffold-core';

registerScaffoldHook({
  type: 'preInstall',
  name: 'enterprise-license',
  critical: true,
  handler: async (ctx) => {
    ctx.packageJson.dependencies['@stackwright-pro/license'] = '^1.0.0';
  },
});
```

Hooks run automatically when using `launch-stackwright --otter-raft`.

### Key Files

- `packages/core/src/utils/contentRenderer.tsx` — core YAML-to-React transformation engine
- `packages/core/src/utils/componentRegistry.ts` — built-in component registration
- `packages/core/src/utils/stackwrightComponentRegistry.ts` — framework component registration
- `packages/core/src/components/DynamicPage.tsx` — main dynamic page component
- `packages/nextjs/src/components/` — Next.js-specific Image, Link, Router wrappers
- `packages/themes/src/ThemesProvider.tsx` — theme provider and switching
- `packages/types/src/generate-schemas.ts` — schema generation script

### Example Application

`examples/stackwright-docs/` is a Next.js app demonstrating the full stack:
- `content/pages/` — YAML page definitions (images can be co-located here using `./relative` paths)
- `content/site.yaml` — global site config (theme, navigation, app bar, footer)
- `pages/_app.tsx` — where `registerNextJSComponents()` and `registerDefaultIcons()` are called
- `next.config.js` — uses `createStackwrightNextConfig()` from `@stackwright/nextjs`

### Content Type Maintenance Rule

**When modifying `packages/types/src/types/`** — see [CONTRIBUTING.md](./CONTRIBUTING.md#content-type-maintenance-rule) for the full checklist. Summary: regenerate AGENTS.md tables, regenerate JSON schemas, update tests, verify E2E.

### Testing, Changesets, Naming, Build System

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details on testing requirements, changeset workflow, naming conventions, roadmap maintenance, build system notes, and troubleshooting.

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

Add these hooks to the example app's `package.json` (already done in `stackwright-docs`):
```json
"prebuild": "stackwright-prebuild",
"predev": "stackwright-prebuild"
```

### Component Registration

`registerNextJSComponents()` from `@stackwright/nextjs` must be called explicitly before rendering — it registers Next.js Image, Link, Router, and Route adapters into the `stackwrightRegistry`. The registration call should live in `pages/_app.tsx` (Pages Router) or `app/layout.tsx` (App Router). Do not rely on module import side effects to trigger registration.

### Debug Logging

Stackwright uses `STACKWRIGHT_DEBUG=true` (set in `.env.local`) to gate verbose console logging. Debug output only activates when both `NODE_ENV === 'development'` and `STACKWRIGHT_DEBUG === 'true'`.

**Pattern for new modules:** Define a module-scoped debug function with a unique emoji prefix:

```typescript
const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🏷️ ModuleName Debug: ${message}`, data ? data : '');
  }
};
```

**Existing prefixes** (do not reuse):
- `🐛` ContentRenderer — `🔧` ComponentRegistry — `🚀` StackwrightRegistry — `📸` NextStackwrightImage

**Rules:**
- Use the helper function pattern (not inline conditionals) for consistency.
- Log at key decision points: component lookups, registration, content type resolution, error paths.
- Never log sensitive data (user input, credentials).
- Do not use `console.debug` or other log levels — always `console.log` gated by the env check.

### Troubleshooting

See [CONTRIBUTING.md](./CONTRIBUTING.md#troubleshooting) for common issues and solutions.

### Visual Rendering Pipeline

Stackwright includes visual rendering tools that let AI agents and developers see rendered pages as screenshots. This closes the feedback loop between content authoring and visual verification.

**MCP tools** (in `@stackwright/mcp`):
- `stackwright_check_dev_server` — verify dev server is running
- `stackwright_render_page` — screenshot any page (returns base64 PNG/JPEG)
- `stackwright_render_diff` — capture "before" state for visual comparison
- `stackwright_render_yaml` — render raw YAML without saving permanently (ephemeral preview)

**CLI command**: `stackwright preview [slug]` renders a page to a screenshot file.

**Architecture**: A singleton Playwright browser instance is pooled and reused across MCP render calls with a 5-minute idle auto-teardown. The CLI command launches a fresh browser per invocation. Both require a running dev server (`pnpm dev`).

**Ephemeral preview flow** (`render_yaml`): Writes a `__preview-<timestamp>` temp page → waits for dev server hot-reload → screenshots → cleans up the temp page in a `finally` block. Zero permanent side effects.

### Cookie & Color Mode Persistence

Stackwright provides first-class cookie utilities and color mode persistence to eliminate flash-of-wrong-theme for return visitors.

**Setup (example app already configured):**
1. Use `StackwrightDocument` in `pages/_document.tsx`:
   ```tsx
   import { StackwrightDocument } from '@stackwright/nextjs';
   export default StackwrightDocument;
   ```
2. The `ColorModeScript` blocking `<script>` is included automatically. It reads the `sw-color-mode` cookie before React hydrates and sets `data-sw-color-mode` on `<html>`.

**How it works:**
- `ThemeProvider.setColorMode('dark')` writes `sw-color-mode=dark` cookie
- `ThemeProvider.setColorMode('system')` removes the cookie (falls back to OS preference)
- On mount, `ThemeProvider` reads the cookie and restores the saved preference
- `ColorModeScript` (in `<Head>`) reads the cookie before React hydrates → no flash

**Cookie utilities** (`@stackwright/core`): `getCookie`, `setCookie`, `removeCookie` — SSR-safe, zero dependencies.

**Consent utilities** (`@stackwright/core`): `getConsentState`, `setConsentState`, `hasConsent` — IAB TCF categories (`necessary`, `functional`, `analytics`, `marketing`). `necessary` is always `true`.

**Cookie names used by the framework:**
- `sw-color-mode` — color mode preference (`light` | `dark`, absent = system)
- `sw-consent` — consent state (JSON object with category booleans)
