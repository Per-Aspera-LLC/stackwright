// Type-only exports from types.ts — no zod schemas, no js-yaml, safe for client bundles.
// For zod schemas (server/CLI/build use only), import from '@stackwright/themes/schemas'.
export type { ThemeConfig, Theme, ComponentStyle, ThemeColors, ColorMode } from './types';

// Plain-data runtime exports — zero dependencies, safe for client bundles
// (unlike the zod schemas under './schemas'). @stackwright/core's
// resolveColor() imports these to build its alias map / foreground-slot
// detection without pulling zod into the client.
export {
  THEME_COLOR_KEYS,
  REQUIRED_THEME_COLOR_KEYS,
  FOREGROUND_THEME_COLOR_KEYS,
  FOREGROUND_TO_BASE_KEY,
  KEBAB_COLOR_ALIASES,
} from './colorKeys';
export type { ThemeColorKey, RequiredThemeColorKey, ForegroundThemeColorKey } from './colorKeys';
export { withDerivedForegrounds } from './foregrounds';
export type { ThemeColorsWithForegrounds } from './foregrounds';

export * from './ThemeProvider';
export * from './themeLoader';
export * from './ColorModeScript';
