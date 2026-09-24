/**
 * Pure hex-contrast math, duplicated (deliberately) from
 * `@stackwright/core`'s `utils/colorUtils.ts`.
 *
 * `@stackwright/core` depends on `@stackwright/themes` (not the other way
 * around) — `@stackwright/themes` importing `@stackwright/core` would
 * create a package dependency cycle. These functions are tiny, pure, and
 * have no other dependencies, so duplicating them here (rather than
 * inventing a new shared package for five lines of math) is the pragmatic
 * choice. Keep any future changes to the WCAG contrast formula in sync
 * between the two copies — `themes`' test suite asserts numeric parity
 * with `core`'s copy via a fixture in colorContrast.test.ts.
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

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

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
 * Returns the candidate color with the highest contrast ratio against the
 * given background. Falls back to the first candidate if the array is
 * empty.
 */
export function getHighContrastTextColor(backgroundColor: string, candidates: string[]): string {
  if (candidates.length === 0) return '#000000';
  let best = candidates[0];
  let bestRatio = 0;
  for (const candidate of candidates) {
    const ratio = getContrastRatio(candidate, backgroundColor);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
  }
  return best;
}
