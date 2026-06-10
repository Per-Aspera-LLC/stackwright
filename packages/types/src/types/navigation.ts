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

// Define the link type first to enable recursive schema
export type NavigationLink = {
  label: string;
  href: string;
  children?: NavigationLink[];
};

// Lazy schema for recursive navigation links
export const navigationLinkSchema: z.ZodType<NavigationLink> = z.lazy(() =>
  z.object({
    label: z.string(),
    href: z.string(),
    children: z.array(navigationLinkSchema).optional(),
  })
);

// Section groups navigation links under a named heading (top-level only — no nesting sections)
export type NavigationSection = {
  section: string;
  items: NavigationLink[];
};

export const navigationSectionSchema = z.object({
  section: z.string(),
  items: z.array(navigationLinkSchema).min(1),
});

// Union of link and section — this is the canonical NavigationItem type
export type NavigationItem = NavigationLink | NavigationSection;

export const navigationItemSchema = z.union([navigationLinkSchema, navigationSectionSchema]);

// Type guards for discriminating the union
export function isNavigationSection(item: NavigationItem): item is NavigationSection {
  return 'section' in item && !('label' in item);
}

export function isNavigationLink(item: NavigationItem): item is NavigationLink {
  return 'label' in item && 'href' in item;
}

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
