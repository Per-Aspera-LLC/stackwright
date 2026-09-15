import { describe, it, expect, vi } from 'vitest';
import {
  getContrastRatio,
  isReadable,
  getBetterTextColor,
  getHoverColor,
  resolveColor,
  getHighContrastTextColor,
} from '../../src/utils/colorUtils';

describe('getContrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('is order-independent (white on black equals black on white)', () => {
    const a = getContrastRatio('#000000', '#ffffff');
    const b = getContrastRatio('#ffffff', '#000000');
    expect(a).toBeCloseTo(b, 5);
  });

  it('returns 1 for same color', () => {
    expect(getContrastRatio('#888888', '#888888')).toBeCloseTo(1, 5);
  });

  it('returns 1 when either color is invalid', () => {
    expect(getContrastRatio('notacolor', '#ffffff')).toBe(1);
    expect(getContrastRatio('#ffffff', 'notacolor')).toBe(1);
    expect(getContrastRatio('bad', 'also bad')).toBe(1);
  });

  it('returns a value between 1 and 21 for mid-range colors', () => {
    const ratio = getContrastRatio('#f59e0b', '#1f2937');
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThanOrEqual(21);
  });

  it('works without leading # (bare hex)', () => {
    // hexToRgb regex accepts hex without #
    const withHash = getContrastRatio('#000000', '#ffffff');
    const withoutHash = getContrastRatio('000000', 'ffffff');
    expect(withHash).toBeCloseTo(withoutHash, 5);
  });
});

describe('isReadable', () => {
  it('returns true for black text on white background (ratio ~21)', () => {
    expect(isReadable('#000000', '#ffffff')).toBe(true);
  });

  it('returns true for white text on black background', () => {
    expect(isReadable('#ffffff', '#000000')).toBe(true);
  });

  it('returns false for same color (ratio 1)', () => {
    expect(isReadable('#888888', '#888888')).toBe(false);
  });

  it('returns false when contrast is below 4.5', () => {
    // Mid-grey on slightly different grey — low contrast
    expect(isReadable('#aaaaaa', '#bbbbbb')).toBe(false);
  });

  it('returns false for invalid hex', () => {
    expect(isReadable('notahex', '#ffffff')).toBe(false);
  });
});

describe('getBetterTextColor', () => {
  it('returns black when black has better contrast than white on a light background', () => {
    // Light yellow background — black is more readable
    const result = getBetterTextColor('#000000', '#ffffff', '#ffffcc');
    expect(result).toBe('#000000');
  });

  it('returns white when white has better contrast than black on a dark background', () => {
    // Dark background — white is more readable
    const result = getBetterTextColor('#000000', '#ffffff', '#1a1a2e');
    expect(result).toBe('#ffffff');
  });

  it('returns option1 when both options have equal contrast', () => {
    // Two identical options — ratio1 === ratio2, returns option1 (ratio1 > ratio2 is false)
    const result = getBetterTextColor('#ff0000', '#ff0000', '#ffffff');
    expect(result).toBe('#ff0000');
  });
});

describe('getHoverColor', () => {
  it('returns a valid hex string', () => {
    const result = getHoverColor('#f59e0b');
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('darkens a light color (luminance > 0.5)', () => {
    // White is the lightest color, should darken
    const result = getHoverColor('#ffffff', 0.15);
    // Each channel should be less than 255
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    expect(r).toBeLessThan(255);
    expect(g).toBeLessThan(255);
    expect(b).toBeLessThan(255);
  });

  it('lightens a dark color (luminance <= 0.5)', () => {
    // Black is the darkest color, should lighten
    const result = getHoverColor('#000000', 0.15);
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    expect(r).toBeGreaterThan(0);
    expect(g).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(0);
  });

  it('returns original color string for invalid hex', () => {
    expect(getHoverColor('notahex')).toBe('notahex');
  });

  it('uses default factor of 0.15 when none provided', () => {
    const withDefault = getHoverColor('#888888');
    const withExplicit = getHoverColor('#888888', 0.15);
    expect(withDefault).toBe(withExplicit);
  });
});

describe('resolveColor', () => {
  const themeColors = {
    primary: '#f59e0b',
    secondary: '#334155',
    accent: '#b45309',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  };

  it('returns hex colors unchanged', () => {
    expect(resolveColor('#ff0000', themeColors)).toBe('#ff0000');
    expect(resolveColor('#000000', themeColors)).toBe('#000000');
  });

  it('resolves known theme color names to hex values', () => {
    expect(resolveColor('primary', themeColors)).toBe('#f59e0b');
    expect(resolveColor('secondary', themeColors)).toBe('#334155');
    expect(resolveColor('text', themeColors)).toBe('#1f2937');
  });

  it('warns and returns transparent for non-string input', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Cast to bypass TypeScript so we can test the runtime guard
    expect(resolveColor(123 as unknown as string, themeColors)).toBe('transparent');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // -------------------------------------------------------------------
  // stackwright-819 / swp-rlih regression coverage
  // -------------------------------------------------------------------

  it('resolves kebab-case aliases to their camelCase ThemeColors key', () => {
    const colors = { ...themeColors, textSecondary: '#6b7280' };
    expect(resolveColor('text-secondary', colors)).toBe(colors.textSecondary);
    expect(resolveColor('bg', colors)).toBe(colors.background);
  });

  it('derives primary-foreground when the slot is absent from themeColors', () => {
    const result = resolveColor('primary-foreground', themeColors);
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    expect(result).not.toBe('primary-foreground');
  });

  it('derives backgroundForeground via both the "bg-foreground" and camelCase aliases', () => {
    const viaKebab = resolveColor('bg-foreground', themeColors);
    const viaCamel = resolveColor('backgroundForeground', themeColors);
    expect(viaKebab).toMatch(/^#[0-9a-f]{6}$/i);
    expect(viaKebab).toBe(viaCamel);
  });

  it('prefers an explicit foreground slot over the derived default', () => {
    const withExplicit = { ...themeColors, primaryForeground: '#123456' };
    expect(resolveColor('primary-foreground', withExplicit)).toBe('#123456');
  });

  it('never returns a raw unknown token — falls back to a hex and warns once', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const first = resolveColor('totally-unknown-token', themeColors);
    const second = resolveColor('totally-unknown-token', themeColors);

    expect(first).toMatch(/^#[0-9a-f]{6}$/i);
    expect(first).not.toBe('totally-unknown-token');
    expect(second).toBe(first);

    const warnCalls = consoleSpy.mock.calls.filter((call) =>
      String(call[0]).includes('totally-unknown-token')
    );
    expect(warnCalls).toHaveLength(1); // warn-once per token
    expect(String(warnCalls[0][0])).toMatch(/unknown color token/);

    consoleSpy.mockRestore();
  });

  it('uses opts.background for a contrast-safe fallback on unknown tokens', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // A dark background — the fallback should be light, not themeColors.text (#1f2937, dark).
    const result = resolveColor('another-unknown-token', themeColors, { background: '#000000' });
    expect(result).toBe('#ffffff');
    consoleSpy.mockRestore();
  });
});

describe('getHighContrastTextColor', () => {
  it('returns black over mid-grey on a light background', () => {
    // #000000 has much higher contrast on white than #888888
    const result = getHighContrastTextColor('#ffffff', ['#888888', '#000000']);
    expect(result).toBe('#000000');
  });

  it('returns white over mid-grey on a dark background', () => {
    // #ffffff has much higher contrast on near-black than #888888
    const result = getHighContrastTextColor('#1a1a2e', ['#888888', '#ffffff']);
    expect(result).toBe('#ffffff');
  });

  it('picks the best from four candidates including theme colors', () => {
    // On a mid-blue background, black and white both have good contrast;
    // white should win as it has higher contrast on #1565c0
    const result = getHighContrastTextColor('#1565c0', [
      '#1f2937', // dark theme text
      '#6b7280', // secondary theme text
      '#ffffff',
      '#000000',
    ]);
    // white (#ffffff) should have higher contrast on a dark blue than black
    expect(result).toBe('#ffffff');
  });

  it('returns the single candidate when only one is provided', () => {
    const result = getHighContrastTextColor('#ffffff', ['#ff0000']);
    expect(result).toBe('#ff0000');
  });

  it('returns #000000 fallback for an empty candidates array', () => {
    const result = getHighContrastTextColor('#ffffff', []);
    expect(result).toBe('#000000');
  });

  it('returns the best valid candidate even when some are invalid hex', () => {
    // 'notacolor' will return getContrastRatio of 1 (invalid), so '#000000' wins
    const result = getHighContrastTextColor('#ffffff', ['notacolor', '#000000']);
    expect(result).toBe('#000000');
  });
});
