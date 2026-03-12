import { z } from 'zod';
import { navigationItemSchema } from './navigation';
import { buttonContentSchema } from './base';
import { mediaItemSchema } from './media';
import { themeSchema } from '@stackwright/themes';

export const appBarConfigSchema = z.object({
  titleText: z.string(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  logo: mediaItemSchema.optional(),
  height: z.string().optional(),
  menuItems: z.array(navigationItemSchema).optional(),
  /** Show a Sun/Moon toggle for switching between light and dark color modes. */
  colorModeToggle: z.boolean().optional(),
});

export const breakpointsConfigSchema = z.object({
  xs: z.string(),
  sm: z.string(),
  md: z.string(),
  lg: z.string(),
  xl: z.string(),
});

export const footerConfigSchema = z.object({
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  copyright: z.string().optional(),
  itemsPerColumn: z.number().optional(),
  links: z.array(navigationItemSchema).optional(),
  socialLinks: z.array(buttonContentSchema).optional(),
  socialText: z.string().optional(),
});

export const siteMetaSchema = z.object({
  description: z.string().optional(),
  og_image: z.string().optional(),
  og_site_name: z.string().optional(),
  base_url: z.string().url().optional(),
});

export const siteConfigSchema = z.object({
  title: z.string(),
  meta: siteMetaSchema.optional(),
  themeName: z.string().optional(),
  customTheme: themeSchema.optional(),
  navigation: z.array(navigationItemSchema),
  appBar: appBarConfigSchema,
  footer: footerConfigSchema.optional(),
  breakpoints: breakpointsConfigSchema.optional(),
});

export type SiteMeta = z.infer<typeof siteMetaSchema>;
export type AppBarConfig = z.infer<typeof appBarConfigSchema>;
export type BreakpointsConfig = z.infer<typeof breakpointsConfigSchema>;
export type FooterConfig = z.infer<typeof footerConfigSchema>;
export type SiteConfig = z.infer<typeof siteConfigSchema>;
