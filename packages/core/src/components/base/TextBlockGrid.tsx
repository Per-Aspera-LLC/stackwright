import React from 'react';
import { TextBlockContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { TextGrid } from './TextGrid';
import { ThemedButton } from './ThemedButton';

export function TextBlockGrid({ heading, textBlocks, buttons, background }: TextBlockContent) {
  const theme = useSafeTheme();

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <section
      style={{
        padding: `${theme.spacing.md} 0`,
        background: background || 'transparent',
        margin: theme.spacing.xl,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: `0 ${theme.spacing.md}`,
        }}
      >
        {heading?.text && (
          <h2
            style={{
              color: headingColor,
              margin: `0 0 ${theme.spacing.md} 0`,
              textAlign: 'center',
            }}
          >
            {heading.text}
          </h2>
        )}

        {textBlocks && textBlocks.length > 0 && (
          <div style={{ marginBottom: buttons ? theme.spacing.md : 0 }}>
            <TextGrid content={textBlocks} />
          </div>
        )}

        {buttons && buttons.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: theme.spacing.md,
              marginTop: theme.spacing.md,
              justifyContent: 'center',
            }}
          >
            {buttons.map((button, index) => (
              <ThemedButton key={index} button={button} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
