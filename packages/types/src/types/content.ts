import { z } from 'zod';
import { baseContentSchema, textBlockSchema, buttonContentSchema } from './base';
import {
  iconContentSchema,
  mediaContentSchema,
  videoContentSchema,
  mediaItemSchema,
} from './media';
import { graphicPositionSchema } from './enums';
import { collectionListContentSchema } from './collection';
import type { TextBlock } from './base';
import type { MediaContent, VideoContent } from './media';
import type { CollectionListContent } from './collection';

export const carouselItemSchema = z.object({
  title: z.string(),
  text: z.string(),
  media: mediaItemSchema,
  background: z.string().optional(),
});

export const carouselContentSchema = baseContentSchema.extend({
  type: z.literal('carousel'),
  heading: z.string(),
  autoPlaySpeed: z.number().optional(),
  infinite: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  background: z.string().optional(),
  items: z.array(carouselItemSchema),
});

export const mainContentSchema = baseContentSchema.extend({
  type: z.literal('main'),
  heading: textBlockSchema,
  textBlocks: z.array(textBlockSchema),
  media: mediaItemSchema.optional(),
  graphic_position: graphicPositionSchema.optional(),
  buttons: z.array(buttonContentSchema).optional(),
  textToGraphic: z.number().optional(),
});

export const timelineItemSchema = z.object({
  year: z.string(),
  event: z.string(),
});

export const timelineContentSchema = baseContentSchema.extend({
  type: z.literal('timeline'),
  heading: textBlockSchema.optional(),
  items: z.array(timelineItemSchema),
});

export const iconGridContentSchema = baseContentSchema.extend({
  type: z.literal('icon_grid'),
  heading: textBlockSchema.optional(),
  icons: z.array(iconContentSchema),
});

export const codeBlockContentSchema = baseContentSchema.extend({
  type: z.literal('code_block'),
  code: z.string(),
  language: z.string().optional(),
  lineNumbers: z.boolean().optional(),
});

// --- New content types (issue #79) ---

export const featureItemSchema = z.object({
  icon: mediaItemSchema.optional(),
  heading: z.string(),
  description: z.string(),
});

export const featureListContentSchema = baseContentSchema.extend({
  type: z.literal('feature_list'),
  heading: textBlockSchema.optional(),
  columns: z.number().optional(),
  items: z.array(featureItemSchema),
});

export const testimonialItemSchema = z.object({
  quote: z.string(),
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  avatar: mediaItemSchema.optional(),
});

export const testimonialGridContentSchema = baseContentSchema.extend({
  type: z.literal('testimonial_grid'),
  heading: textBlockSchema.optional(),
  columns: z.number().optional(),
  items: z.array(testimonialItemSchema),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const faqContentSchema = baseContentSchema.extend({
  type: z.literal('faq'),
  heading: textBlockSchema.optional(),
  items: z.array(faqItemSchema),
});

export const pricingPlanSchema = z.object({
  name: z.string(),
  price: z.string(),
  description: z.string().optional(),
  features: z.array(z.string()),
  highlighted: z.boolean().optional(),
  badge_text: z.string().optional(),
  cta_text: z.string(),
  cta_href: z.string(),
});

export const pricingTableContentSchema = baseContentSchema.extend({
  type: z.literal('pricing_table'),
  heading: textBlockSchema.optional(),
  plans: z.array(pricingPlanSchema),
});

export const alertVariantSchema = z.enum(['info', 'warning', 'success', 'danger', 'note', 'tip']);

export const alertContentSchema = baseContentSchema.extend({
  type: z.literal('alert'),
  variant: alertVariantSchema,
  title: z.string().optional(),
  body: z.string(),
});

export const contactFormStubContentSchema = baseContentSchema.extend({
  type: z.literal('contact_form_stub'),
  heading: textBlockSchema.optional(),
  description: z.string().optional(),
  email: z.string(),
  email_subject: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  button_text: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Inferred types for non-recursive content schemas
// ---------------------------------------------------------------------------

export type CarouselItem = z.infer<typeof carouselItemSchema>;
export type CarouselContent = z.infer<typeof carouselContentSchema>;
export type MainContent = z.infer<typeof mainContentSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;
export type TimelineContent = z.infer<typeof timelineContentSchema>;
export type IconGridContent = z.infer<typeof iconGridContentSchema>;
export type CodeBlockContent = z.infer<typeof codeBlockContentSchema>;
export type FeatureItem = z.infer<typeof featureItemSchema>;
export type FeatureListContent = z.infer<typeof featureListContentSchema>;
export type TestimonialItem = z.infer<typeof testimonialItemSchema>;
export type TestimonialGridContent = z.infer<typeof testimonialGridContentSchema>;
export type FaqItem = z.infer<typeof faqItemSchema>;
export type FaqContent = z.infer<typeof faqContentSchema>;
export type PricingPlan = z.infer<typeof pricingPlanSchema>;
export type PricingTableContent = z.infer<typeof pricingTableContentSchema>;
export type AlertVariant = z.infer<typeof alertVariantSchema>;
export type AlertContent = z.infer<typeof alertContentSchema>;
export type ContactFormStubContent = z.infer<typeof contactFormStubContentSchema>;

// ---------------------------------------------------------------------------
// Recursive types: TabbedContent, GridContent, ContentItem
//
// These are mutually recursive (TabbedContent.tabs → ContentItem[],
// GridColumn.content_items → ContentItem[], ContentItem → TabbedContent | GridContent).
// We break the cycle with explicit TypeScript interface declarations + z.lazy().
// ---------------------------------------------------------------------------

export interface GridColumn {
  width?: number;
  content_items: ContentItem[];
}

export interface GridContent {
  type: 'grid';
  label: string;
  color?: string;
  background?: string;
  heading?: TextBlock;
  columns: GridColumn[];
  gap?: string;
  stackBelow?: number;
}

export interface TabbedContent {
  type: 'tabbed_content';
  label: string;
  color?: string;
  background?: string;
  heading: TextBlock;
  tabs: ContentItem[];
}

/**
 * ContentItem — discriminated union on `type`.
 *
 * Each content item carries an explicit `type` field that identifies which
 * content type it represents. This enables proper TypeScript discriminated
 * union narrowing and reliable Zod validation.
 *
 * YAML format (flat):
 * ```yaml
 * content_items:
 *   - type: main
 *     label: hero
 *     heading:
 *       text: Hello
 *       textSize: h1
 * ```
 */
export type ContentItem =
  | CarouselContent
  | MainContent
  | TabbedContent
  | MediaContent
  | TimelineContent
  | IconGridContent
  | CodeBlockContent
  | FeatureListContent
  | TestimonialGridContent
  | FaqContent
  | PricingTableContent
  | AlertContent
  | ContactFormStubContent
  | GridContent
  | CollectionListContent
  | VideoContent;

// ---------------------------------------------------------------------------
// Zod schemas for recursive types
// ---------------------------------------------------------------------------

export const gridColumnSchema: z.ZodType<GridColumn> = z.lazy(() =>
  z.object({
    width: z.number().optional(),
    content_items: z.array(contentItemSchema),
  })
);

export const gridContentSchema: z.ZodType<GridContent> = z.lazy(() =>
  baseContentSchema.extend({
    type: z.literal('grid'),
    heading: textBlockSchema.optional(),
    columns: z.array(gridColumnSchema).min(1),
    gap: z.string().optional(),
    stackBelow: z.number().optional(),
  })
);

export const tabbedContentSchema: z.ZodType<TabbedContent> = z.lazy(() =>
  baseContentSchema.extend({
    type: z.literal('tabbed_content'),
    heading: textBlockSchema,
    tabs: z.array(contentItemSchema),
  })
);

/**
 * Zod schema for ContentItem — a union of all content type schemas.
 *
 * Uses z.union() (not z.discriminatedUnion()) because the recursive types
 * (tabbedContentSchema, gridContentSchema) are z.lazy() wrappers, which
 * z.discriminatedUnion() cannot inspect at registration time. TypeScript
 * still gets a proper discriminated union via the ContentItem type above.
 */
export const contentItemSchema: z.ZodType<ContentItem> = z.lazy(() =>
  z.union([
    carouselContentSchema,
    mainContentSchema,
    tabbedContentSchema,
    mediaContentSchema,
    timelineContentSchema,
    iconGridContentSchema,
    codeBlockContentSchema,
    featureListContentSchema,
    testimonialGridContentSchema,
    faqContentSchema,
    pricingTableContentSchema,
    alertContentSchema,
    contactFormStubContentSchema,
    gridContentSchema,
    collectionListContentSchema,
    videoContentSchema,
  ])
);

/**
 * All recognized built-in content type keys.
 * Used by the prebuild pipeline to validate the `type` field in YAML content files.
 */
export const KNOWN_CONTENT_TYPE_KEYS = [
  'carousel',
  'main',
  'tabbed_content',
  'media',
  'timeline',
  'icon_grid',
  'code_block',
  'feature_list',
  'testimonial_grid',
  'faq',
  'pricing_table',
  'alert',
  'contact_form_stub',
  'grid',
  'collection_list',
  'video',
] as const;

/** Union type of all known content type key strings. */
export type ContentItemType = (typeof KNOWN_CONTENT_TYPE_KEYS)[number];
