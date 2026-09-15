import { ThemeColors } from './types';
import { FOREGROUND_THEME_COLOR_KEYS, FOREGROUND_TO_BASE_KEY } from './colorKeys';
import { getHighContrastTextColor } from './colorContrast';

/** `ThemeColors` with every foreground slot guaranteed present. */
export type ThemeColorsWithForegrounds = ThemeColors &
  Required<Pick<ThemeColors, (typeof FOREGROUND_THEME_COLOR_KEYS)[number]>>;

/**
 * Fills in any absent `*Foreground` slot on a `ThemeColors` object with a
 * computed, contrast-safe default: the best of [text, textSecondary,
 * white, black] against that slot's base color (e.g. `primaryForeground`'s
 * default is chosen against `colors.primary`).
 *
 * Explicit slots always win — this only fills gaps. Used by `ThemeProvider`
 * (to emit `--sw-color-*-foreground` CSS vars) and by `@stackwright/core`'s
 * `resolveColor()` (to derive a value at runtime when a foreground alias is
 * requested but the theme object doesn't carry that slot).
 */
export function withDerivedForegrounds(colors: ThemeColors): ThemeColorsWithForegrounds {
  const result = { ...colors } as ThemeColorsWithForegrounds;
  for (const foregroundKey of FOREGROUND_THEME_COLOR_KEYS) {
    if (result[foregroundKey]) continue;
    const baseKey = FOREGROUND_TO_BASE_KEY[foregroundKey];
    const backgroundValue = colors[baseKey];
    result[foregroundKey] = getHighContrastTextColor(backgroundValue, [
      colors.text,
      colors.textSecondary,
      '#ffffff',
      '#000000',
    ]);
  }
  return result;
}
