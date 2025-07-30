import { TypographyVariant, ButtonVariant, AlignmentVariant, GraphicVariant } from './enums';

export interface BaseContent {
    label: string
    color?: string
    background?: string
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

export interface GraphicContent extends BaseContent {
    image: string;
    alt?: string;
    aspect_ratio?: number;
    min_size?: number;
    max_size?: number;
    variant?: GraphicVariant;
}