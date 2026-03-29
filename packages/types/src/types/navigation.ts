import { z } from 'zod';
import { buttonContentSchema } from './base';
import { mediaItemSchema } from './media';

export const menuColorSetSchema = z.object({
  background: z.string(),
  text: z.string(),
  hover: z.string(),
  border: z.string().optional(),
});

export const menuThemeSchema = z.object({
  colors: z.object({
    default: menuColorSetSchema,
    contained: menuColorSetSchema,
    outlined: menuColorSetSchema,
  }),
});

// Define the type first to enable recursive schema
export type NavigationItem = {
  label: string;
  href: string;
  children?: NavigationItem[];
};

// Lazy schema for recursive navigation items
export const navigationItemSchema: z.ZodType<NavigationItem> = z.lazy(() =>
  z.object({
    label: z.string(),
    href: z.string(),
    children: z.array(navigationItemSchema).optional(),
  })
);

export const menuContentSchema: z.ZodType<MenuContent> = z.lazy(() =>
  buttonContentSchema.extend({
    menu_items: z.array(menuContentSchema).optional(),
  })
);

export const appBarContentSchema = z.object({
  title: z.string(),
  logo: mediaItemSchema.optional(),
  menuItems: z.array(navigationItemSchema).optional(),
  textcolor: z.string().optional(),
  backgroundcolor: z.string().optional(),
  height: z.union([z.string(), z.number()]).optional(),
  /** Show a Sun/Moon toggle for switching between light and dark color modes. */
  colorModeToggle: z.boolean().optional(),
});

export type MenuContent = z.infer<typeof buttonContentSchema> & {
  menu_items?: MenuContent[];
};
export type MenuTheme = z.infer<typeof menuThemeSchema>;
export type AppBarContent = z.infer<typeof appBarContentSchema>;
