import React from 'react';
import NextImage from 'next/image';
import { StackwrightImageProps } from '@stackwright/core';

// Extract the actual Image component from the ES module
const Image = (NextImage as any)?.default || NextImage;

export const NextStackwrightImage: React.FC<StackwrightImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  fill = false,
  sizes,
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  className,
  style,
  ...props
}) => {
  console.log("Returning NextjsStackwrightImage for src: ", src);
  
  // Debug the Image component itself
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log('📸 NextStackwrightImage Debug: Image component type:', typeof Image);
    console.log('📸 NextStackwrightImage Debug: Image component name:', Image?.name);
    console.log('📸 NextStackwrightImage Debug: Image component constructor:', Image?.constructor?.name);
    console.log('📸 NextStackwrightImage Debug: Is Image a function:', typeof Image === 'function');
    console.log('📸 NextStackwrightImage Debug: Is Image an object:', typeof Image === 'object');
    
    if (typeof Image === 'object' && Image !== null) {
      console.log('📸 NextStackwrightImage Debug: Image object keys:', Object.keys(Image));
      console.log('📸 NextStackwrightImage Debug: Has default:', 'default' in Image);
      if ('default' in Image) {
        console.log('📸 NextStackwrightImage Debug: Default type:', typeof (Image as any).default);
        console.log('📸 NextStackwrightImage Debug: Default name:', (Image as any).default?.name);
      }
    }
    
    console.log('📸 NextStackwrightImage Debug: Props being passed:', {
      src,
      alt,
      width: fill ? undefined : (typeof width === 'number' ? width : parseInt(String(width)) || undefined),
      height: fill ? undefined : (typeof height === 'number' ? height : parseInt(String(height)) || undefined),
      fill,
      priority,
      quality,
      sizes,
      placeholder,
      blurDataURL,
      className,
      style
    });
  }
  
  try {
    const imageElement = (
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : (typeof width === 'number' ? width : parseInt(String(width)) || undefined)}
        height={fill ? undefined : (typeof height === 'number' ? height : parseInt(String(height)) || undefined)}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={onLoad}
        onError={onError}
        className={className}
        style={style}
        {...props}
      />
    );
    
    if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
      console.log('📸 NextStackwrightImage Debug: Created image element:', {
        type: typeof imageElement,
        elementType: imageElement?.type,
        elementTypeOf: typeof imageElement?.type,
        props: imageElement?.props
      });
    }
    
    return imageElement;
  } catch (error) {
    if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
      console.log('📸 NextStackwrightImage Debug: Error creating image element:', error);
    }
    throw error;
  }
};