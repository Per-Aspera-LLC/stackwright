import type { MapProvider } from './map-provider.js';

let provider: MapProvider | null = null;

/**
 * Register the active MapProvider.
 *
 * Call this in `_app.tsx` (Pages Router) or `layout.tsx` (App Router)
 * alongside `registerNextJSComponents()`:
 *
 * ```ts
 * import { registerMapProvider } from '@stackwright/core';
 * import { MapLibreProvider } from '@stackwright/maplibre';
 *
 * registerMapProvider(MapLibreProvider);
 * ```
 *
 * **Swapping providers is a one-line change:**
 *
 * ```ts
 * // Switch from free 2D to pro 3D:
 * import { CesiumProvider } from '@stackwright-pro/cesium';
 * registerMapProvider(CesiumProvider);
 * ```
 *
 * This is the same pattern as Next.js Image/Link — swap the adapter
 * to change underlying implementation. The rest of your application
 * (YAML content, components, pages) stays identical.
 *
 * @param p - The MapProvider component to register
 */
export function registerMapProvider(p: MapProvider): void {
  provider = p;
}

/**
 * Retrieve the registered MapProvider.
 *
 * Throws if no provider has been registered — this is intentional.
 * Registration must be explicit, not implicit via import side effects.
 *
 * **Why throw instead of defaulting?**
 *
 * - **Bundle size**: Don't ship map libraries users don't need
 * - **License clarity**: Keep OSS/commercial boundaries explicit
 * - **Developer control**: Force conscious choice of map provider
 *
 * @returns The registered MapProvider component
 * @throws {Error} If no provider is registered
 */
export function getMapProvider(): MapProvider {
  if (!provider) {
    throw new Error(
      'No MapProvider registered. ' +
        'Call registerMapProvider() in _app.tsx or layout.tsx.\n\n' +
        'Free tier:\n' +
        '  import { registerMapLibreProvider } from "@stackwright/maplibre";\n' +
        '  registerMapLibreProvider();\n\n' +
        'Pro tier:\n' +
        '  import { registerCesiumProvider } from "@stackwright-pro/cesium";\n' +
        '  registerCesiumProvider();'
    );
  }
  return provider;
}

/**
 * Clear the registered provider.
 *
 * Intended for use in tests only, to reset state between test suites.
 * Don't call this in application code.
 */
export function clearMapProvider(): void {
  provider = null;
}
