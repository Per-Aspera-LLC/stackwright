# @stackwright/icons — Agent Guide

This package manages icon components and the icon registry for Stackwright. Icons are powered by **Lucide React** (MUI icons were removed in the shadcn migration).

---

## How Icon Resolution Works

Icons in Stackwright are resolved at render time via a **global registry** (`__stackwright_icon_registry__`). This registry is a `Map<string, React.ComponentType>` that is populated during app startup.

**Resolution order in `IconGrid` and `Media`:**
1. Look up `src` in the Stackwright icon registry
2. If not found, render the `src` string as a monospace fallback

**Why static imports only?**
Dynamic `require()` works in Node.js (SSR) but is `undefined` in the client ESM bundle. Using it causes a server/client hydration mismatch. All icon imports **must be static** and registered before first render.

---

## Adding Icons

### Add a single icon to an existing app

In the app's `_app.tsx` (or `layout.tsx`), after `registerDefaultIcons()`:

```ts
import { registerStackwrightIcon } from '@stackwright/icons';
import { Heart } from 'lucide-react';

registerStackwrightIcon('Heart', Heart);
```

The string key becomes the `src` value in YAML:
```yaml
icons:
  - label: "My Feature"
    src: "Heart"
```

### Add an icon to the default preset

Edit `src/presets/lucideIcons.ts`. Add a **static import** from `lucide-react` and add the name to `lucideIconPreset`:

```ts
import { Heart } from 'lucide-react';

export const lucideIconPreset: Record<string, React.ComponentType<any>> = {
    // ... existing icons ...
    Heart,
};
```

The icon will be available in any YAML `icon_grid` as `src: "Heart"` after the next build.

**Do not use dynamic `require()`.** Static imports only — this is enforced by the hydration constraint described above.

### Legacy MUI icon name aliases

`lucideIcons.ts` includes aliases that map old MUI icon names to their Lucide equivalents (e.g., `Speed` → `Zap`, `VerifiedUser` → `ShieldCheck`). This ensures existing YAML content continues to work without changes.

### Add a fully custom SVG icon

Create a component in `src/icons/<category>/MyIcon.tsx` following the pattern of `BlueSkyIcon.tsx`, then add it to `defaultIcons.ts`.

---

## Currently Registered Defaults

`registerDefaultIcons()` registers the Lucide preset plus brand/social icons. These names are valid `src` values in YAML without any additional setup:

**Brand & Social:**
| YAML `src` value | Icon |
|---|---|
| `bluesky` | BlueSky logo (custom SVG) |
| `stackwright` | Stackwright logo (custom SVG) |

**Lucide Icons (direct names):**
| YAML `src` value | Icon |
|---|---|
| `Zap` | Lightning bolt |
| `ShieldCheck` | Shield with checkmark |
| `FileText` | Document |
| `Palette` | Color palette |
| `Code` | Code brackets |
| `Star` | Star |
| `CheckCircle` | Circle checkmark |
| `Rocket` | Rocket |
| `Lock` | Padlock |
| `Globe` | Globe |
| `Wrench` | Wrench |
| `Sparkles` | Sparkles |
| `LayoutDashboard` | Dashboard grid |
| `Braces` | Curly braces |
| `Database` | Database |
| `Cloud` | Cloud |
| `Shield` | Shield |
| `Users` | People group |
| `TrendingUp` | Upward trend |
| `Info` | Info circle |
| `AlertTriangle` | Warning triangle |
| `Sun` / `Moon` | Color mode toggle |
| `BookOpen` | Book |
| `Calendar` | Calendar |
| `Tag` | Tag/label |
| `ArrowRight` / `ChevronRight` | Navigation arrows |
| `ExternalLink` | External link |
| `GitBranch` | Version control |
| `Package` | Package |
| `Puzzle` | Plugin/extension |
| `Layers` | Stacked layers |
| `DoorOpen` | Open door |
| `Bot` | AI/robot |
| `Paintbrush` | Theming |
| `FlaskConical` | Testing |
| `FileCheck` | Validation |
| `Gem` | Quality |

**Legacy MUI aliases** (still work in YAML):
`Speed`→Zap, `VerifiedUser`→ShieldCheck, `CloudDone`→CloudCheck, `Description`→FileText, `Language`→Globe, `Build`→Wrench, `AutoAwesome`→Sparkles, `Dashboard`→LayoutDashboard, `Api`→Braces, `Storage`→Database, `Security`→Shield, `People`→Users

---

## Package Structure

```
src/
  registry/iconRegistry.ts     — global registry Map, register/get helpers
  presets/
    lucideIcons.ts             — Lucide icon imports + lucideIconPreset map (primary)
    defaultIcons.ts            — combines brand/social icons + lucideIconPreset
    muiIcons.ts                — legacy file (kept for reference, not used by default)
  icons/
    brand/StackwrightIcon.tsx  — Stackwright logo SVG
    social/BlueSkyIcon.tsx     — BlueSky logo SVG
  index.ts                     — public exports
```

## Dependencies

- **lucide-react** — Icon library (tree-shakeable static imports)
- **React** ^19 (peer)

No MUI icons. No `@mui/icons-material`.

---

## Integration

`registerDefaultIcons()` must be called before first render — it populates the global registry that `IconGrid` and `Media` read at render time. In the example app this happens in `pages/_app.tsx`. In a custom app, call it in `_app.tsx` or `layout.tsx` alongside `registerNextJSComponents()`.

The registry uses `globalThis` so it is accessible across package boundaries without prop drilling.
