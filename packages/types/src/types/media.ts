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
  // Icons can have typography-based sizing
  size?: number | TypographyVariant;
  color?: string; // Inherited from BaseContent but commonly used for icons
}

export interface ImageContent extends MediaContent {
  aspect_ratio?: number;
}

// Union type for schemas 
export type MediaItem = MediaContent | IconContent | ImageContent;
