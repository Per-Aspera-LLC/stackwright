import React from 'react';
import { MainContent, GraphicPosition } from '@stackwright/types';
import { TextGrid } from './TextGrid';
import { ThemedButton } from './ThemedButton';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { Media } from '../media/Media';
import { resolveColor } from '../../utils/colorUtils';

export function MainContentGrid(content: MainContent) {
  const theme = useSafeTheme();

  const textPercent = content.textToGraphic ?? 58;
  const graphicPercent = 100 - textPercent;

  const headerColor = resolveColor(
    content.heading.textColor ? content.heading.textColor : theme.colors.primary,
    theme.colors
  );

  const imageGrid = content.media && (
    <div
      style={{
        flex: `0 1 calc(${graphicPercent}% - 8px)`,
        minWidth: 280,
        padding: theme.spacing.xs,
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <Media {...content.media} label={`${content.heading?.text} graphic`} />
      </div>
    </div>
  );

  const textGrid = (
    <div
      style={{
        flex: `1 1 calc(${content.media ? textPercent : 100}% - 8px)`,
        minWidth: 280,
        padding: theme.spacing.xs,
      }}
    >
      <div style={{ width: '100%', height: 'auto' }}>
        {content.heading?.text && (
          <h2 style={{ color: headerColor, margin: `0 0 ${theme.spacing.xs} 0` }}>
            {content.heading.text}
          </h2>
        )}
        {content.textBlocks && <TextGrid content={content.textBlocks} />}

        {content.buttons && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.md,
              marginTop: theme.spacing.md,
              justifyContent: 'center',
            }}
          >
            {content.buttons.map((button, index) => (
              <ThemedButton key={index} button={button} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const isGraphicLeft = content.graphic_position === GraphicPosition.LEFT;

  return (
    <div
      style={{
        padding: `${theme.spacing.md} 0`,
        background: content?.background || 'transparent',
        margin: theme.spacing.xl,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}
      >
        {content.media ? (
          isGraphicLeft ? (
            <>
              {imageGrid}
              {textGrid}
            </>
          ) : (
            <>
              {textGrid}
              {imageGrid}
            </>
          )
        ) : (
          textGrid
        )}
      </div>
    </div>
  );
}
