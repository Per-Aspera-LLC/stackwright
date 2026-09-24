import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MarkerIcon, normalizeMarkerShape, DEFAULT_MARKER_COLOR } from '../src/marker-icon';
import { toCssColor } from '../src/colors';

describe('normalizeMarkerShape (swp-ndvv.17)', () => {
  it('passes through each known shape unchanged', () => {
    expect(normalizeMarkerShape('pin')).toBe('pin');
    expect(normalizeMarkerShape('circle')).toBe('circle');
    expect(normalizeMarkerShape('triangle')).toBe('triangle');
    expect(normalizeMarkerShape('diamond')).toBe('diamond');
    expect(normalizeMarkerShape('square')).toBe('square');
  });

  it('falls back to pin for undefined', () => {
    expect(normalizeMarkerShape(undefined)).toBe('pin');
  });

  it('falls back to pin for an unknown/typo shape name (never throws)', () => {
    expect(() => normalizeMarkerShape('hexagon')).not.toThrow();
    expect(normalizeMarkerShape('hexagon')).toBe('pin');
    expect(normalizeMarkerShape('')).toBe('pin');
  });
});

describe('MarkerIcon', () => {
  it('renders an svg with a data-marker-shape attribute per known shape', () => {
    for (const shape of ['pin', 'circle', 'triangle', 'diamond', 'square'] as const) {
      const { container } = render(<MarkerIcon shape={shape} color="#22c55e" />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('data-marker-shape')).toBe(shape);
    }
  });

  it('renders as pin when shape is unknown or missing, and never throws', () => {
    expect(() => render(<MarkerIcon shape="not-a-real-shape" />)).not.toThrow();
    const { container } = render(<MarkerIcon />);
    expect(container.querySelector('svg')?.getAttribute('data-marker-shape')).toBe('pin');
  });

  it('applies the given color to the shape fill, defaulting when unset', () => {
    const { container } = render(<MarkerIcon shape="circle" color="#0000ff" />);
    const filled = container.querySelector('circle[fill="#0000ff"]');
    expect(filled).not.toBeNull();

    const { container: defaultColorContainer } = render(<MarkerIcon shape="circle" />);
    expect(
      defaultColorContainer.querySelector(`circle[fill="${DEFAULT_MARKER_COLOR}"]`)
    ).not.toBeNull();
  });

  it('renders a var(--sw-color-*) fill when the color is resolved via toCssColor first (G7 pivot fix)', () => {
    // This is exactly the MapLibreProvider call site: MarkerIcon never sees
    // a raw token, it sees whatever toCssColor() produced.
    const { container } = render(<MarkerIcon shape="circle" color={toCssColor('status-ok')} />);
    const filled = container.querySelector('circle[fill="var(--sw-color-status-ok)"]');
    expect(filled).not.toBeNull();
  });

  it('renders an existing var() reference through toCssColor unchanged', () => {
    const { container } = render(
      <MarkerIcon shape="square" color={toCssColor('var(--sw-color-primary)')} />
    );
    expect(container.querySelector('rect[fill="var(--sw-color-primary)"]')).not.toBeNull();
  });

  it('renders a literal hex color through toCssColor unchanged', () => {
    const { container } = render(<MarkerIcon shape="diamond" color={toCssColor('#16a34a')} />);
    expect(container.querySelector('path[fill="#16a34a"]')).not.toBeNull();
  });

  it('keeps a white inner accent on every shape for non-hue distinguishability', () => {
    for (const shape of ['pin', 'circle', 'triangle', 'diamond', 'square'] as const) {
      const { container } = render(<MarkerIcon shape={shape} color="#22c55e" />);
      const whiteAccent = container.querySelector('[fill="white"]') !== null;
      expect(whiteAccent).toBe(true);
    }
  });
});
