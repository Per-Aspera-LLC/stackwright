import React from 'react';
import Image from 'next/image';
import { StackwrightImageProps } from '@stackwright/core';

const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`📸 NextStackwrightImage Debug: ${message}`, data ? data : '');
  }
};

export const NextStackwrightImage: React.FC<StackwrightImageProps> = ({
  src,
  alt,
  aspect_ratio: _aspect_ratio,
  width,
  height,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  placeholder,
  blurDataURL,
  onLoad: _onLoad,
  onError: _onError,
  className,
  style,
  ..._props
}) => {
  debugLog('Rendering image', { src });
  debugLog('Image component type:', { type: typeof Image, name: Image?.name });

  const imageProps = {
    src,
    alt,
    width: fill
      ? undefined
      : typeof width === 'number'
        ? width
        : parseInt(String(width)) || undefined,
    height: fill
      ? undefined
      : typeof height === 'number'
        ? height
        : parseInt(String(height)) || undefined,
    fill,
    priority,
    quality,
    sizes,
    placeholder,
    blurDataURL,
    className,
    style,
  };
  debugLog('Image props:', imageProps);

  try {
    const ImageComponent =
      typeof Image === 'object' && 'default' in Image ? (Image as any).default : Image;

    return React.createElement(ImageComponent, imageProps);
  } catch (error) {
    debugLog('Error creating image element:', error);
    throw error;
  }
};
