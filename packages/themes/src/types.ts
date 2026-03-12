import { z } from 'zod';

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

export const colorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textSecondary: z.string(),
});

export type ThemeColors = z.infer<typeof colorsSchema>;

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
});

export const themeSchema = themeConfigSchema;

export type ThemeConfig = z.infer<typeof themeConfigSchema>;
export type ComponentStyle = z.infer<typeof componentStyleSchema>;
export interface Theme extends ThemeConfig {}
export type { ThemeColors as ThemeColorsType };
