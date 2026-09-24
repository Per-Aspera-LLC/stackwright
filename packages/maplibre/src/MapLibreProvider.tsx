import React, { useState, useCallback, useEffect, useRef } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapProviderProps, MapMarker } from '@stackwright/core';
import type { LayerProps } from 'react-map-gl/maplibre';
import { MarkerIcon, DEFAULT_MARKER_COLOR } from './marker-icon.js';
import { toCssColor, resolveTokenColor, describeColorError } from './colors.js';

/**
 * Resolves a layer color (`style.color`/`style.fillColor`) against the
 * `--sw-color-*` custom properties, mirroring cesium's per-call-site
 * try/catch (swp-0ifi): an unresolvable token never crashes the map, it
 * falls back to `fallback` and reports through `onError` (console.error +
 * the error-strip overlay) instead.
 */
export function resolveLayerColor(
  raw: string | undefined,
  fallback: string,
  context: string,
  el: Element | undefined,
  onError: (message: string) => void
): string {
  if (!raw) return fallback;
  try {
    return resolveTokenColor(raw, { el, context });
  } catch (err) {
    const message = describeColorError(context, err);
    console.error(`[@stackwright/maplibre] ${message}`);
    onError(message);
    return fallback;
  }
}

/**
 * MapLibreProvider — Free tier map adapter using MapLibre GL.
 *
 * **Features:**
 * - 2D interactive maps with pan/zoom
 * - Markers with click-to-show popups
 * - Per-marker shape via `marker.icon` (`pin` | `circle` | `triangle` | `diamond` | `square`,
 *   unknown/absent falls back to `pin`) so status can be conveyed by more than color alone
 *   (WCAG SC 1.4.1 — swp-ndvv.17). See `./marker-icon.tsx`.
 * - Polyline and polygon layers
 * - GeoJSON support
 * - Free MapLibre demo tiles (no API key required)
 * - SSR-safe for Next.js
 * - Responsive (320px to 1440px)
 *
 * **License:** BSD-3-Clause (MapLibre GL)
 * **Vendor lock-in:** None (can swap to Mapbox, Maptiler, etc.)
 *
 * **Usage:**
 *
 * ```typescript
 * import { registerMapLibreProvider } from '@stackwright/maplibre';
 * import '@stackwright/maplibre/dist/styles.css';
 *
 * registerMapLibreProvider();
 * ```
 *
 * @see https://maplibre.org/maplibre-gl-js/docs/
 */
export const MapLibreProvider: React.FC<MapProviderProps> = ({
  config,
  height = '100%',
  width = '100%',
  className,
  style,
}) => {
  const [popupInfo, setPopupInfo] = useState<MapMarker | null>(null);
  const [isClient, setIsClient] = useState(false);
  // Element custom-property colors (layers) are read against, via
  // resolveLayerColor -> resolveTokenColor. Falls back to
  // document.documentElement (where @stackwright/themes injects
  // --sw-color-* vars) until the ref attaches after first client render.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // SSR safety: Only render map on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const onMarkerClick = useCallback((marker: MapMarker) => {
    // Toggle popup: close if already open on this marker, otherwise open
    setPopupInfo((current) =>
      current?.label === marker.label && current?.lat === marker.lat ? null : marker
    );
  }, []);

  const onPopupClose = useCallback(() => {
    setPopupInfo(null);
  }, []);

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div
        className={className}
        style={{
          ...style,
          width,
          height,
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }}
      >
        <span style={{ color: '#666', fontSize: '14px' }}>Loading map...</span>
      </div>
    );
  }

  // MapLibre demo tile server (free, no API key needed)
  const mapStyle = 'https://demotiles.maplibre.org/style.json';

  // Reset per render: layer color resolution below (config.layers?.map)
  // pushes into this array before the error-strip JSX reads it — plain
  // local state (not React state), since it's produced and consumed
  // synchronously within this single render pass. See colors.ts docblock
  // for why layers (unlike markers) need eager resolution instead of var().
  const colorErrors: string[] = [];
  const containerEl = containerRef.current ?? undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, width, height, position: 'relative' }}
    >
      <MapGL
        initialViewState={{
          latitude: config.center.lat,
          longitude: config.center.lng,
          zoom: config.zoom,
        }}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        mapStyle={mapStyle}
      >
        {/* Navigation controls (zoom, rotate) */}
        <NavigationControl position="top-right" />

        {/* Render markers */}
        {config.markers?.map((marker, index) => (
          <Marker
            key={`${marker.label}-${index}`}
            latitude={marker.lat}
            longitude={marker.lng}
            anchor="bottom"
            onClick={() => onMarkerClick(marker)}
          >
            <div
              style={{
                cursor: 'pointer',
                transform: 'translate(-50%, -100%)',
              }}
              title={marker.label}
            >
              <MarkerIcon
                shape={marker.icon}
                color={toCssColor(marker.color) ?? DEFAULT_MARKER_COLOR}
              />
            </div>
          </Marker>
        ))}

        {/* Popup for clicked marker */}
        {popupInfo && (
          <Popup
            latitude={popupInfo.lat}
            longitude={popupInfo.lng}
            anchor="top"
            onClose={onPopupClose}
            closeOnClick={false}
            style={{ maxWidth: '300px' }}
          >
            <div style={{ padding: '4px 0' }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>{popupInfo.label}</strong>
              {popupInfo.popup && (
                <div style={{ fontSize: '14px', color: '#666' }}>{popupInfo.popup}</div>
              )}
            </div>
          </Popup>
        )}

        {/* Render layers (polylines, polygons, GeoJSON) */}
        {config.layers?.map((layer, index) => {
          if (layer.type === 'polyline') {
            // Polyline layer (routes, paths)
            const geojson = {
              type: 'Feature' as const,
              geometry: {
                type: 'LineString' as const,
                coordinates: layer.data as number[][], // [[lng, lat], [lng, lat], ...]
              },
              properties: {},
            };

            const layerStyle: LayerProps = {
              id: `polyline-${index}`,
              type: 'line',
              paint: {
                'line-color': resolveLayerColor(
                  layer.style?.color,
                  '#FF5733',
                  `layer polyline-${index} style.color`,
                  containerEl,
                  (message) => colorErrors.push(message)
                ),
                'line-width': layer.style?.width || 3,
                'line-opacity': layer.style?.opacity || 1,
              },
            };

            return (
              <Source key={`polyline-${index}`} type="geojson" data={geojson}>
                <Layer {...layerStyle} />
              </Source>
            );
          }

          if (layer.type === 'polygon') {
            // Polygon layer (boundaries, regions)
            const geojson = {
              type: 'Feature' as const,
              geometry: {
                type: 'Polygon' as const,
                coordinates: [layer.data] as number[][][], // [[[lng, lat], [lng, lat], ...]]
              },
              properties: {},
            };

            const layerStyle: LayerProps = {
              id: `polygon-${index}`,
              type: 'fill',
              paint: {
                'fill-color': resolveLayerColor(
                  layer.style?.fillColor || layer.style?.color,
                  '#3388ff',
                  `layer polygon-${index} style.fillColor`,
                  containerEl,
                  (message) => colorErrors.push(message)
                ),
                'fill-opacity': layer.style?.fillOpacity || 0.4,
                'fill-outline-color': resolveLayerColor(
                  layer.style?.color,
                  '#3388ff',
                  `layer polygon-${index} style.color (outline)`,
                  containerEl,
                  (message) => colorErrors.push(message)
                ),
              },
            };

            return (
              <Source key={`polygon-${index}`} type="geojson" data={geojson}>
                <Layer {...layerStyle} />
              </Source>
            );
          }

          if (layer.type === 'geojson') {
            // GeoJSON layer (arbitrary geometries)
            const layerStyle: LayerProps = {
              id: `geojson-${index}`,
              type: 'fill',
              paint: {
                'fill-color': resolveLayerColor(
                  layer.style?.fillColor || layer.style?.color,
                  '#3388ff',
                  `layer geojson-${index} style.fillColor`,
                  containerEl,
                  (message) => colorErrors.push(message)
                ),
                'fill-opacity': layer.style?.fillOpacity || 0.4,
              },
            };

            return (
              <Source key={`geojson-${index}`} type="geojson" data={layer.data}>
                <Layer {...layerStyle} />
              </Source>
            );
          }

          return null;
        })}
      </MapGL>

      {/* Color-token resolution error strip (G7 pivot fix) — an unresolvable
          layer token never crashes the map; it falls back to a visible
          default color and surfaces here, mirroring cesium's layerErrors
          overlay (swp-0ifi). Markers can't land here: toCssColor() never
          throws (see colors.ts). */}
      {colorErrors.length > 0 && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(185, 28, 28, 0.92)',
            color: 'white',
            fontSize: '12px',
            padding: '8px 12px',
            zIndex: 20,
            fontFamily: 'monospace',
          }}
        >
          {colorErrors.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapLibreProvider;
