# @stackwright/maplibre

MapLibre GL adapter for Stackwright — **free tier, no API keys required**.

## Features

- ✅ 2D interactive maps with pan/zoom
- ✅ Markers with click-to-show popups
- ✅ Polyline routes (flight paths, shipping lanes)
- ✅ Polygon boundaries (territories, regions)
- ✅ GeoJSON support (complex geometries)
- ✅ Free MapLibre demo tiles (no vendor lock-in)
- ✅ SSR-safe for Next.js
- ✅ Responsive design (320px to 1440px)

## Installation

```bash
pnpm add @stackwright/maplibre
```

## Usage

### 1. Register the Provider

In your Next.js `_app.tsx` (Pages Router) or `app/layout.tsx` (App Router):

```typescript
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerMapLibreProvider } from '@stackwright/maplibre';
import '@stackwright/maplibre/dist/styles.css'; // ⚠️ Required!

registerNextJSComponents();
registerMapLibreProvider(); // Register MapLibre as map adapter
```

⚠️ **Don't forget the CSS import!** MapLibre GL requires its stylesheets.

### 2. Use Maps in YAML

Create a page with map content:

```yaml
# pages/locations/content.yml
content:
  content_items:
    - type: map
      label: "Our offices"
      center: { lat: 37.7749, lng: -122.4194 }
      zoom: 12
      height: "500px"
      markers:
        - lat: 37.7749
          lng: -122.4194
          label: "San Francisco HQ"
          popup: "123 Market St, SF CA 94103"
        - lat: 37.8044
          lng: -122.2712
          label: "Oakland Office"
          popup: "456 Broadway, Oakland CA 94607"
```

### 3. View Your Map

```bash
pnpm dev
# Visit http://localhost:3000/locations
```

## Advanced Features

> All the `color`/`fillColor` values below also accept theme tokens
> (`status-ok`, `brand-primary`, ...) instead of raw hex — see
> [Colors: tokens everywhere](#colors-tokens-everywhere) below. The hex
> values here are just the simplest possible example.

### Polyline Routes

Show flight paths, shipping lanes, or driving directions:

```yaml
- type: map
  label: "Delivery route"
  center: { lat: 37.7749, lng: -122.4194 }
  zoom: 10
  layers:
    - type: polyline
      data:
        - [-122.4194, 37.7749]  # SF
        - [-122.2712, 37.8044]  # Oakland
        - [-122.0838, 37.4219]  # Palo Alto
      style:
        color: "#FF5733"
        width: 4
        opacity: 0.8
```

⚠️ **Coordinate order:** MapLibre uses `[lng, lat]` for polyline data (GeoJSON standard).

### Polygon Regions

Highlight territories, service areas, or property boundaries:

```yaml
- type: map
  label: "Service area"
  center: { lat: 37.7749, lng: -122.4194 }
  zoom: 11
  layers:
    - type: polygon
      data:  # Outer ring (clockwise)
        - [-122.52, 37.82]
        - [-122.35, 37.82]
        - [-122.35, 37.70]
        - [-122.52, 37.70]
        - [-122.52, 37.82]
      style:
        fillColor: "#3388ff"
        fillOpacity: 0.3
        color: "#3388ff"  # Border color
```

### GeoJSON Layers

Import complex geometries from GeoJSON:

```yaml
- type: map
  label: "Geographic data"
  center: { lat: 37.7749, lng: -122.4194 }
  zoom: 10
  layers:
    - type: geojson
      data:
        type: "FeatureCollection"
        features:
          - type: "Feature"
            geometry:
              type: "Point"
              coordinates: [-122.4194, 37.7749]
            properties:
              title: "San Francisco"
```

## Tile Sources

By default, this package uses **MapLibre's free demo tiles** (no API key required). These tiles are:

- ✅ **Free forever** (MapLibre Foundation)
- ✅ **No usage limits** (community-hosted)
- ✅ **No vendor lock-in** (OSS stack)

### Custom Tile Sources

To use your own tiles (Maptiler, Mapbox, self-hosted, etc.), you'll need to modify the provider. We recommend:

1. **Maptiler Free Tier**: 100K map loads/month (sign up at [maptiler.com](https://www.maptiler.com/))
2. **Mapbox Free Tier**: 200K map loads/month (sign up at [mapbox.com](https://www.mapbox.com/))
3. **Self-hosted**: Use [TileServer GL](https://github.com/maptiler/tileserver-gl) + OpenStreetMap data

To use a custom style URL, fork this package or create a custom provider following the same adapter pattern.

## Adapter Pattern

This package follows Stackwright's **adapter pattern** (same as Next.js Image/Link). You can swap map providers with **zero changes** to your YAML content:

**Free tier (this package):**
```typescript
import { registerMapLibreProvider } from '@stackwright/maplibre';
registerMapLibreProvider();
```

**Pro tier (3D globe):**
```typescript
import { registerCesiumProvider } from '@stackwright-pro/cesium';
registerCesiumProvider(); // One line change!
```

Your maps stay identical — the underlying rendering engine changes.

## Troubleshooting

### Map Not Showing

1. **Did you import the CSS?**
   ```typescript
   import '@stackwright/maplibre/dist/styles.css';
   ```

2. **Did you register the provider?**
   ```typescript
   registerMapLibreProvider();
   ```

3. **Is the height set?** Maps need explicit height:
   ```yaml
   height: "500px"
   # or
   height: 500
   ```

### Hydration Errors

If you see hydration mismatches, make sure you're using a recent version of React (^18 or ^19). This package is SSR-safe and includes client-side guards.

### Marker Shapes (status without relying on color alone)

Each marker can set `icon` to one of five shape names: `pin` (default), `circle`,
`triangle`, `diamond`, or `square`. This lets content authors (or generated
content like `map_pulse`) convey status via shape *and* color instead of color
alone — WCAG SC 1.4.1 (Use of Color). Unknown or missing `icon` values render
as `pin`; the provider never throws on an unrecognized shape name.

```yaml
markers:
  - lat: 37.7749
    lng: -122.4194
    label: "Vessel A"
    color: "status-ok"
    icon: "circle"   # underway
  - lat: 37.8044
    lng: -122.2712
    label: "Vessel B"
    color: "status-danger"
    icon: "triangle" # moored
```

Shapes are rendered as small SVGs (`MarkerIcon`, exported from this package)
and kept visually consistent with the shapes `@stackwright-pro/cesium` renders
for the same `marker.icon` value, so swapping providers doesn't change what a
marker's status looks like.

## Colors: tokens everywhere

**Every color field this provider accepts — `marker.color`, `layer.style.color`,
`layer.style.fillColor` — should be a theme token** (`status-ok`, `brand-primary`,
a bare `ThemeColors` key like `primary`, or an explicit `--sw-color-*`/`var(...)`
reference), never raw hex. This closes the G3/G7 failure signature where a raw
`#16a34a` got hand-copied into `colorMap` because "MapLibre can't consume
tokens" — as of `7.2.0`, it can; the framework resolves them for you, per
surface:

- **Markers** are real DOM `<svg>` elements, so tokens resolve for free via
  CSS custom properties: `toCssColor('status-ok')` →
  `var(--sw-color-status-ok)`, and the browser keeps it live across
  light/dark theme changes. Literal colors (`#22c55e`) and existing
  `var(...)` references pass through unchanged.
- **Layers** (`polyline`/`polygon`/`geojson`) go through maplibre-gl `paint`
  properties, which need a literal CSS color — `var()` doesn't work there.
  `resolveTokenColor()` reads the token's `--sw-color-*` custom property via
  `getComputedStyle` once, at layer-build time, and bakes in the literal
  value. **Known limitation:** this provider doesn't currently listen for
  live theme/color-mode changes, so layer colors resolve once per render
  (effectively once at mount, unless `config.layers` itself changes) rather
  than reacting to a color-mode toggle the way marker `var()` colors do.

```yaml
layers:
  - type: polygon
    data: [...]
    style:
      fillColor: "brand-primary"   # was raw hex before 7.2.0 — now a token
      color: "brand-primary"
```

**Unresolvable token?** The map never crashes. A layer with a token that has
no matching `--sw-color-*` custom property falls back to a visible default
color, logs `console.error` naming the token and the surface, and shows a
small red error strip across the top of the map (mirrors
`@stackwright-pro/cesium`'s `layerErrors` overlay). Markers can't hit this
failure mode at all — an unresolved `var()` is just invalid CSS, so the SVG
silently falls back to its initial fill rather than throwing.

Token → custom-property naming exactly mirrors `@stackwright-pro/cesium`'s
`resolveTokenColor` (`--sw-color-<kebab-case-token>`), and matches what
`@stackwright/themes`' `ThemeProvider` actually injects at `:root` (the OSS
12 base/foreground keys) plus whatever a pro plugin's `_theme-tokens.css`
extends the vocabulary with (`status-ok`, `brand-primary`, etc. — see
`@stackwright/build-scripts`' `validateColorRefs.ts`).

## License

- **This package**: MIT
- **MapLibre GL**: BSD-3-Clause
- **react-map-gl**: MIT

No proprietary licenses, no vendor lock-in. Truly open source.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repository root.

## Support

- **Issues**: [GitHub Issues](https://github.com/Per-Aspera-LLC/stackwright/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Per-Aspera-LLC/stackwright/discussions)
- **Pro support**: Email pro@stackwright.com

## Roadmap

- [x] Per-marker shapes for non-color status conveyance (`marker.icon`, swp-ndvv.17)
- [x] Theme-token color resolution for markers + layers (`colors.ts`, G7 pivot fix)
- [ ] Custom marker icons (via icon registry)
- [ ] Clustering for large marker sets
- [ ] Heatmap layers
- [ ] 3D building extrusion
- [ ] Offline tile caching

Want to contribute? PRs welcome! 🎉
