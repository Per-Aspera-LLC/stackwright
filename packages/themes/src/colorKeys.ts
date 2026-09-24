/**
 * Plain-data (no zod) source of truth for `ThemeColors` key names.
 *
 * This file has zero dependencies so it is safe to import at runtime from
 * client bundles (unlike `./schemas`, which pulls in zod). `colorsSchema`
 * (types.ts) is built FROM these arrays rather than the arrays being
 * hand-derived from the schema, so there is exactly one place that lists
 * the 7 required + 5 optional color slots.
 *
 * `@stackwright/core`'s `resolveColor()` imports `THEME_COLOR_KEYS` /
 * `FOREGROUND_THEME_COLOR_KEYS` from the package root (not `/schemas`) to
 * build its kebab-case alias map and to know which keys are foreground
 * slots — so that alias map is derived, never hand-listed twice.
 */

/** The original 7 required color slots. */
export const REQUIRED_THEME_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'textSecondary',
] as const;

/**
 * Optional "foreground" (contrast-color) slots — the text color intended
 * to sit on top of the correspondingly-named base color. Added to close
 * the schema-as-security-boundary gap from stackwright-819 / swp-rlih:
 * a site config naming one of these tokens used to be silently stripped
 * by colorsSchema instead of resolved or rejected.
 */
export const FOREGROUND_THEME_COLOR_KEYS = [
  'primaryForeground',
  'secondaryForeground',
  'accentForeground',
  'surfaceForeground',
  'backgroundForeground',
] as const;

export const THEME_COLOR_KEYS = [
  ...REQUIRED_THEME_COLOR_KEYS,
  ...FOREGROUND_THEME_COLOR_KEYS,
] as const;

export type RequiredThemeColorKey = (typeof REQUIRED_THEME_COLOR_KEYS)[number];
export type ForegroundThemeColorKey = (typeof FOREGROUND_THEME_COLOR_KEYS)[number];
export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

/** Maps each foreground slot to the base color it provides contrast against. */
export const FOREGROUND_TO_BASE_KEY: Record<ForegroundThemeColorKey, RequiredThemeColorKey> = {
  primaryForeground: 'primary',
  secondaryForeground: 'secondary',
  accentForeground: 'accent',
  surfaceForeground: 'surface',
  backgroundForeground: 'background',
};

/** camelCase -> kebab-case ('primaryForeground' -> 'primary-foreground'). */
function camelToKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Canonical kebab-case alias -> camelCase ThemeColors key map. Built from
 * THEME_COLOR_KEYS (not hand-listed) so it can never drift out of sync with
 * the schema. Both `@stackwright/core`'s resolveColor() and
 * `@stackwright/build-scripts`'s site-config color-ref build guard import
 * this single map rather than each deriving their own copy.
 */
export const KEBAB_COLOR_ALIASES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const key of THEME_COLOR_KEYS) {
    map[camelToKebab(key)] = key;
  }
  // Shorthand aliases that don't fall out of a mechanical camelCase split —
  // these are genuinely additional spellings, not schema keys themselves.
  map.bg = 'background';
  map['bg-foreground'] = 'backgroundForeground';
  return map;
})();
