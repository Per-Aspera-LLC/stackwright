import React from 'react';
import { FaqContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';

export function Faq({ heading, items, background }: FaqContent) {
  const theme = useSafeTheme();

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme),
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
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.xs,
        }}
      >
        {items.map((item, index) => (
          <details
            key={index}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
          >
            <summary
              style={{
                padding: `${theme.spacing.md} ${theme.spacing.md}`,
                cursor: 'pointer',
                fontWeight: 600,
                color: theme.colors.text,
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              {item.question}
              <span
                aria-hidden="true"
                style={{
                  marginLeft: theme.spacing.md,
                  flexShrink: 0,
                  fontSize: '1.25rem',
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </summary>
            <div
              style={{
                padding: `0 ${theme.spacing.md} ${theme.spacing.md} ${theme.spacing.md}`,
                color: theme.colors.text,
                opacity: 0.8,
                lineHeight: 1.6,
              }}
            >
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
