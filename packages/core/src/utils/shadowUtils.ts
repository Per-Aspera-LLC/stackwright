/**
 * Theme-aware box shadows. On dark backgrounds, shadows need to be
 * darker/more pronounced since the base is already dark.
 *
 * Uses the theme's background color luminance to decide.
 */
import { hexToRgb, getLuminance } from './colorUtils';

export type ShadowSize = 'sm' | 'md' | 'lg';

const SHADOWS = {
  sm: {
    light: '0 1px 2px rgba(0,0,0,0.08)',
    dark: '0 1px 3px rgba(0,0,0,0.4)',
  },
  md: {
    light: '0 1px 3px rgba(0,0,0,0.12)',
    dark: '0 2px 6px rgba(0,0,0,0.5)',
  },
  lg: {
    light: '0 4px 12px rgba(0,0,0,0.15)',
    dark: '0 4px 16px rgba(0,0,0,0.6)',
  },
} as const;

export function getThemeShadow(
  theme: { colors: { background: string } },
  size: ShadowSize
): string {
  const isDark = isColorDark(theme.colors.background);
  return isDark ? SHADOWS[size].dark : SHADOWS[size].light;
}

function isColorDark(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return getLuminance(rgb.r, rgb.g, rgb.b) < 0.5;
}
