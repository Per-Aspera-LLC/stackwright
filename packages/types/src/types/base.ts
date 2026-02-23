import { TypographyVariant, ButtonVariant, AlignmentVariant, MediaStyleVariant, MediaVariant } from './enums';
import { MediaItem } from './media';

export interface BaseContent {
    label: string
    color?: string
    background?: string
}

export interface TextBlock {
    text: string
    textSize: TypographyVariant
    textColor?: string
}

export interface ButtonContent extends TextBlock {
    variant: ButtonVariant
    variantSize?: "small" | "medium" | "large"
    href?: string
    action?: string
    icon?: MediaItem
    alignment?: AlignmentVariant
    bgColor?: string
}

