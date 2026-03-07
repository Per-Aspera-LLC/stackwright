import { z } from 'zod';
import { mediaStyleVariantSchema, typographyVariantSchema } from './enums';

// Leaf module: no imports from base.ts.
// Defines a self-contained mediaItemSchema used by buttonContentSchema in base.ts
// to validate icon fields without creating a circular module initialisation:
//   base.ts → media.ts → base.ts
//
// Fields from baseContentSchema (label, color, background) are inlined here as
// optional, since embedded media items (e.g. button icons) do not require them.

const mediaPrimitiveBaseSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  height: z.union([z.number(), z.string()]).optional(),
  width: z.union([z.number(), z.string()]).optional(),
  style: mediaStyleVariantSchema.optional(),
  label: z.string().optional(),
  color: z.string().optional(),
  background: z.string().optional(),
});

const mediaContentPrimitiveSchema = mediaPrimitiveBaseSchema.extend({
  type: z.literal('media'),
});

const iconContentPrimitiveSchema = mediaPrimitiveBaseSchema.extend({
  type: z.literal('icon'),
  size: z.union([z.number(), typographyVariantSchema]).optional(),
  color: z.string().optional(),
});

const imageContentPrimitiveSchema = mediaPrimitiveBaseSchema.extend({
  type: z.literal('image'),
  aspect_ratio: z.number().optional(),
});

export const mediaItemSchema = z.discriminatedUnion('type', [
  mediaContentPrimitiveSchema,
  iconContentPrimitiveSchema,
  imageContentPrimitiveSchema,
]);

export type MediaItem = z.infer<typeof mediaItemSchema>;
