import React from 'react';
import { MediaStyleVariant } from '@stackwright/types';

interface MediaContainerProps {
  children: React.ReactNode;
  height?: string | number;
  width?: string | number;
  aspectRatio?: string | number;
  maxSize?: string | number;
  style?: MediaStyleVariant;
}

export function MediaContainer({
  children,
  height,
  width,
  aspectRatio,
  maxSize,
  style = 'contained',
}: MediaContainerProps) {
  const getSmartHeight = (): string | number => {
    if (height !== undefined) return height;
    if (aspectRatio) return 'auto';
    return '200px';
  };

  const getSmartWidth = (): string | number => {
    if (width !== undefined) return width;
    if (aspectRatio) return '100%';
    return '200px';
  };

  const objectFit = style === 'contained' ? 'contain' : 'cover';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        height: getSmartHeight(),
        width: getSmartWidth(),
        aspectRatio: aspectRatio != null ? String(aspectRatio) : undefined,
        maxWidth: maxSize != null ? maxSize : undefined,
        maxHeight: maxSize != null ? maxSize : undefined,
        margin: '0 auto',
        overflow: style === 'contained' ? 'hidden' : 'visible',
      }}
      data-sw-object-fit={objectFit}
    >
      {children}
    </div>
  );
}
