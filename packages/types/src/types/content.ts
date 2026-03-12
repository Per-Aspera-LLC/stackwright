import { z } from 'zod';
import { baseContentSchema, textBlockSchema, buttonContentSchema } from './base';
import { iconContentSchema, mediaContentSchema, mediaItemSchema } from './media';
import { graphicPositionSchema } from './enums';
import type { TextBlock } from './base';

export const carouselItemSchema = z.object({
  title: z.string(),
  text: z.string(),
  media: mediaItemSchema,
  background: z.string().optional(),
});

export const carouselContentSchema = baseContentSchema.extend({
  heading: z.string(),
  autoPlaySpeed: z.number().optional(),
  infinite: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  background: z.string().optional(),
  items: z.array(carouselItemSchema),
});

export const mainContentSchema = baseContentSchema.extend({
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
  heading: textBlockSchema.optional(),
  items: z.array(timelineItemSchema),
});

export const iconGridContentSchema = baseContentSchema.extend({
  heading: textBlockSchema.optional(),
  icons: z.array(iconContentSchema),
});

export const codeBlockContentSchema = baseContentSchema.extend({
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
  heading: textBlockSchema.optional(),
  columns: z.number().optional(),
  items: z.array(testimonialItemSchema),
});

export const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const faqContentSchema = baseContentSchema.extend({
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
  heading: textBlockSchema.optional(),
  plans: z.array(pricingPlanSchema),
});

export const alertVariantSchema = z.enum(['info', 'warning', 'success', 'danger', 'note', 'tip']);

export const alertContentSchema = baseContentSchema.extend({
  variant: alertVariantSchema,
  title: z.string().optional(),
  body: z.string(),
});

export const contactFormStubContentSchema = baseContentSchema.extend({
  heading: textBlockSchema.optional(),
  description: z.string().optional(),
  email: z.string(),
  email_subject: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  button_text: z.string().optional(),
});

// ContentItem and TabbedContent are mutually recursive: TabbedContent.tabs is ContentItem[],
// and ContentItem contains tabbed_content?: TabbedContent.
// We break the cycle with explicit TypeScript interface declarations + z.lazy().

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

export interface GridColumn {
  width?: number;
  content_items: ContentItem[];
}

export interface GridContent {
  label: string;
  color?: string;
  background?: string;
  heading?: TextBlock;
  columns: GridColumn[];
  gap?: string;
  stackBelow?: number;
}

export interface TabbedContent {
  label: string;
  color?: string;
  background?: string;
  heading: TextBlock;
  tabs: ContentItem[];
}

export interface ContentItem {
  carousel?: CarouselContent;
  main?: MainContent;
  tabbed_content?: TabbedContent;
  media?: import('./media').MediaContent;
  timeline?: TimelineContent;
  icon_grid?: IconGridContent;
  code_block?: CodeBlockContent;
  feature_list?: FeatureListContent;
  testimonial_grid?: TestimonialGridContent;
  faq?: FaqContent;
  pricing_table?: PricingTableContent;
  alert?: AlertContent;
  contact_form_stub?: ContactFormStubContent;
  grid?: GridContent;
}

export const gridColumnSchema: z.ZodType<GridColumn> = z.lazy(() =>
  z.object({
    width: z.number().optional(),
    content_items: z.array(contentItemSchema),
  })
);

export const gridContentSchema: z.ZodType<GridContent> = z.lazy(() =>
  baseContentSchema.extend({
    heading: textBlockSchema.optional(),
    columns: z.array(gridColumnSchema).min(1),
    gap: z.string().optional(),
    stackBelow: z.number().optional(),
  })
);

export const tabbedContentSchema: z.ZodType<TabbedContent> = z.lazy(() =>
  baseContentSchema.extend({
    heading: textBlockSchema,
    tabs: z.array(contentItemSchema),
  })
);

export const contentItemSchema: z.ZodType<ContentItem> = z.lazy(() =>
  z.object({
    carousel: carouselContentSchema.optional(),
    main: mainContentSchema.optional(),
    tabbed_content: tabbedContentSchema.optional(),
    media: mediaContentSchema.optional(),
    timeline: timelineContentSchema.optional(),
    icon_grid: iconGridContentSchema.optional(),
    code_block: codeBlockContentSchema.optional(),
    feature_list: featureListContentSchema.optional(),
    testimonial_grid: testimonialGridContentSchema.optional(),
    faq: faqContentSchema.optional(),
    pricing_table: pricingTableContentSchema.optional(),
    alert: alertContentSchema.optional(),
    contact_form_stub: contactFormStubContentSchema.optional(),
    grid: gridContentSchema.optional(),
  })
);

/**
 * All recognized built-in content type keys.
 * Used by the prebuild pipeline to warn on typos in YAML content files.
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
] as const;

export type ContentItemMap = {
  carousel: CarouselContent;
  main: MainContent;
  tabbed_content: TabbedContent;
  media: import('./media').MediaContent;
  timeline: TimelineContent;
  icon_grid: IconGridContent;
  code_block: CodeBlockContent;
  feature_list: FeatureListContent;
  testimonial_grid: TestimonialGridContent;
  faq: FaqContent;
  pricing_table: PricingTableContent;
  alert: AlertContent;
  contact_form_stub: ContactFormStubContent;
  grid: GridContent;
};
