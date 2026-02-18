# @stackwright/icons — Agent Guide

This package manages icon components and the icon registry for Stackwright. Understanding how icons resolve at runtime is critical before making changes here.

---

## How Icon Resolution Works

Icons in Stackwright are resolved at render time via a **global registry** (`__stackwright_icon_registry__`). This registry is a `Map<string, React.ComponentType>` that is populated during app startup.

**Resolution order in `IconGrid` and `Media`:**
1. Look up `src` in the Stackwright icon registry
2. If not found, render the `src` string as a monospace fallback

**Why not `require('@mui/icons-material')` at render time?**
Dynamic `require()` works in Node.js (SSR) but is `undefined` in the client ESM bundle. Using it causes a server/client hydration mismatch: the server renders an `<svg>` and the client renders the fallback text, crashing React's reconciliation. All icon imports **must be static** and registered before first render.

---

## Adding Icons

### Add a single icon to an existing app

In the app's `_app.tsx` (or `layout.tsx`), after `registerDefaultIcons()`:

```ts
import { registerStackwrightIcon } from '@stackwright/icons';
import MyCustomIcon from '@mui/icons-material/MyCustomIcon';

registerStackwrightIcon('MyCustomIcon', MyCustomIcon);
```

The string key becomes the `src` value in YAML:
```yaml
icons:
  - label: "My Feature"
    src: "MyCustomIcon"
```

### Add an icon to the default preset

Edit `src/presets/muiIcons.ts`. Add a **static import** at the top and add the name to `muiIconPreset`:

```ts
import MyNewIcon from "@mui/icons-material/MyNewIcon";

export const muiIconPreset: Record<string, React.ComponentType<any>> = {
    // ... existing icons ...
    MyNewIcon,
};
```

The key must exactly match the MUI export name (PascalCase). The icon will be available in any YAML `icon_grid` as `src: "MyNewIcon"` after the next build.

**Do not use `require('@mui/icons-material')` or any dynamic require.** Static imports only — this is enforced by the hydration constraint described above.

### Add a fully custom SVG icon

Create a component in `src/icons/<category>/MyIcon.tsx` following the pattern of `BlueSkyIcon.tsx`, then add it to `muiIcons.ts` or `defaultIcons.ts`.

---

## Currently Registered Defaults

`registerDefaultIcons()` registers all of the following. These names are valid `src` values in YAML without any additional setup:

| YAML `src` value | Icon |
|---|---|
| `bluesky` | BlueSky logo |
| `stackwright` | Stackwright logo |
| `Speed` | Speed/performance |
| `VerifiedUser` | Shield with checkmark |
| `CloudDone` | Cloud with checkmark |
| `Description` | Document/file |
| `Palette` | Color palette |
| `Code` | Code brackets |
| `Star` | Star |
| `CheckCircle` | Circle checkmark |
| `Rocket` | Rocket |
| `Lock` | Padlock |
| `Language` | Globe |
| `Build` | Wrench |
| `AutoAwesome` | Sparkles |
| `Dashboard` | Dashboard grid |
| `Api` | API label |
| `Storage` | Database/storage |
| `Cloud` | Cloud |
| `Security` | Security shield |
| `People` | People/group |
| `TrendingUp` | Upward trend chart |

---

## Package Structure

```
src/
  registry/iconRegistry.ts     — global registry Map, register/get helpers
  presets/
    muiIcons.ts                — static MUI icon imports + muiIconPreset map
    defaultIcons.ts            — combines brand/social icons + muiIconPreset
  icons/
    brand/StackwrightIcon.tsx  — Stackwright logo SVG
    social/BlueSkyIcon.tsx     — BlueSky logo SVG
  index.ts                     — public exports
```

---

## Integration

`registerDefaultIcons()` must be called before first render — it populates the global registry that `IconGrid` and `Media` read at render time. In the example app this happens in `pages/_app.tsx`. In a custom app, call it in `_app.tsx` or `layout.tsx` alongside `registerNextJSComponents()`.

The registry uses `globalThis` so it is accessible across package boundaries without prop drilling.
