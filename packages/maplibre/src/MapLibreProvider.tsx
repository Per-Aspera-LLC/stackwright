import React, { useState, useCallback, useEffect } from 'react';
import MapGL, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { MapProviderProps, MapMarker } from '@stackwright/core';
import type { LayerProps } from 'react-map-gl/maplibre';

/**
 * MapLibreProvider — Free tier map adapter using MapLibre GL.
 *
 * **Features:**
 * - 2D interactive maps with pan/zoom
 * - Markers with click-to-show popups
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

  return (
    <div className={className} style={{ ...style, width, height, position: 'relative' }}>
      <MapGL
        initialViewState={{
          latitude: config.center.lat,
          longitude: config.center.lng,
          zoom: config.zoom,
        }}
        style={{ width: '100%', height: '100%', borderRadius: '8px' }}
        mapStyle={mapStyle}
        attributionControl={true}
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
                fontSize: '24px',
                transform: 'translate(-50%, -100%)',
              }}
              title={marker.label}
            >
              📍
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
                'line-color': layer.style?.color || '#FF5733',
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
                'fill-color': layer.style?.fillColor || layer.style?.color || '#3388ff',
                'fill-opacity': layer.style?.fillOpacity || 0.4,
                'fill-outline-color': layer.style?.color || '#3388ff',
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
                'fill-color': layer.style?.fillColor || layer.style?.color || '#3388ff',
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
    </div>
  );
};

export default MapLibreProvider;
