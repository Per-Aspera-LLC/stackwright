import { describe, it, expect } from 'vitest';
import { withDerivedForegrounds } from '../src/foregrounds';
import { colorsSchema } from '../src/types';
import {
  THEME_COLOR_KEYS,
  REQUIRED_THEME_COLOR_KEYS,
  FOREGROUND_THEME_COLOR_KEYS,
} from '../src/colorKeys';
import { getContrastRatio } from '../src/colorContrast';
import type { ThemeColors } from '../src/types';

const baseColors: ThemeColors = {
  primary: '#1a365d', // dark navy — the R10 fixture's bug-triggering color
  secondary: '#2c5282',
  accent: '#3182ce',
  background: '#ffffff',
  surface: '#f7fafc',
  text: '#1a1a1a',
  textSecondary: '#4a5568',
};

describe('colorKeys', () => {
  it('colorsSchema keys exactly match THEME_COLOR_KEYS (single source of truth)', () => {
    expect(Object.keys(colorsSchema.shape).sort()).toEqual([...THEME_COLOR_KEYS].sort());
  });

  it('the 7 required keys are still required (non-optional) on the schema', () => {
    for (const key of REQUIRED_THEME_COLOR_KEYS) {
      expect(colorsSchema.shape[key].isOptional()).toBe(false);
    }
  });

  it('the 5 foreground keys are optional on the schema', () => {
    for (const key of FOREGROUND_THEME_COLOR_KEYS) {
      expect(colorsSchema.shape[key].isOptional()).toBe(true);
    }
  });

  it('colorsSchema still accepts a config with only the original 7 keys (non-breaking)', () => {
    expect(() => colorsSchema.parse(baseColors)).not.toThrow();
  });

  it('colorsSchema accepts explicit foreground slots', () => {
    const withForegrounds = { ...baseColors, primaryForeground: '#ffffff' };
    expect(colorsSchema.parse(withForegrounds)).toEqual(withForegrounds);
  });
});

describe('withDerivedForegrounds', () => {
  it('fills in all 5 foreground slots when none are set', () => {
    const result = withDerivedForegrounds(baseColors);
    for (const key of FOREGROUND_THEME_COLOR_KEYS) {
      expect(result[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('derives primaryForeground with WCAG AA contrast against colors.primary', () => {
    const result = withDerivedForegrounds(baseColors);
    const ratio = getContrastRatio(result.primaryForeground, baseColors.primary);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('never overrides an explicitly-set foreground slot', () => {
    const withExplicit = { ...baseColors, primaryForeground: '#123456' };
    const result = withDerivedForegrounds(withExplicit);
    expect(result.primaryForeground).toBe('#123456');
  });

  it('derives each foreground against its own base color, not a shared default', () => {
    // A dark primary and a light surface should NOT get the same derived foreground.
    const mixed: ThemeColors = {
      ...baseColors,
      primary: '#0a0a0a', // very dark
      surface: '#fefefe', // very light
    };
    const result = withDerivedForegrounds(mixed);
    expect(result.primaryForeground).not.toBe(result.surfaceForeground);
  });

  it('leaves the original 7 keys untouched', () => {
    const result = withDerivedForegrounds(baseColors);
    for (const key of REQUIRED_THEME_COLOR_KEYS) {
      expect(result[key]).toBe(baseColors[key]);
    }
  });
});
