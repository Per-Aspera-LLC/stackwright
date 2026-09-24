import { z } from 'zod';
import { REQUIRED_THEME_COLOR_KEYS, FOREGROUND_THEME_COLOR_KEYS } from './colorKeys';

export const componentStyleSchema = z
  .object({
    base: z.string().optional(),
    primary: z.string().optional(),
    secondary: z.string().optional(),
    outline: z.string().optional(),
    shadow: z.string().optional(),
    nav: z.string().optional(),
    text: z.string().optional(),
  })
  .catchall(z.string().optional());

// Built from the shared key arrays in ./colorKeys — single source of truth,
// so the alias/derivation logic in @stackwright/core's resolveColor() can
// never drift out of sync with what this schema actually accepts.
const requiredColorShape = Object.fromEntries(
  REQUIRED_THEME_COLOR_KEYS.map((key) => [key, z.string()])
) as Record<(typeof REQUIRED_THEME_COLOR_KEYS)[number], z.ZodString>;

// Optional "foreground" (contrast-color) slots — see stackwright-819 /
// swp-rlih. Additive/non-breaking: existing ThemeColors consumers and
// theme YAML/JSON that only set the original 7 keys are unaffected.
const foregroundColorShape = Object.fromEntries(
  FOREGROUND_THEME_COLOR_KEYS.map((key) => [key, z.string().optional()])
) as Record<(typeof FOREGROUND_THEME_COLOR_KEYS)[number], z.ZodOptional<z.ZodString>>;

export const colorsSchema = z.object({
  ...requiredColorShape,
  ...foregroundColorShape,
});

export type ThemeColors = z.infer<typeof colorsSchema>;

// NOTE: runtime values (THEME_COLOR_KEYS, withDerivedForegrounds, ...) are
// intentionally NOT re-exported from this file. types.ts imports zod (for
// colorsSchema), and index.ts exports from types.ts as `export type` only
// to keep zod out of client bundles — see the comment at the top of
// index.ts. Runtime consumers import directly from './colorKeys' /
// './foregrounds', which have zero dependencies.

export type ColorMode = 'light' | 'dark' | 'system';

export const themeConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  colors: colorsSchema,
  darkColors: colorsSchema.optional(),
  backgroundImage: z
    .object({
      url: z.string(),
      repeat: z.enum(['repeat', 'repeat-x', 'repeat-y', 'no-repeat']).optional(),
      size: z.string().optional(),
      position: z.string().optional(),
      attachment: z.enum(['scroll', 'fixed', 'local']).optional(),
      scale: z.number().optional(),
      animation: z.enum(['drift', 'float', 'shimmer', 'shimmer-float', 'none']).optional(),
      customAnimation: z.string().optional(),
    })
    .optional(),
  typography: z.object({
    fontFamily: z.object({
      primary: z.string(),
      secondary: z.string(),
    }),
    scale: z.object({
      xs: z.string(),
      sm: z.string(),
      base: z.string(),
      lg: z.string(),
      xl: z.string(),
      '2xl': z.string(),
      '3xl': z.string(),
    }),
  }),
  spacing: z.object({
    xs: z.string(),
    sm: z.string(),
    md: z.string(),
    lg: z.string(),
    xl: z.string(),
    '2xl': z.string(),
  }),
  components: z
    .object({
      button: componentStyleSchema.optional(),
      card: componentStyleSchema.optional(),
      header: componentStyleSchema.optional(),
      footer: componentStyleSchema.optional(),
    })
    .optional(),
  /** Preferred default color mode for this theme. Consumers fall back to 'system' when absent. */
  defaultColorMode: z.enum(['light', 'dark', 'system']).optional(),
});

export const themeSchema = themeConfigSchema;

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type ComponentStyle = z.infer<typeof componentStyleSchema>;
export interface Theme extends ThemeConfig {}
export type { ThemeColors as ThemeColorsType };
