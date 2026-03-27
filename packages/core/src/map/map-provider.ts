import type React from 'react';

/**
 * MapMarker — Represents a point of interest on a map.
 *
 * @example
 * ```yaml
 * markers:
 *   - lat: 37.7749
 *     lng: -122.4194
 *     label: "San Francisco"
 *     popup: "Golden Gate City"
 *     icon: "map-pin"
 * ```
 */
export interface MapMarker {
  /** Latitude (WGS84) */
  lat: number;
  /** Longitude (WGS84) */
  lng: number;
  /** Label for the marker */
  label: string;
  /** Optional popup content (HTML or plain text) */
  popup?: string;
  /** Optional icon name (registered via icon registry) */
  icon?: string;
  /** Optional altitude (meters) - for 3D providers like Cesium */
  altitude?: number;
  /** Optional marker color */
  color?: string;
}

/**
 * MapLayerType — Types of geographic layers supported.
 *
 * - `polyline`: Connected line segments (routes, paths)
 * - `polygon`: Closed shapes (boundaries, regions)
 * - `geojson`: GeoJSON feature collection (complex geometries)
 */
export type MapLayerType = 'polyline' | 'polygon' | 'geojson';

/**
 * MapLayer — A geographic overlay (route, boundary, heatmap, etc.)
 *
 * @example
 * ```yaml
 * layers:
 *   - type: polyline
 *     data: [[37.7749, -122.4194], [40.7128, -74.0060]]
 *     style:
 *       color: "#FF5733"
 *       width: 3
 * ```
 */
export interface MapLayer {
  /** Layer type (polyline, polygon, geojson) */
  type: MapLayerType;
  /** Layer data - format depends on type */
  data: any;
  /** Optional styling configuration */
  style?: {
    color?: string;
    width?: number;
    opacity?: number;
    fillColor?: string;
    fillOpacity?: number;
  };
  /** Optional label for the layer */
  label?: string;
}

/**
 * MapConfig — Configuration for a map instance.
 *
 * This is the core interface that all MapProvider implementations
 * must understand. It's designed to be provider-agnostic, working
 * equally well with 2D providers (MapLibre, Mapbox) and 3D providers
 * (Cesium, deck.gl).
 *
 * @example
 * ```yaml
 * type: map
 * label: "Office locations"
 * center: { lat: 37.7749, lng: -122.4194 }
 * zoom: 12
 * markers:
 *   - lat: 37.7749
 *     lng: -122.4194
 *     label: "HQ"
 * ```
 */
export interface MapConfig {
  /** Map center coordinates */
  center: { lat: number; lng: number };
  /** Zoom level (0-20, provider-dependent) */
  zoom: number;
  /** Optional markers/pins */
  markers?: MapMarker[];
  /** Optional geographic layers */
  layers?: MapLayer[];
  /** Optional view mode (2D map vs 3D globe) - for Cesium */
  view?: 'map' | 'globe';
  /** Optional terrain elevation - for 3D providers */
  terrain?: boolean;
}

/**
 * MapProviderProps — Props passed to MapProvider components.
 *
 * The adapter pattern: users register a MapProvider (MapLibre, Cesium,
 * etc.) that implements this interface. The core Map component calls
 * the registered provider with these props.
 */
export interface MapProviderProps {
  /** Map configuration (center, zoom, markers, layers) */
  config: MapConfig;
  /** Optional fixed height (CSS value or number in pixels) */
  height?: string | number;
  /** Optional fixed width (CSS value or number in pixels) */
  width?: string | number;
  /** Optional CSS class name */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * MapProvider — The adapter interface.
 *
 * This is what all map provider packages (@stackwright/maplibre,
 * @stackwright-pro/cesium, etc.) must implement. It's a React component
 * that renders a map using the provider's underlying library.
 *
 * **Why this pattern?**
 *
 * 1. **No vendor lock-in**: Swap MapLibre ↔ Cesium ↔ Mapbox with one line
 * 2. **License safety**: Keep OSS (MapLibre) and commercial (Cesium) separate
 * 3. **Bundle optimization**: Only ship the map library you use
 * 4. **Future-proof**: Add deck.gl, custom WebGL, etc. later
 *
 * **Registration pattern** (mirror of Next.js Image/Link):
 *
 * ```typescript
 * // In _app.tsx or layout.tsx:
 * import { registerMapProvider } from '@stackwright/core';
 * import { MapLibreProvider } from '@stackwright/maplibre';
 *
 * registerMapProvider(MapLibreProvider);
 * ```
 *
 * @see https://nextjs.org/docs/pages/api-reference/components/image
 */
export type MapProvider = React.ComponentType<MapProviderProps>;

/**
 * StackwrightMapProps — Additional Stackwright-specific props for the Image adapter.
 *
 * This extends the provider props with Stackwright theming and accessibility.
 */
export interface StackwrightMapProps extends MapProviderProps {
  /** Theme color override */
  color?: string;
  /** Background color override */
  background?: string;
  /** Accessibility label */
  'aria-label'?: string;
}
