import { z } from 'zod';
import { typographyVariantSchema, buttonVariantSchema, alignmentVariantSchema } from './enums';

export const baseContentSchema = z.object({
    label: z.string(),
    color: z.string().optional(),
    background: z.string().optional(),
});

export const textBlockSchema = z.object({
    text: z.string(),
    textSize: typographyVariantSchema,
    textColor: z.string().optional(),
});

// ButtonContent.icon is MediaItem, but media.ts imports baseContentSchema from this file.
// To avoid a circular module init issue, icon is typed as z.any() at the Zod level.
// TypeScript types remain correct via the explicit ButtonContent type below.
export const buttonContentSchema = textBlockSchema.extend({
    variant: buttonVariantSchema,
    variantSize: z.enum(['small', 'medium', 'large']).optional(),
    href: z.string().optional(),
    action: z.string().optional(),
    icon: z.any().optional(),
    alignment: alignmentVariantSchema.optional(),
    bgColor: z.string().optional(),
});

export type BaseContent = z.infer<typeof baseContentSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ButtonContent = z.infer<typeof buttonContentSchema>;
