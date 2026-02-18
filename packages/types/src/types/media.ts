import React from 'react';
import { BaseContent } from './base';
import { MediaStyleVariant, TypographyVariant } from './enums';

// Simple, focused media types
export interface MediaContent extends BaseContent {
  // Use 'src' instead of 'source' to match HTML/Next.js conventions
    src: string;
    alt?: string;
    height?: number | string;
    width?: number | string;
    style?: MediaStyleVariant;
}

export interface IconContent extends MediaContent {
    type: "icon";
    size?: number | TypographyVariant;
    color?: string;
}

export interface ImageContent extends MediaContent {
    type: "image";
    aspect_ratio?: number;
}

// Union type for schemas 
export type MediaItem = MediaContent | IconContent | ImageContent;
