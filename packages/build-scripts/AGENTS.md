# @stackwright/build-scripts — Agent Guide

Prebuild pipeline for Stackwright projects. Runs before `next build` and `next dev` to compile YAML content, process images, and emit typed JSON sinks consumed at render time.

---

## What This Package Does

The `stackwright-prebuild` CLI binary (and the programmatic `runPrebuild()` / `compileAll()` API) performs these steps:

1. **`compileSite(ctx)`** — Reads `stackwright.yml`, validates against `siteConfigSchema`, resolves env vars, processes images, writes `_site.json`
2. **`compileTheme(ctx)`** — Reads `stackwright.theme.yml` (Path 1) or extracts theme keys from `stackwright.yml` (Path 2), validates against `stackwrightThemeFileSchema`, writes `_theme.json` (always emitted)
3. **`compileIcons(ctx)`** — Generates `stackwright-generated/icons.ts` icon manifest
4. **`compileFonts(ctx)`** — Generates `_font-links.json` for font preloading
5. **`compilePages(ctx)`** — Reads `content/pages/`, validates page YAML, writes `_root.json` + per-slug JSONs with locale variants
6. **`compileFileCollections(ctx)`** — Reads `content/` collection dirs, writes collection manifests + entry JSONs

At runtime, `getStaticProps` / server components read from these JSON files — no filesystem work at render time.

---

## How It's Triggered

Via npm lifecycle hooks in the consumer's `package.json`:

```json
"prebuild": "stackwright-prebuild",
"predev": "stackwright-prebuild"
```

Without these hooks, co-located images won't be found and content won't be compiled.

---

## Public API

All primitives are exported from the package root:

```typescript
import {
  // High-level entry points
  runPrebuild,    // CLI/legacy wrapper — parses options, calls compileAll
  compileAll,     // Run all sinks in topological order including plugin additionalSinks

  // Individual compile primitives — callable independently
  compileSite,
  compileTheme,
  compileIcons,
  compileFonts,
  compilePages,
  compilePage,            // Compile a single page slug
  compileFileCollections,

  // Context factory
  createCompileContext,
} from '@stackwright/build-scripts';

import type { CompileContext } from '@stackwright/build-scripts';
```

### `CompileContext`

All compile functions take a single `CompileContext` argument:

```typescript
interface CompileContext {
  projectRoot: string;          // Abs path to project root (where stackwright.yml lives)
  contentOutDir: string;        // Abs path to public/stackwright-content/
  imagesDir: string;            // Abs path to public/images/
  generatedDir: string;         // Abs path to stackwright-generated/
  plugins: PrebuildPlugin[];    // Active plugins (Pro, etc.)
  unknownContentTypes: 'error' | 'warn' | 'ignore';
  imageOptimizationEnabled: boolean;
}
```

Create one from `PrebuildOptions`:

```typescript
const ctx = createCompileContext({ projectRoot: '/path/to/project' });
await compileAll(ctx);
```

### `compileAll(ctx)` — Run order

```
beforeBuild hooks (all plugins)
↓
compileSite
compileTheme
compileIcons
compileFonts
compilePages
compileFileCollections
↓
plugin.additionalSinks[] (in declaration order, per plugin)
↓
afterBuild hooks (all plugins)
```

---

## Content Sinks (Output Files)

| Sink file | Written by | Notes |
|---|---|---|
| `_site.json` | `compileSite` | Site config — nav, appBar, footer, locales. No theme keys (Bead 4 strips them). |
| `_theme.json` | `compileTheme` | Theme config — always emitted. Schema: `stackwrightThemeFileSchema`. |
| `_font-links.json` | `compileFonts` | Font preload `<link>` tags. |
| `_image-manifest.json` | `compileIcons` + image pipeline | Optimized image manifest with blur hashes. |
| `_root.json` | `compilePages` | Root page content. |
| `<slug>.json` | `compilePages` | Per-page content, one file per route slug. |
| `collections/<name>/_index.json` | `compileFileCollections` | Collection manifest. |
| `collections/<name>/<entry>.json` | `compileFileCollections` | Individual collection entries. |

---

## Plugin API — `PrebuildPlugin`

```typescript
interface PrebuildPlugin {
  name: string;
  beforeBuild?: (ctx: PrebuildPluginContext) => Promise<void> | void;
  afterBuild?: (ctx: PrebuildPluginContext) => Promise<void> | void;

  /**
   * Additional compile sinks provided by this plugin.
   * Runs during compileAll() after all OSS-native steps and before afterBuild.
   * Sinks run in declaration order within each plugin.
   *
   * Used by Pro plugins to emit:
   *   - _collections.json  (live-data collection configs)
   *   - _auth.json         (auth provider config)
   *   - _integrations.json (API/service config)
   */
  additionalSinks?: ReadonlyArray<{
    name: string;
    compile: (context: PrebuildPluginContext) => Promise<void> | void;
  }>;

  contentItemSchemas?: Record<string, ZodType>;
}
```

### `PrebuildPluginContext`

```typescript
interface PrebuildPluginContext {
  projectRoot: string;
  contentOutDir: string;
  imagesDir: string;
  generatedDir: string;
}
```

---

## Watch Mode

`src/watch.ts` provides a file watcher for development. Watches `content/pages/` and `content/` with debouncing + SSE notification to trigger browser refreshes on content changes.

---

## Package Structure

```
src/
  prebuild.ts          — runPrebuild() thin wrapper (entry for CLI bin)
  watch.ts             — File watcher for dev mode
  index.ts             — Public exports
  compile/
    context.ts         — CompileContext type + createCompileContext() + toPluginContext()
    site.ts            — compileSite()
    theme.ts           — compileTheme() — reads stackwright.theme.yml or extracts from site config
    pages.ts           — compilePages(), compilePage()
    icons.ts           — compileIcons()
    fonts.ts           — compileFonts()
    collections.ts     — compileFileCollections()
    index.ts           — re-exports + compileAll()
```

---

## Dependencies

- **@stackwright/types** — Zod schemas (`siteConfigSchema`, `stackwrightThemeFileSchema`, `PrebuildPlugin`, etc.)
- **js-yaml** — YAML parsing
- **sharp** — Image optimization (optional, non-fatal if absent)
