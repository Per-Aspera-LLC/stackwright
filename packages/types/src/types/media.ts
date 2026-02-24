import { BaseContent } from './base';
import { MediaStyleVariant, TypographyVariant } from './enums';

// Shared fields for all media types (no `type` discriminator here).
interface MediaBase extends BaseContent {
    // Use 'src' instead of 'source' to match HTML/Next.js conventions
    src: string;
    alt?: string;
    height?: number | string;
    width?: number | string;
    style?: MediaStyleVariant;
}

// Bare media — path/URL only, let the renderer heuristically decide icon vs image.
export interface MediaContent extends MediaBase {
    type: "media";
}

export interface IconContent extends MediaBase {
    type: "icon";
    size?: number | TypographyVariant;
    color?: string;
}

export interface ImageContent extends MediaBase {
    type: "image";
    aspect_ratio?: number;
}

// Properly discriminated union — `type` is required on all three members.
export type MediaItem = MediaContent | IconContent | ImageContent;
