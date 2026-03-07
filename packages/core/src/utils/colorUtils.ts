// Color utility functions for accessibility and readability

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if text is readable on background (WCAG AA standard)
 */
export function isReadable(textColor: string, backgroundColor: string): boolean {
  return getContrastRatio(textColor, backgroundColor) >= 4.5;
}

/**
 * Get the more readable text color option
 */
export function getBetterTextColor(
  option1: string,
  option2: string,
  backgroundColor: string
): string {
  const ratio1 = getContrastRatio(option1, backgroundColor);
  const ratio2 = getContrastRatio(option2, backgroundColor);
  return ratio1 > ratio2 ? option1 : option2;
}

/**
 * Generate appropriate hover color by darkening or lightening based on luminance
 */
export function getHoverColor(color: string, factor: number = 0.15): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  const shouldDarken = luminance > 0.5;

  const adjust = (value: number) => {
    const adjusted = shouldDarken
      ? Math.max(0, value - value * factor)
      : Math.min(255, value + (255 - value) * factor);
    return Math.round(adjusted);
  };

  const newR = adjust(rgb.r);
  const newG = adjust(rgb.g);
  const newB = adjust(rgb.b);

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Resolve theme color names to hex values
 */
export function resolveColor(colorValue: string, themeColors: Record<string, string>): string {
  if (typeof colorValue !== 'string') {
    console.warn(`Invalid color value: ${colorValue}. Defaulting to 'transparent'.`);
    return 'transparent';
  }

  if (colorValue.startsWith('#')) {
    return colorValue; // Already a hex code
  }
  return themeColors[colorValue] || colorValue;
}
