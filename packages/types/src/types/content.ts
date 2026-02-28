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
}

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
    })
);

export type ContentItemMap = {
    carousel: CarouselContent;
    main: MainContent;
    tabbed_content: TabbedContent;
    media: import('./media').MediaContent;
    timeline: TimelineContent;
    icon_grid: IconGridContent;
    code_block: CodeBlockContent;
};
