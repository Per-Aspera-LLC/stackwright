import { z } from 'zod';
import { mediaStyleVariantSchema, typographyVariantSchema } from './enums';
import { baseContentSchema } from './base';

const mediaBaseSchema = baseContentSchema.extend({
    src: z.string(),
    alt: z.string().optional(),
    height: z.union([z.number(), z.string()]).optional(),
    width: z.union([z.number(), z.string()]).optional(),
    style: mediaStyleVariantSchema.optional(),
});

export const mediaContentSchema = mediaBaseSchema.extend({
    type: z.literal('media'),
});

export const iconContentSchema = mediaBaseSchema.extend({
    type: z.literal('icon'),
    size: z.union([z.number(), typographyVariantSchema]).optional(),
    color: z.string().optional(),
});

export const imageContentSchema = mediaBaseSchema.extend({
    type: z.literal('image'),
    aspect_ratio: z.number().optional(),
});

export const mediaItemSchema = z.discriminatedUnion('type', [
    mediaContentSchema,
    iconContentSchema,
    imageContentSchema,
]);

export type MediaContent = z.infer<typeof mediaContentSchema>;
export type IconContent = z.infer<typeof iconContentSchema>;
export type ImageContent = z.infer<typeof imageContentSchema>;
export type MediaItem = z.infer<typeof mediaItemSchema>;
