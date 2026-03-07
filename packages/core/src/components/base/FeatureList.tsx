import React from 'react';
import { FeatureListContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';

export function FeatureList({
  heading,
  columns: _columns = 3,
  items,
  background,
}: FeatureListContent) {
  const theme = useSafeTheme();

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: background || 'transparent',
      }}
    >
      {heading?.text && (
        <h3
          style={{
            color: headingColor,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
          }}
        >
          {heading.text}
        </h3>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: theme.spacing.xl,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: theme.spacing.sm,
            }}
          >
            {item.icon && (
              <div style={{ marginBottom: theme.spacing.xs }}>
                <Media
                  {...item.icon}
                  alt={item.icon.alt || item.heading}
                  label={item.heading}
                  height={item.icon.height || 48}
                  width={item.icon.width || 48}
                  color={item.icon.color || theme.colors.primary}
                />
              </div>
            )}
            <h4
              style={{
                color: theme.colors.text,
                margin: 0,
                fontWeight: 600,
              }}
            >
              {item.heading}
            </h4>
            <p
              style={{
                color: theme.colors.text,
                margin: 0,
                opacity: 0.8,
                lineHeight: 1.6,
              }}
            >
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
