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

export type MediaContent = z.infer<typeof mediaContentSchema>;
export type IconContent = z.infer<typeof iconContentSchema>;
export type ImageContent = z.infer<typeof imageContentSchema>;

// mediaItemSchema and MediaItem are defined in media-primitives.ts (a leaf module
// with no imports from base.ts) so that base.ts can import them for
// buttonContentSchema.icon without creating a circular module dependency.
export { mediaItemSchema } from './media-primitives';
export type { MediaItem } from './media-primitives';
