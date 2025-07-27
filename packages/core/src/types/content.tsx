import { Color } from "@mui/material"

export enum GraphicPosition {
    LEFT = 'left',
    RIGHT = 'right'
}

export type TypographyVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'button' | 'overline'
export type ButtonVariant = 'text' | 'outlined' | 'contained'
export type AlignmentVariant = 'left' | 'center' | 'right'
export type GraphicVariant = 'contained' | 'overflow'

export interface BaseContent {
    label: string
    color?: string
    background?: string
}

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

export interface GraphicContent extends BaseContent {
    image: string
    aspect_ratio?: number
    min_size?: number
    max_size?: number
    variant?: GraphicVariant
}

export interface TabbedContent extends BaseContent {
    heading: TextBlock
    tabs: ContentItem[]
}

export interface TextBlock {
    text: string
    size: TypographyVariant
    color?: string
}

export interface ButtonContent extends BaseContent, TextBlock {
    variant: ButtonVariant
    href?: string
    action?: string
    image?: string
    alignment?: AlignmentVariant
    buttonColor?: string
    buttonBackground?: string
}

export interface MenuContent extends ButtonContent {
    menu_items?: MenuContent[]
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

export interface MenuTheme {
    colors: {
        default: MenuColorSet
        contained: MenuColorSet
        outlined: MenuColorSet
    }
}

interface MenuColorSet {
    background: string
    text: string
    hover: string
    border?: string
}


export interface AppBarLogo {
    image: string
    aspect_ratio: string
}

export interface AppBarContent {
  title: string;
  logo?: {
    image: string;
    width?: number;
    height?: number;
  };
  menuItems?: NavigationItem[]; 
  textcolor?: string
  backgroundcolor?: string
}

export interface NavigationItem {
  label: string;
  href: string;
}

export interface FooterContent extends BaseContent {
    copyright: string
    buttons: ButtonContent[]
    sociallinks?: ButtonContent[]
    socialtext?: string

}



export interface PageContent {
    content: {
        app_bar?: AppBarContent
        footer?: FooterContent
        content_items: ContentItem[],
        list_icon?: String
    }
}