import { describe, it, expect } from 'vitest';
import { mapMarkerSchema, mapLayerSchema, mapContentSchema } from '../src/types/content';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SF = { lat: 37.7749, lng: -122.4194 };
const NYC = { lat: 40.7128, lng: -74.006 };

const baseMap = {
  type: 'map' as const,
  label: 'office-map',
  center: SF,
  zoom: 12,
};

// ---------------------------------------------------------------------------
// mapMarkerSchema
// ---------------------------------------------------------------------------

describe('mapMarkerSchema', () => {
  it('accepts a valid marker with required fields only', () => {
    const result = mapMarkerSchema.safeParse({ lat: SF.lat, lng: SF.lng, label: 'SF HQ' });
    expect(result.success).toBe(true);
  });

  it('accepts a marker with all optional fields populated', () => {
    const result = mapMarkerSchema.safeParse({
      lat: SF.lat,
      lng: SF.lng,
      label: 'SF HQ',
      popup: '123 Market St',
      icon: 'map-pin',
      altitude: 50,
      color: '#FF5733',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a marker missing lat', () => {
    const result = mapMarkerSchema.safeParse({ lng: SF.lng, label: 'SF HQ' });
    expect(result.success).toBe(false);
  });

  it('rejects a marker missing lng', () => {
    const result = mapMarkerSchema.safeParse({ lat: SF.lat, label: 'SF HQ' });
    expect(result.success).toBe(false);
  });

  it('rejects a marker missing label', () => {
    const result = mapMarkerSchema.safeParse({ lat: SF.lat, lng: SF.lng });
    expect(result.success).toBe(false);
  });

  it('rejects a marker with non-numeric lat', () => {
    const result = mapMarkerSchema.safeParse({ lat: 'north', lng: SF.lng, label: 'Bad' });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// mapLayerSchema
// ---------------------------------------------------------------------------

describe('mapLayerSchema', () => {
  it('accepts a valid polyline layer', () => {
    const result = mapLayerSchema.safeParse({
      type: 'polyline',
      data: [
        [SF.lat, SF.lng],
        [NYC.lat, NYC.lng],
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid polygon layer', () => {
    const result = mapLayerSchema.safeParse({
      type: 'polygon',
      data: [
        [SF.lat, SF.lng],
        [NYC.lat, NYC.lng],
        [34.0522, -118.2437],
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid geojson layer', () => {
    const result = mapLayerSchema.safeParse({
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid layer type', () => {
    const result = mapLayerSchema.safeParse({ type: 'heatmap', data: {} });
    expect(result.success).toBe(false);
  });

  it('data accepts a complex GeoJSON FeatureCollection object (z.unknown())', () => {
    // The whole point of z.unknown() vs z.any(): any value passes at the schema
    // boundary; the consumer must narrow before using it. This test confirms a
    // realistic GeoJSON payload is accepted without Zod rejecting it.
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [SF.lng, SF.lat] },
          properties: { name: 'SF HQ', priority: 1, tags: ['office', 'main'] },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [SF.lng, SF.lat],
              [NYC.lng, NYC.lat],
            ],
          },
          properties: null,
        },
      ],
    };
    const result = mapLayerSchema.safeParse({ type: 'geojson', data: geojson });
    expect(result.success).toBe(true);
  });

  it('accepts a layer with all optional style fields', () => {
    const result = mapLayerSchema.safeParse({
      type: 'polyline',
      data: [
        [1, 2],
        [3, 4],
      ],
      style: {
        color: '#FF0000',
        width: 3,
        opacity: 0.8,
        fillColor: '#FFAAAA',
        fillOpacity: 0.3,
      },
      label: 'Route A',
    });
    expect(result.success).toBe(true);
  });

  it('optional fields (style, label) are truly optional', () => {
    const result = mapLayerSchema.safeParse({ type: 'polygon', data: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.style).toBeUndefined();
      expect(result.data.label).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// mapContentSchema
// ---------------------------------------------------------------------------

describe('mapContentSchema', () => {
  it('accepts a fully valid map content item', () => {
    const result = mapContentSchema.safeParse({
      ...baseMap,
      markers: [{ lat: SF.lat, lng: SF.lng, label: 'HQ', popup: '123 Market St' }],
      layers: [
        {
          type: 'polyline',
          data: [
            [SF.lat, SF.lng],
            [NYC.lat, NYC.lng],
          ],
        },
      ],
      view: 'map',
      terrain: false,
      height: '500px',
      width: '100%',
    });
    expect(result.success).toBe(true);
  });

  it('accepts the minimum required fields only', () => {
    const result = mapContentSchema.safeParse(baseMap);
    expect(result.success).toBe(true);
  });

  it('rejects when center is missing', () => {
    const result = mapContentSchema.safeParse({ type: 'map', label: 'no-center', zoom: 12 });
    expect(result.success).toBe(false);
  });

  it('rejects when zoom is missing', () => {
    const result = mapContentSchema.safeParse({ type: 'map', label: 'no-zoom', center: SF });
    expect(result.success).toBe(false);
  });

  it('rejects zoom below 0', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, zoom: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects zoom above 20', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, zoom: 21 });
    expect(result.success).toBe(false);
  });

  it('accepts zoom at boundary values 0 and 20', () => {
    expect(mapContentSchema.safeParse({ ...baseMap, zoom: 0 }).success).toBe(true);
    expect(mapContentSchema.safeParse({ ...baseMap, zoom: 20 }).success).toBe(true);
  });

  it('rejects when label is missing', () => {
    const result = mapContentSchema.safeParse({ type: 'map', center: SF, zoom: 12 });
    expect(result.success).toBe(false);
  });

  it('all optional fields are truly optional', () => {
    const result = mapContentSchema.safeParse(baseMap);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.markers).toBeUndefined();
      expect(result.data.layers).toBeUndefined();
      expect(result.data.view).toBeUndefined();
      expect(result.data.terrain).toBeUndefined();
      expect(result.data.height).toBeUndefined();
      expect(result.data.width).toBeUndefined();
    }
  });

  it('accepts view: "map"', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, view: 'map' });
    expect(result.success).toBe(true);
  });

  it('accepts view: "globe"', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, view: 'globe' });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid view value', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, view: 'satellite' });
    expect(result.success).toBe(false);
  });

  it('accepts numeric height and width', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, height: 400, width: 800 });
    expect(result.success).toBe(true);
  });

  it('accepts string height and width', () => {
    const result = mapContentSchema.safeParse({ ...baseMap, height: '400px', width: '80%' });
    expect(result.success).toBe(true);
  });

  it('preserves optional color and background from baseContentSchema', () => {
    const result = mapContentSchema.safeParse({
      ...baseMap,
      color: '#ffffff',
      background: '#000000',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe('#ffffff');
      expect(result.data.background).toBe('#000000');
    }
  });
});
