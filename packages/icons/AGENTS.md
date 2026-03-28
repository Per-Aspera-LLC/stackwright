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

## Tiered Registration Options

The package exposes four registration functions, from most to least inclusive:

| Function | What it registers | Use case |
|---|---|---|
| `registerDefaultIcons()` | Full Lucide set (~1,500+ icons) + brand/social icons | **Recommended default.** Call this in `_app.tsx` or `layout.tsx`. |
| `registerAllLucideIcons()` | Full Lucide set only (no brand/social) | When you want all Lucide icons but will register brand icons separately. |
| `registerLucideIcons()` | Curated ~40-icon subset | Lightweight option for bundle-conscious apps. |
| `registerStackwrightIcon('Name', Component)` | A single custom icon | Adding individual icons on top of any preset. |

### Example: Default setup (recommended)

```ts
// pages/_app.tsx or app/layout.tsx
import { registerDefaultIcons } from '@stackwright/icons';

registerDefaultIcons();
```

This makes **every Lucide icon** available in YAML by its PascalCase name — no manual registration needed. Browse the full catalogue at **https://lucide.dev/icons**.

### Example: Lightweight curated preset

```ts
import { registerLucideIcons } from '@stackwright/icons';

registerLucideIcons();
```

This registers only ~40 hand-picked icons. If a YAML author uses an icon not in this set, it won't resolve. See `src/presets/lucideIcons.ts` for the exact list.

---

## Currently Registered Defaults

`registerDefaultIcons()` registers the **entire Lucide icon library** (~1,500+ icons) plus brand/social icons. Any PascalCase Lucide icon name is a valid `src` value in YAML without any additional setup.

**Browse all available icons:** https://lucide.dev/icons

Use the PascalCase name from the Lucide site as your YAML `src` value. For example:

```yaml
icons:
  - label: "Favourites"
    src: "Heart"
  - label: "Photos"
    src: "Camera"
  - label: "Settings"
    src: "Settings"
```

**Brand & Social (custom SVGs):**
| YAML `src` value | Icon |
|---|---|
| `bluesky` | BlueSky logo (custom SVG) |
| `stackwright` | Stackwright logo (custom SVG) |

**Legacy MUI aliases** (still work in YAML):

| MUI name | Resolves to |
|---|---|
| `Speed` | `Zap` |
| `VerifiedUser` | `ShieldCheck` |
| `CloudDone` | `CloudCheck` |
| `Description` | `FileText` |
| `Language` | `Globe` |
| `Build` | `Wrench` |
| `AutoAwesome` | `Sparkles` |
| `Dashboard` | `LayoutDashboard` |
| `Api` | `Braces` |
| `Storage` | `Database` |
| `Security` | `Shield` |
| `People` | `Users` |

**Lucide renamed-icon aliases** (also preserved):

| Old name | Canonical name |
|---|---|
| `CheckCircle` | `CircleCheck` |
| `AlertTriangle` | `TriangleAlert` |

---

## Adding Icons

### Lucide icons — nothing to do

All ~1,500+ Lucide icons are registered by default. Just use the PascalCase name in YAML. No code changes needed.

### Add a fully custom SVG icon

Create a component in `src/icons/<category>/MyIcon.tsx` following the pattern of `BlueSkyIcon.tsx`, then add it to `defaultIcons.ts`:

```ts
// src/icons/brand/MyBrandIcon.tsx
import React from 'react';
import type { IconProps } from '../../registry/iconRegistry';

export const MyBrandIcon: React.FC<IconProps> = ({ size = 24, color, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} {...props}>
    {/* SVG paths */}
  </svg>
);
```

Then register it in your app:

```ts
import { registerStackwrightIcon } from '@stackwright/icons';
import { MyBrandIcon } from './icons/brand/MyBrandIcon';

registerStackwrightIcon('mybrand', MyBrandIcon);
```

**Do not use dynamic `require()`.** Static imports only — this is enforced by the hydration constraint described above.

---

## Package Structure

```
src/
  registry/iconRegistry.ts     — global registry Map, register/get helpers
  presets/
    lucideAllIcons.ts          — full Lucide barrel import (~1,500+ icons)
    lucideIcons.ts             — curated ~40 Lucide icons (lightweight alternative)
    defaultIcons.ts            — combines brand/social icons + lucideAllIconsPreset
    muiIcons.ts                — legacy file (kept for reference, not used by default)
  icons/
    brand/StackwrightIcon.tsx  — Stackwright logo SVG
    social/BlueSkyIcon.tsx     — BlueSky logo SVG
  hooks/useStackwrightIcon.ts  — hook for icon lookup in components
  index.ts                     — public exports
```

## Dependencies

- **lucide-react** — Icon library (full barrel import via `icons` namespace object)
- **React** ^19 (peer)

No MUI icons. No `@mui/icons-material`.

---

## Integration

`registerDefaultIcons()` must be called before first render — it populates the global registry that `IconGrid` and `Media` read at render time. In the example app this happens in `pages/_app.tsx`. In a custom app, call it in `_app.tsx` or `layout.tsx` alongside `registerNextJSComponents()`.

The registry uses `globalThis` so it is accessible across package boundaries without prop drilling.
