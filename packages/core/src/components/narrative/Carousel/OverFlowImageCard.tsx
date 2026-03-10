import React from 'react'
import { CarouselItem, MediaItem } from '@stackwright/types'
import { useSafeTheme } from '../../../hooks/useSafeTheme'
import { Media } from '../../media/Media'

interface OverflowImageCardProps {
  item: CarouselItem,
  minWidth: string,
  style?: React.CSSProperties
}

export const OverflowImageCard = ({ item, minWidth, style }: OverflowImageCardProps) => {
  const theme = useSafeTheme();

  const backgroundColor = item.background || theme.colors.accent;

  return (
    <div
      style={{
        padding: 0,
        position: 'relative',
        width: '100%',
        minWidth: minWidth,
        overflow: 'visible',
        top: '-45px',
        backgroundColor: backgroundColor,
        objectFit: 'cover',
        height: 'calc(100% + 60px)',
        borderRadius: '4px',
        ...style,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', backgroundColor: backgroundColor }}>
          <Media
            {...(item.media as MediaItem)}
            label={item.title}
            style="cover"
          />

          <h3
            style={{ margin: '8px', color: theme.colors.text, textAlign: 'center' }}
          >
            {item.title}
          </h3>

          <p
            style={{ margin: '16px', color: theme.colors.text }}
          >
            {item.text}
          </p>
        </div>
      </div>
    </div>
  )
}