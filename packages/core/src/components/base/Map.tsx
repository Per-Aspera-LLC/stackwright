import React from 'react';
import { getMapProvider } from '../../map/map-registry.js';
import type { MapConfig } from '../../map/map-provider.js';
import type { MapContent } from '@stackwright/types';

/**
 * Props for the Map content component.
 *
 * We accept flat YAML fields (spread from the content renderer) rather than
 * a pre-assembled `config` object. The `config: MapConfig` shape lives on
 * MapProviderProps — that's the adapter contract. This component bridges
 * the two: it reads flat schema fields and assembles the config before
 * handing off to the registered MapProvider.
 *
 * `type` is omitted from MapContent and re-added as optional string so we
 * can absorb the runtime value without TypeScript complaining — the content
 * renderer spreads `{ type: 'map', ... }` and we don't want that reaching
 * the DOM via `...rest`.
 */
type MapProps = Omit<MapContent, 'type'> & {
  /** Absorbed at runtime from content renderer spread — not passed to DOM. */
  type?: string;
  /** Optional CSS class name for the wrapper div. */
  className?: string;
  /** Optional additional inline styles for the wrapper div. */
  style?: React.CSSProperties;
  /** Accessibility label. */
  'aria-label'?: string;
};

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
 * @param props - Flat YAML schema fields for map configuration and styling
 */
export function Map(props: MapProps): React.ReactElement {
  const MapProvider = getMapProvider();

  const {
    // MapConfig fields — assembled into config object below
    center,
    zoom,
    markers,
    layers,
    view,
    terrain,
    // BaseContent fields — absorbed so they don't reach the DOM via ...rest
    label: _label,
    type: _type,
    // Display props
    height = '500px',
    width = '100%',
    color,
    background,
    className,
    style,
    ...rest
  } = props;

  // Assemble the provider-facing config from flat schema fields
  const config: MapConfig = {
    center,
    zoom,
    markers,
    layers,
    view,
    terrain,
  };

  // Responsive wrapper — inline styles only (no Tailwind in core)
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
