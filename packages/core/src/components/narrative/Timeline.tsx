import React from 'react';
import { TimelineContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getThemeShadow } from '../../utils/shadowUtils';

export function Timeline(content: TimelineContent) {
  const theme = useSafeTheme();

  return (
    <div
      style={{
        maxWidth: '896px',
        margin: `${theme.spacing.xl} auto`,
        padding: `${theme.spacing['2xl']} 0`,
        background: content?.background || 'transparent',
      }}
    >
      {content.heading && (
        <h3
          style={{
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
            color: content.heading.textColor || theme.colors.text,
          }}
        >
          {content.heading.text}
        </h3>
      )}

      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div
          style={{
            position: 'absolute',
            left: theme.spacing.xl,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: theme.colors.secondary,
          }}
        />

        {content.items.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              marginBottom: theme.spacing.xl,
            }}
          >
            {/* Timeline dot */}
            <div
              style={{
                position: 'absolute',
                left: theme.spacing.lg,
                width: '16px',
                height: '16px',
                backgroundColor: theme.colors.primary,
                borderRadius: '50%',
                border: `4px solid ${theme.colors.surface}`,
                boxShadow: getThemeShadow(theme, 'md'),
              }}
            />

            {/* Content */}
            <div style={{ marginLeft: `calc(${theme.spacing.xl} + ${theme.spacing.xl})` }}>
              <div
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: theme.spacing.lg,
                  borderRadius: '8px',
                  boxShadow: getThemeShadow(theme, 'md'),
                }}
              >
                <h4
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 'bold',
                    marginBottom: theme.spacing.xs,
                    marginTop: 0,
                  }}
                >
                  {item.year}
                </h4>
                <p style={{ color: theme.colors.text, margin: 0 }}>{item.event}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
