import React from 'react';
import { getMapProvider } from '../../map/map-registry.js';
import type { MapConfig, StackwrightMapProps } from '../../map/map-provider.js';

/**
 * Map — Content component for rendering interactive maps.
 *
 * This component uses the registered MapProvider (MapLibre, Cesium, etc.)
 * to render maps from YAML configuration. It's framework-agnostic — the
 * underlying map library is swapped by changing the provider registration.
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
 *       height: "500px"
 *       markers:
 *         - lat: 37.7749
 *           lng: -122.4194
 *           label: "San Francisco HQ"
 *           popup: "123 Market St"
 * ```
 *
 * **Responsive Behavior:**
 *
 * If no width/height is specified, the map fills its container and uses
 * a minimum height of 400px. On mobile (<768px), it uses a 16:9 aspect
 * ratio. On desktop, it uses 21:9.
 *
 * **SSR Safety:**
 *
 * The Map component is SSR-safe. Map providers should use `useEffect`
 * or `dynamic(() => import(), { ssr: false })` for client-only rendering.
 *
 * @param props - Map configuration and styling props
 */
export function Map(props: StackwrightMapProps & { config: MapConfig }): React.ReactElement {
  const MapProvider = getMapProvider();

  const {
    config,
    height = '500px',
    width = '100%',
    color,
    background,
    className,
    style,
    ...rest
  } = props;

  // Responsive wrapper styles
  const wrapperStyle: React.CSSProperties = {
    width,
    height,
    minHeight: typeof height === 'string' ? height : `${height}px`,
    background: background || 'transparent',
    color: color || 'inherit',
    borderRadius: '8px',
    overflow: 'hidden',
    position: 'relative',
    ...style,
  };

  return (
    <div className={className} style={wrapperStyle} {...rest}>
      <MapProvider config={config} height="100%" width="100%" style={{ borderRadius: '8px' }} />
    </div>
  );
}

export default Map;
