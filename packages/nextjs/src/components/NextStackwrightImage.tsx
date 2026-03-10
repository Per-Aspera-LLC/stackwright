import React from 'react';
import Image from 'next/image';
import { StackwrightImageProps } from '@stackwright/core';

export const NextStackwrightImage: React.FC<StackwrightImageProps> = ({
  src,
  alt,
  aspect_ratio,
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
  console.log('Returning NextjsStackwrightImage for src: ', src);

  // Debug the Image component itself
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log('📸 NextStackwrightImage Debug: Image component type:', typeof Image);
    console.log('📸 NextStackwrightImage Debug: Image component name:', Image?.name);
  }

  const imageProps = {
    src,
    alt,
    aspect_ratio,
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
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true')
    console.log('📸 NextStackwrightImage Debug: Image props:', imageProps);

  try {
    const ImageComponent =
      typeof Image === 'object' && 'default' in Image ? (Image as any).default : Image;

    return React.createElement(ImageComponent, imageProps);
  } catch (error) {
    if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
      console.log('📸 NextStackwrightImage Debug: Error creating image element:', error);
    }
    throw error;
  }
};
