import { describe, it, expect } from 'vitest';
import { getThemeShadow } from '../../src/utils/shadowUtils';
import { hexToRgba } from '../../src/utils/colorUtils';

// Helper to build the minimal theme object getThemeShadow expects.
function makeTheme(background: string) {
  return { colors: { background } };
}

describe('getThemeShadow', () => {
  it('returns light shadow for white background', () => {
    const shadow = getThemeShadow(makeTheme('#ffffff'), 'md');
    expect(shadow).toBe('0 1px 3px rgba(0,0,0,0.12)');
  });

  it('returns dark shadow for stackwright-docs navy (#0B1F3A)', () => {
    const shadow = getThemeShadow(makeTheme('#0B1F3A'), 'md');
    expect(shadow).toBe('0 2px 6px rgba(0,0,0,0.5)');
  });

  it('returns dark shadow for mid-gray #808080 (sRGB luminance ≈ 0.22)', () => {
    // The old linear formula gave ~0.50 (light). Proper sRGB linearization
    // gives ~0.22, which is correctly classified as dark.
    const shadow = getThemeShadow(makeTheme('#808080'), 'md');
    expect(shadow).toBe('0 2px 6px rgba(0,0,0,0.5)');
  });

  it('returns light shadow (safe fallback) for non-hex input', () => {
    const shadow = getThemeShadow(makeTheme('transparent'), 'md');
    expect(shadow).toBe('0 1px 3px rgba(0,0,0,0.12)');
  });

  it('returns correct shadow for each size on a light background', () => {
    const theme = makeTheme('#ffffff');
    expect(getThemeShadow(theme, 'sm')).toBe('0 1px 2px rgba(0,0,0,0.08)');
    expect(getThemeShadow(theme, 'md')).toBe('0 1px 3px rgba(0,0,0,0.12)');
    expect(getThemeShadow(theme, 'lg')).toBe('0 4px 12px rgba(0,0,0,0.15)');
  });

  it('returns correct shadow for each size on a dark background', () => {
    const theme = makeTheme('#0B1F3A');
    expect(getThemeShadow(theme, 'sm')).toBe('0 1px 3px rgba(0,0,0,0.4)');
    expect(getThemeShadow(theme, 'md')).toBe('0 2px 6px rgba(0,0,0,0.5)');
    expect(getThemeShadow(theme, 'lg')).toBe('0 4px 16px rgba(0,0,0,0.6)');
  });
});

describe('hexToRgba', () => {
  it('converts hex to rgba with given alpha', () => {
    expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)');
  });

  it('handles hex without # prefix', () => {
    expect(hexToRgba('00ff00', 0.3)).toBe('rgba(0,255,0,0.3)');
  });

  it('clamps alpha to [0, 1]', () => {
    expect(hexToRgba('#000000', -0.5)).toBe('rgba(0,0,0,0)');
    expect(hexToRgba('#000000', 2.0)).toBe('rgba(0,0,0,1)');
  });

  it('returns input unchanged for non-hex strings', () => {
    expect(hexToRgba('transparent', 0.5)).toBe('transparent');
    expect(hexToRgba('rgb(1,2,3)', 0.5)).toBe('rgb(1,2,3)');
  });
});
