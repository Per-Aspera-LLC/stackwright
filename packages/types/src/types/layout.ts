import { z } from 'zod';
import { baseContentSchema, buttonContentSchema } from './base';
import { appBarContentSchema } from './navigation';
import { contentItemSchema } from './content';

export const footerContentSchema = baseContentSchema.extend({
    copyright: z.string(),
    buttons: z.array(buttonContentSchema),
    sociallinks: z.array(buttonContentSchema).optional(),
    socialtext: z.string().optional(),
});

export const pageContentSchema = z.object({
    content: z.object({
        app_bar: appBarContentSchema.optional(),
        footer: footerContentSchema.optional(),
        content_items: z.array(contentItemSchema),
        list_icon: z.string().optional(),
    }),
});

export type FooterContent = z.infer<typeof footerContentSchema>;
export type PageContent = z.infer<typeof pageContentSchema>;
