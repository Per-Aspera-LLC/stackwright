import { BaseContent, TextBlock, ButtonContent, GraphicContent } from './base';
import { MenuContent } from './navigation';
import { GraphicPosition } from './enums';

export interface CarouselItem {
    title: string
    text: string
    image: GraphicContent
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
    graphic?: GraphicContent
    graphic_position?: GraphicPosition
    buttons?: ButtonContent[]
    textToGraphic?: number // Ratio of text to graphic width (0-100, default 58)
}

export interface TabbedContent extends BaseContent {
    heading: TextBlock
    tabs: ContentItem[]
}

export interface IconGridItem {
    iconId: string
    spriteSheet?: string
    text: TextBlock
}

export interface IconGridContent extends BaseContent {
    heading?: TextBlock
    icons: IconGridItem[]
    spriteSheet?: string
    iconsPerRow: number
    patternPrefix?: string
    patternSuffix?: string
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
    [key: string]: CarouselContent | MainContent | TabbedContent | GraphicContent | ButtonContent | MenuContent | IconGridContent | TimelineContent
}