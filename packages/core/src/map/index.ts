/**
 * Map Adapter System
 *
 * Stackwright's map system uses the adapter pattern (same as Next.js
 * Image/Link/Router) to enable swappable map providers.
 *
 * **Free tier:** @stackwright/maplibre (OSS, BSD-3-Clause, no API keys)
 * **Pro tier:** @stackwright-pro/cesium (3D globe, terrain, enterprise)
 *
 * @packageDocumentation
 */

export * from './map-provider.js';
export * from './map-registry.js';
