import React from 'react';

/**
 * MarkerIcon — Renders `MapMarker.icon` as a small SVG shape (swp-ndvv.17).
 *
 * WCAG SC 1.4.1 (Use of Color): map_pulse can vary marker *shape* per status
 * in addition to color, so status is never conveyed by hue alone. This
 * mirrors the shape set + fallback rules shipped by
 * `@stackwright-pro/cesium`'s `createMarkerCanvas()` so a generated app
 * looks the same whether it's registered on the free 2D provider (this
 * package) or the pro 3D globe provider.
 *
 * Canonical shapes: `pin` | `circle` | `triangle` | `diamond` | `square`.
 * Unknown/missing values fall back to `pin` — this never throws, it just
 * degrades visibly (same philosophy as the OSS icon registry's fallback
 * icon).
 */
export type MarkerShape = 'pin' | 'circle' | 'triangle' | 'diamond' | 'square';

const KNOWN_SHAPES: ReadonlySet<string> = new Set([
  'pin',
  'circle',
  'triangle',
  'diamond',
  'square',
]);

/** Default marker fill color when `MapMarker.color` is not set. */
export const DEFAULT_MARKER_COLOR = '#ef4444';

/** Normalizes an arbitrary `MapMarker.icon` value to a known shape, falling back to 'pin'. */
export function normalizeMarkerShape(shape: string | undefined): MarkerShape {
  if (shape && KNOWN_SHAPES.has(shape)) return shape as MarkerShape;
  return 'pin';
}

/**
 * Inner SVG markup for a shape. Every shape keeps a white inner dot/fill on
 * top of `color` so shapes stay distinguishable from each other even for
 * viewers who can't rely on hue alone.
 */
function shapeMarkup(shape: MarkerShape, color: string): React.ReactNode {
  switch (shape) {
    case 'circle':
      return (
        <>
          <circle cx="12" cy="12" r="9" fill={color} />
          <circle cx="12" cy="12" r="3" fill="white" />
        </>
      );
    case 'triangle':
      return (
        <>
          <path d="M12 3 L21 19 L3 19 Z" fill={color} />
          <circle cx="12" cy="15" r="2.5" fill="white" />
        </>
      );
    case 'diamond':
      return (
        <>
          <path d="M12 2 L22 12 L12 22 L2 12 Z" fill={color} />
          <circle cx="12" cy="12" r="2.5" fill="white" />
        </>
      );
    case 'square':
      return (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" fill={color} />
          <circle cx="12" cy="12" r="2.5" fill="white" />
        </>
      );
    case 'pin':
    default:
      return (
        <>
          <path
            d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
            fill={color}
          />
          <circle cx="12" cy="8" r="2.5" fill="white" />
        </>
      );
  }
}

export interface MarkerIconProps {
  /** `MapMarker.icon` value — a shape name, or undefined/unknown for the 'pin' fallback. */
  shape?: string;
  /** `MapMarker.color` value, or `DEFAULT_MARKER_COLOR` if unset. */
  color?: string;
  /** Rendered pixel size (square). Defaults to 32, matching the pro Cesium billboard size. */
  size?: number;
}

/**
 * MarkerIcon — the shape rendered inside each MapLibre `<Marker>`.
 *
 * All shapes share a `0 0 24 24` viewBox with the pin's point anchored at
 * the bottom, so `anchor="bottom"` on the parent `<Marker>` lines up the
 * same way for every shape.
 */
export const MarkerIcon: React.FC<MarkerIconProps> = ({
  shape,
  color = DEFAULT_MARKER_COLOR,
  size = 32,
}) => {
  const normalizedShape = normalizeMarkerShape(shape);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={`${normalizedShape} marker`}
      data-marker-shape={normalizedShape}
    >
      {shapeMarkup(normalizedShape, color)}
    </svg>
  );
};

export default MarkerIcon;
