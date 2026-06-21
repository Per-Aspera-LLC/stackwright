import { z } from 'zod';
import { themeSchema } from '@stackwright/themes/schemas';
import { fontsConfigSchema } from './siteConfig';

/**
 * Schema for `stackwright.theme.yml` — the dedicated theme split file.
 *
 * Projects can author theme settings in a separate file instead of (or in
 * addition to) inline fields in `stackwright.yml`. When present, this file
 * is compiled by `compileTheme()` into `public/stackwright-content/_theme.json`.
 *
 * All fields are optional. An empty theme file is valid and produces an
 * empty `_theme.json` (consumers fall back to defaults).
 */
export const stackwrightThemeFileSchema = z.object({
  /** Named theme preset to use (e.g. 'midnight', 'ocean'). */
  themeName: z.string().optional(),
  /** Full custom theme object. Overrides themeName when present. */
  customTheme: themeSchema.optional(),
  /** Font loading strategy for this project. */
  fonts: fontsConfigSchema.optional(),
  /**
   * Preferred default color mode.
   * Passed to ColorModeScript so the initial HTML data-attribute matches
   * the design intent without waiting for the client-side cookie read.
   */
  defaultColorMode: z.enum(['light', 'dark', 'system']).optional(),
});

export type StackwrightThemeFile = z.infer<typeof stackwrightThemeFileSchema>;
