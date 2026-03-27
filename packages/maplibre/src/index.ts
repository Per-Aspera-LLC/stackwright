/**
 * @stackwright/maplibre — Free tier map adapter for Stackwright
 *
 * **License:** BSD-3-Clause (MapLibre GL) + MIT (this package)
 * **Features:**
 * - 2D interactive maps
 * - No API keys required (uses MapLibre demo tiles)
 * - Markers, polylines, polygons, GeoJSON
 * - SSR-safe for Next.js
 * - Responsive design
 *
 * **Installation:**
 *
 * ```bash
 * pnpm add @stackwright/maplibre
 * ```
 *
 * **Usage in Next.js:**
 *
 * ```typescript
 * // pages/_app.tsx
 * import { registerMapLibreProvider } from '@stackwright/maplibre';
 * import '@stackwright/maplibre/dist/styles.css';
 * import { registerNextJSComponents } from '@stackwright/nextjs';
 *
 * registerNextJSComponents();
 * registerMapLibreProvider();
 * ```
 *
 * **YAML Example:**
 *
 * ```yaml
 * content:
 *   content_items:
 *     - type: map
 *       label: "Office locations"
 *       center: { lat: 37.7749, lng: -122.4194 }
 *       zoom: 12
 *       markers:
 *         - lat: 37.7749
 *           lng: -122.4194
 *           label: "San Francisco HQ"
 * ```
 *
 * @packageDocumentation
 */

import { registerMapProvider } from '@stackwright/core';
import { MapLibreProvider } from './MapLibreProvider.js';

export { MapLibreProvider } from './MapLibreProvider.js';

/**
 * Register MapLibreProvider as the active map adapter.
 *
 * Call this in `_app.tsx` (Pages Router) or `layout.tsx` (App Router)
 * alongside `registerNextJSComponents()`:
 *
 * ```typescript
 * import { registerMapLibreProvider } from '@stackwright/maplibre';
 * import '@stackwright/maplibre/dist/styles.css';
 *
 * registerMapLibreProvider();
 * ```
 *
 * **Swapping to pro 3D provider:**
 *
 * ```typescript
 * // Switch from MapLibre (2D) to Cesium (3D globe)
 * import { registerCesiumProvider } from '@stackwright-pro/cesium';
 * registerCesiumProvider();
 * ```
 *
 * This is a one-line change — your YAML content, components, and pages
 * stay identical. That's the power of the adapter pattern!
 */
export function registerMapLibreProvider(): void {
  registerMapProvider(MapLibreProvider);
}

export default MapLibreProvider;
