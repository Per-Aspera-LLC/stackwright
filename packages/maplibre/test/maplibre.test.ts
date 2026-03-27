import { describe, it, expect } from 'vitest';
import { MapLibreProvider, registerMapLibreProvider } from '../src';

describe('@stackwright/maplibre', () => {
  it('exports MapLibreProvider as a React component', () => {
    expect(MapLibreProvider).toBeDefined();
    expect(typeof MapLibreProvider).toBe('function');
  });

  it('exports registerMapLibreProvider function', () => {
    expect(typeof registerMapLibreProvider).toBe('function');
  });

  it('registerMapLibreProvider does not throw', () => {
    expect(() => registerMapLibreProvider()).not.toThrow();
  });
});
