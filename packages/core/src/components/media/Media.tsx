import React from 'react';
import { ImageContent, MediaContent, MediaItem } from '@stackwright/types';
import { MediaContainer } from './MediaContainer';
import { Typography } from '@mui/material';
import { getStackwrightImage } from '../../utils/stackwrightComponentRegistry';

// Simple type discrimination helpers
const isIconSource = (src: string): boolean => {
  return !src.includes('/') && 
         !src.includes('.') && 
         !src.startsWith('http') && 
         !src.startsWith('data:') &&
         src.length > 0;
};

const isImageSource = (src: string): boolean => {
  const lower = src.toLowerCase();
  return (
    lower.startsWith('./') || 
    lower.startsWith('http') || 
    lower.startsWith('data:') ||
    lower.startsWith('/')
  ) && (
    lower.endsWith('.png') || 
    lower.endsWith('.jpg') ||
    lower.endsWith('.webp') || 
    lower.endsWith('.bmp') ||
    lower.endsWith('.gif')
  );
};

// Simple, focused Media component
export function Media(content: MediaItem) {
  if(!content.src){
    return <Typography>No src set for Media</Typography>
  }

  let height = content?.height || 'auto';
  let width = content?.width || '100%';

  const renderIcon = () => {
    try {
      const iconRegistry = (globalThis as any).__stackwright_icon_registry__;
      const IconComponent = iconRegistry?.get?.(content.src);

      if (IconComponent) {
        return (
          <IconComponent 
            color={content.color || 'currentColor'} 
            height={height}
            width={width}
          />
        );
      }
      
      // Try MUI fallback
      const MuiIcons = require('@mui/icons-material');
      const MuiIcon = MuiIcons[content.src];
      if (MuiIcon) {
        return (
          <MuiIcon sx={{ 
            height: content.height || 24,
            width: content.width || 24,
            color: content.color || 'currentColor' 
          }} />
        );
      }
    } catch (error) {
      // Registry not available
    }
    
     console.warn(`Icon "${content.src}" not found. Install @stackwright/icons or use valid image path.`);
    return <Typography variant="caption">📷 {content.src}</Typography>;
  };

  const renderImage = () => {
    const StackwrightImage = getStackwrightImage();
    const  imageContent = (content as ImageContent);

    console.log(`Rendering imageContent ${imageContent}`);

  const shouldUseFill = (typeof imageContent.aspect_ratio == 'number' && imageContent.aspect_ratio > 0);
  const height = content.height || (shouldUseFill ? 400 : undefined);
  const width = (imageContent.aspect_ratio && typeof height == 'number')
      ? Math.round(height  / imageContent.aspect_ratio) : content.height;

    console.log(`Rendering image with fill: ${shouldUseFill}`)
    console.log(`             aspect_ratio: ${imageContent.aspect_ratio}`)
    console.log(`            content.width: ${imageContent.width}`)
    console.log(`           content.height: ${imageContent.height}`)

    console.log(`                    width: ${width}`)
    console.log(`                   height: ${height}`)

    
    return (
      <StackwrightImage
        src={content.src}
        alt={content.alt || content.label || ''}
        aspect_ratio={imageContent?.aspect_ratio || 0 }
        width={width}
        height={height}
        fill={shouldUseFill}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority={true}
      />
    );
  };

  let mediaElement: React.ReactNode;
  
  if (isIconSource(content.src)) {
    height = content?.height || '24px';
    width = content?.width || '24px';
    mediaElement = renderIcon();
  } else if (isImageSource(content.src)) {
    mediaElement = renderImage();
  } else {
    // Fallback for unknown types
    console.warn(`Unknown media type for: ${content.src}`);
    mediaElement = <Typography variant="caption">❓ Unknown media: {content.src}</Typography>;
  }

  console.log(`Rendering Media Content: `  )

  return (
    <MediaContainer
      height={height}
      width={width}
      style={content?.style}
    >
      {mediaElement}
    </MediaContainer>
  );
}