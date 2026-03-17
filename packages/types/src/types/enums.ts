import { z } from 'zod';

export const graphicPositionSchema = z.enum(['left', 'right']);
export const typographyVariantSchema = z.enum([
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'caption',
  'button',
  'overline',
]);
export const buttonVariantSchema = z.enum(['text', 'outlined', 'contained']);
export const alignmentVariantSchema = z.enum(['left', 'center', 'right']);
export const mediaStyleVariantSchema = z.enum(['contained', 'overflow']);
// TODO: This enum is currently unused — media types use z.literal() directly
// in discriminated unions. Consider removing or wiring into schemas.
export const mediaVariantSchema = z.enum(['image', 'video']);

// Kept for backwards compatibility with code that uses the enum value syntax (GraphicPosition.LEFT)
export enum GraphicPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export type TypographyVariant = z.infer<typeof typographyVariantSchema>;
export type ButtonVariant = z.infer<typeof buttonVariantSchema>;
export type AlignmentVariant = z.infer<typeof alignmentVariantSchema>;
export type MediaStyleVariant = z.infer<typeof mediaStyleVariantSchema>;
export type MediaVariant = z.infer<typeof mediaVariantSchema>;
