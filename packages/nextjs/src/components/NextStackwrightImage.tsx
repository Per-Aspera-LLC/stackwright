import React from 'react';
import Image from 'next/image';
import { StackwrightImageProps } from '@stackwright/core';

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
  return (
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
};
