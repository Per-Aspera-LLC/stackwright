import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Map } from '../../src/components/base/Map';
import { registerMapProvider, clearMapProvider } from '../../src/map/map-registry';
import type { MapProviderProps } from '../../src/map/map-provider';

// ---------------------------------------------------------------------------
// Mock MapProvider
//
// Renders a single div with data-testid="map-provider" and serializes the
// received `config` as `data-config` so tests can assert what the Map
// component assembled and passed down.
// ---------------------------------------------------------------------------

const MockMapProvider = ({ config }: MapProviderProps) => (
  <div data-testid="map-provider" data-config={JSON.stringify(config)} />
);

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

const center = { lat: 37.7749, lng: -122.4194 };
const zoom = 12;

const minProps = { label: 'test-map', center, zoom };

// Helper to grab the parsed config from the mock provider's data attribute.
function getRenderedConfig(): Record<string, unknown> {
  const provider = screen.getByTestId('map-provider');
  return JSON.parse(provider.getAttribute('data-config') ?? '{}');
}

// ---------------------------------------------------------------------------
// Lifecycle — register/clear mock provider around every test
// ---------------------------------------------------------------------------

beforeEach(() => {
  registerMapProvider(MockMapProvider);
});

afterEach(() => {
  clearMapProvider();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Map component — smoke test', () => {
  it('renders without crashing with the minimum valid props', () => {
    render(<Map {...minProps} />);
    expect(screen.getByTestId('map-provider')).toBeInTheDocument();
  });
});

describe('Map component — config assembly (the P0 fix)', () => {
  it('assembles a config object from flat center and zoom props', () => {
    render(<Map {...minProps} />);
    const config = getRenderedConfig();
    // The key invariant: center and zoom must not be undefined in the config.
    // Before the fix, Map expected a pre-built `config` prop — after the fix
    // it builds the config itself from flat YAML fields.
    expect(config.center).toEqual(center);
    expect(config.zoom).toBe(zoom);
  });

  it('forwards optional markers into the assembled config', () => {
    const markers = [{ lat: 37.7749, lng: -122.4194, label: 'SF HQ', popup: '123 Market St' }];
    render(<Map {...minProps} markers={markers} />);
    expect(getRenderedConfig().markers).toEqual(markers);
  });

  it('forwards optional layers into the assembled config', () => {
    const layers = [
      {
        type: 'polyline' as const,
        data: [
          [37.7749, -122.4194],
          [40.7128, -74.006],
        ],
        style: { color: '#FF5733', width: 3 },
      },
    ];
    render(<Map {...minProps} layers={layers} />);
    expect(getRenderedConfig().layers).toEqual(layers);
  });

  it('forwards optional view and terrain into the assembled config', () => {
    render(<Map {...minProps} view="globe" terrain={true} />);
    const config = getRenderedConfig();
    expect(config.view).toBe('globe');
    expect(config.terrain).toBe(true);
  });

  it('forwards all MapConfig fields together', () => {
    const markers = [{ lat: center.lat, lng: center.lng, label: 'Pin' }];
    render(<Map {...minProps} markers={markers} view="map" terrain={false} />);
    const config = getRenderedConfig();
    expect(config.center).toEqual(center);
    expect(config.zoom).toBe(zoom);
    expect(config.markers).toEqual(markers);
    expect(config.view).toBe('map');
    expect(config.terrain).toBe(false);
  });
});

describe('Map component — DOM attribute hygiene', () => {
  it('does not spread label onto the wrapper div', () => {
    const { container } = render(<Map label="should-not-appear" center={center} zoom={zoom} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.getAttribute('label')).toBeNull();
  });

  it('does not spread type onto the wrapper div', () => {
    const { container } = render(<Map label="test" type="map" center={center} zoom={zoom} />);
    const wrapper = container.firstChild as HTMLElement;
    // `type` is a valid HTML attribute on some elements but should be absorbed
    // by the component, not forwarded to the outer div wrapper.
    expect(wrapper.getAttribute('type')).toBeNull();
  });

  it('does not forward label to the inner MapProvider', () => {
    render(<Map label="should-not-appear" center={center} zoom={zoom} />);
    const provider = screen.getByTestId('map-provider');
    expect(provider.getAttribute('label')).toBeNull();
  });

  it('does not forward type to the inner MapProvider', () => {
    render(<Map label="test" type="map" center={center} zoom={zoom} />);
    const provider = screen.getByTestId('map-provider');
    expect(provider.getAttribute('type')).toBeNull();
  });
});

describe('Map component — wrapper dimensions', () => {
  it('applies default 500px height when no height prop is given', () => {
    const { container } = render(<Map {...minProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('500px');
  });

  it('applies default 100% width when no width prop is given', () => {
    const { container } = render(<Map {...minProps} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('100%');
  });

  it('respects an explicit string height prop', () => {
    const { container } = render(<Map {...minProps} height="300px" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.height).toBe('300px');
    expect(wrapper.style.minHeight).toBe('300px');
  });

  it('respects a numeric height prop and sets minHeight in px', () => {
    const { container } = render(<Map {...minProps} height={400} />);
    const wrapper = container.firstChild as HTMLElement;
    // React converts numeric px values to "400px" in inline styles
    expect(wrapper.style.height).toBe('400px');
    expect(wrapper.style.minHeight).toBe('400px');
  });

  it('respects an explicit width prop', () => {
    const { container } = render(<Map {...minProps} width="800px" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('800px');
  });
});

describe('Map component — theming and styling', () => {
  it('applies background color to the wrapper', () => {
    const { container } = render(<Map {...minProps} background="#1a1a2e" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.background).toBe('rgb(26, 26, 46)');
  });

  it('applies color prop to the wrapper', () => {
    const { container } = render(<Map {...minProps} color="#ffffff" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.color).toBe('rgb(255, 255, 255)');
  });

  it('passes className to the wrapper div', () => {
    const { container } = render(<Map {...minProps} className="my-map-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains('my-map-class')).toBe(true);
  });

  it('merges additional style props into wrapper without clobbering defaults', () => {
    const { container } = render(<Map {...minProps} style={{ border: '2px solid red' }} />);
    const wrapper = container.firstChild as HTMLElement;
    // Default styles must still be there
    expect(wrapper.style.borderRadius).toBe('8px');
    // Additional style must be merged in
    expect(wrapper.style.border).toBe('2px solid red');
  });
});
