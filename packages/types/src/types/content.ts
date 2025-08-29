import { BaseContent, TextBlock, ButtonContent } from './base';
import { IconContent, MediaContent, MediaItem } from './media';
import { MenuContent } from './navigation';
import { GraphicPosition } from './enums';

export interface CarouselItem {
    title: string
    text: string
    media: MediaItem
    background?: string
}

export interface CarouselContent extends BaseContent {
    heading: string
    autoPlaySpeed?: number
    infinite?: boolean
    autoPlay?: boolean
    background?: string
    items: CarouselItem[]
}

export interface MainContent extends BaseContent {
    heading: TextBlock
    textBlocks: TextBlock[]
    media?: MediaItem
    graphic_position?: GraphicPosition
    buttons?: ButtonContent[]
    textToGraphic?: number // Ratio of text to graphic width (0-100, default 58)
}

export interface TabbedContent extends BaseContent {
    heading: TextBlock
    tabs: ContentItem[]
}

export interface IconGridContent extends BaseContent {
    heading?: TextBlock
    icons: IconContent[]
}

export interface TimelineItem {
    year: string
    event: string
}

export interface TimelineContent extends BaseContent {
    heading?: TextBlock
    items: TimelineItem[]
}

export interface ContentItem {
    [key: string]: CarouselContent | MainContent | TabbedContent | MediaContent | ButtonContent | MenuContent | IconGridContent | TimelineContent
}