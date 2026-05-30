# ADR: Bundle Architecture and First-Load JS Contract

**Date**: 2026-05-29  
**Status**: Accepted  
**Deciders**: Charles (Per Aspera LLC)  
**RFC Bead**: stackwright-y5u (closed)  
**Audit Bead**: stackwright-9yh (closed — findings drove all decisions)

---

## Context

Between January 2025 and May 2026, the Stackwright framework's first-load JavaScript bundle grew from ~85 KB gzip to ~403 KB gzip — a 5× increase. Performance budgets were bumped to match actual size rather than aspirational targets, making them meaningless. Bundle auditing (`stackwright-9yh`) identified the root causes.

### Audit Findings (2026-05-29)

| # | Package | Parsed | Gzip | Root Cause |
|---|---|---|---|---|
| 1 | `lucide-react` | 471 KB | 123 KB | `registerDefaultIcons()` imported all 1,500+ icons via barrel export |
| 2 | `@stackwright/core` | 106 KB | 33 KB | Monolithic barrel, all components in first-load |
| 3 | `zod` | 95 KB | 24 KB | Leaked to client via `@stackwright/types` barrel |
| 4 | `js-yaml` | 31 KB | 10 KB | Leaked to client via `ThemeLoader` static import |
| 5 | `fuse.js` | 19 KB | 6 KB | `SearchModal` imported at module load, not lazily |
| 6 | `tailwind-merge` | 29 KB | 7 KB | Required by `@stackwright/ui-shadcn` (acceptable) |

**Total theoretical savings**: ~165 KB gzip → target: ~227 KB gzip first-load (42% reduction from 392 KB).

---

## Decisions

### Decision 1 — Icon Loading Strategy

**Choice**: Prebuild-generated per-site icon manifest.

The `stackwright-prebuild` script now scans all processed YAML content (post-JSON output) for `{ type: "icon", src: string }` references and generates `stackwright-generated/icons.ts` in the user's app. This file contains:
- Static `import { ... } from 'lucide-react'` for only the icons used in the site
- Legacy MUI icon aliases (hard-coded; candidates for deprecation)
- System icons (Sun, Moon, Info, TriangleAlert, CircleAlert) always included
- Brand icons (BlueSkyIcon, StackwrightIcon) always included
- `export function registerSiteIcons()` — called in `Providers.tsx` instead of `registerDefaultIcons()`

**Rationale**: Static imports enable webpack tree-shaking. Per-site manifest means each deployed site ships only its icons. The prebuild already reads all YAML — adding a recursive `{ type: "icon" }` walker costs ~15 lines of code.

**Fallback**: `registerDefaultIcons()` is retained and now uses the curated ~43-icon `lucideIconPreset` (instead of `lucideAllIconsPreset`). Suitable for apps that haven't migrated to `registerSiteIcons()`.

**`lucideAllIconsPreset` and `registerAllLucideIcons()`**: Kept as opt-in exports for advanced users who need the full icon set.

**Estimated savings**: ~120 KB gzip.

---

### Decision 2 — Content Type Code Splitting

**Choice**: `React.lazy()` + tsup code splitting for heavy content types at the component registry level. `next/dynamic()` considered but `React.lazy()` is framework-agnostic and works the same way.

Implemented for:
- **Carousel**: Dynamically imported via `React.lazy()` in the component registry. A `<Suspense>` boundary was added to `DynamicPage`. tsup `splitting: true` ensures the Carousel module is a separate chunk.
- **Video**: Not split (shares a component with `media` — splitting would require refactoring `Media.tsx`; deferred).
- **SearchModal / fuse.js**: `fuse.js` import moved from module-level to inside `useEffect` (async `import('fuse.js')` at search-open time).
- **Map**: Already uses a registry/provider pattern — zero weight unless `MapProvider` is registered. No change needed.

**Pattern for future heavy content types**: Any content type component >20 KB gzip that is not universally used should be registered via `React.lazy(() => import('./path/to/Component'))` and the registering package must have `splitting: true` in tsup.

**Estimated savings**: Carousel deferred from first-load (~15 KB gzip estimate); fuse.js deferred (~6 KB gzip).

---

### Decision 3 — First-Load Contract

The following are the **only** items that belong in the first-load JavaScript bundle:

| Item | Approximate size |
|---|---|
| React + React DOM | ~45 KB gzip |
| Next.js runtime | ~85 KB gzip |
| ThemeProvider + ColorModeScript | ~5 KB gzip |
| AppBar / Nav shell | ~10 KB gzip |
| DynamicPage shell (dispatch only) | ~8 KB gzip |
| System icons (Sun, Moon, Info, etc.) | ~2 KB gzip |
| **Target total** | **≤ 200 KB gzip** |

Everything else — content type components, non-system icons, client-only utilities (fuse.js) — is a candidate for lazy/dynamic loading or server-only placement.

---

### Decision 4 — New Dependency Policy

Any dependency >20 KB gzip added to an eagerly-loaded package (`@stackwright/core`, `@stackwright/themes`, `@stackwright/icons`, `@stackwright/nextjs`) **requires** an ADR (or ADR section) documenting:

1. Is this dependency client-needed or server/build-only?
2. Can it be lazy-loaded or code-split?
3. Measured bundle impact (before/after, gzip).
4. Maintainer approval.

Build-only or server-only packages should be marked as `devDependencies` or imported via subpath entries that are excluded from the client bundle.

---

### Decision 5 — Performance Budget

After all optimization work lands, the performance budget targets are reset to:

| Metric | Warn | Max |
|---|---|---|
| First-load JS (gzip) | 150 KB | 200 KB |
| All-pages JS (gzip) | 600 KB | 800 KB |

These targets include the React + Next.js runtime (~130 KB). The framework shell should fit in the remaining 70 KB headroom.

The `performance-budgets.json` file in `packages/e2e/tests/performance` is the authoritative source for CI budget enforcement.

---

## Consequences

### Positive
- First-load JS reduced from ~392 KB to an estimated ~227 KB gzip (42% reduction)
- Per-site icon manifests mean framework icon cost scales with site usage, not lucide-react's full library
- Server-only packages (zod, js-yaml) no longer inflate the client bundle
- Lazy content types reduce first-load cost for pages that don't use them
- Clear policy prevents future bundle inflation

### Negative / Trade-offs
- `registerSiteIcons()` requires running `pnpm predev` whenever icons change — tooling dependency
- Carousel now has a `<Suspense>` boundary — slight visual delay on first render (null fallback used)
- Legacy MUI icon aliases are still present; they should be deprecated in a future major version
- Video splitting deferred (requires refactoring `Media.tsx`)

### Migration
- New projects scaffolded with `launch-stackwright` get all of this automatically
- Existing projects: run `pnpm predev` once, update `Providers.tsx` to call `registerSiteIcons()` from the generated file
- `registerDefaultIcons()` continues to work with the curated preset — no breaking change
