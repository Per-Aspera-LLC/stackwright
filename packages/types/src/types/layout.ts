import { z } from 'zod';
import { baseContentSchema, buttonContentSchema } from './base';
import { appBarContentSchema, navigationItemSchema } from './navigation';
import { contentItemSchema } from './content';

/**
 * Page-level sidebar override.
 *
 * - Omit the field entirely  → fall back to site config (stackwright.yml sidebar)
 * - Set to null              → hide sidebar on this page
 * - Set to an object         → use these sidebar config values for this page
 *
 * Use cases:
 * - A dashboard page hides the nav sidebar to maximize content width
 * - A documentation page shows a different sidebar with chapter navigation
 * - A landing page inherits the site sidebar
 *
 * The Theme Otter sets the site-wide sidebar defaults in stackwright.yml.
 * Page Otter can override per-page for dashboards, docs chapters, etc.
 */
export const pageSidebarSchema = z
  .object({
    /**
     * Override the navigation items shown in the sidebar.
     * Falls back to site sidebar navigation if omitted.
     */
    navigation: z.array(navigationItemSchema).optional(),
    /** Override whether the sidebar starts collapsed. */
    collapsed: z.boolean().optional(),
    /** Override the sidebar width in pixels. */
    width: z.number().optional(),
    /** Override the mobile breakpoint in pixels. */
    mobileBreakpoint: z.number().optional(),
    /** Override the sidebar background color. */
    backgroundColor: z.string().optional(),
    /** Override the sidebar text color. */
    textColor: z.string().optional(),
  })
  .nullable()
  .optional();

export type PageSidebar = z.infer<typeof pageSidebarSchema>;

export const footerContentSchema = baseContentSchema.extend({
  copyright: z.string(),
  buttons: z.array(buttonContentSchema),
  sociallinks: z.array(buttonContentSchema).optional(),
  socialtext: z.string().optional(),
});

export const pageMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  og_image: z.string().optional(),
  canonical: z.string().optional(),
  noindex: z.boolean().optional(),
});

export const pageContentSchema = z.object({
  content: z.object({
    meta: pageMetaSchema.optional(),
    app_bar: appBarContentSchema.optional(),
    footer: footerContentSchema.optional(),
    content_items: z.array(contentItemSchema),
    list_icon: z.string().optional(),
    /**
     * Page-level sidebar override.
     *
     * - Omit entirely → use site config sidebar (stackwright.yml sidebar)
     * - Set to null   → hide sidebar on this page
     * - Set to object → use these values for the sidebar, falling back to
     *                   site config for any unspecified fields
     *
     * The Theme Otter sets the site-wide sidebar in stackwright.yml.
     * Page Otter can override per-page for dashboards, docs chapters, etc.
     */
    navSidebar: pageSidebarSchema,
  }),
});

/**
 * Build an extended page content schema that includes additional content item schemas.
 *
 * Used by the prebuild pipeline to support pro/plugin content types alongside
 * the built-in OSS content types.
 *
 * @param extraSchemas - Additional Zod schemas to include in the content item union
 * @returns Extended page content schema
 */
export function buildExtendedPageContentSchema(extraSchemas: z.ZodTypeAny[]): z.ZodTypeAny {
  if (extraSchemas.length === 0) return pageContentSchema;

  const extendedContentItem = z.union([contentItemSchema, ...extraSchemas] as [
    z.ZodTypeAny,
    z.ZodTypeAny,
    ...z.ZodTypeAny[],
  ]);

  return z.object({
    content: z.object({
      meta: pageMetaSchema.optional(),
      app_bar: appBarContentSchema.optional(),
      footer: footerContentSchema.optional(),
      content_items: z.array(extendedContentItem),
      list_icon: z.string().optional(),
      navSidebar: pageSidebarSchema,
    }),
  });
}

export type PageMeta = z.infer<typeof pageMetaSchema>;
export type FooterContent = z.infer<typeof footerContentSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
