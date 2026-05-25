import React from 'react';
import { TimelineContent, TimelineItem } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getThemeShadow } from '../../utils/shadowUtils';

type Theme = ReturnType<typeof useSafeTheme>;

// ---------------------------------------------------------------------------
// Shared dot style — per-item dotColor overrides theme.colors.primary
// ---------------------------------------------------------------------------

function makeDotStyle(
  item: TimelineItem,
  theme: Theme,
  extra?: React.CSSProperties
): React.CSSProperties {
  return {
    width: '16px',
    height: '16px',
    backgroundColor: item.dotColor ?? theme.colors.primary,
    borderRadius: '50%',
    border: `4px solid ${theme.colors.surface}`,
    boxShadow: getThemeShadow(theme, 'md'),
    ...extra,
  };
}

// ---------------------------------------------------------------------------
// Vertical layout (default)
// ---------------------------------------------------------------------------

function VerticalItems({ items, theme }: { items: TimelineItem[]; theme: Theme }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Vertical connecting line */}
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

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            marginBottom: theme.spacing.xl,
          }}
        >
          {/* Dot */}
          <div
            style={makeDotStyle(item, theme, { position: 'absolute', left: theme.spacing.lg })}
          />

          {/* Card */}
          <div style={{ marginLeft: `calc(${theme.spacing.xl} + ${theme.spacing.xl})` }}>
            <div
              style={{
                backgroundColor: item.cardBackground ?? theme.colors.surface,
                padding: theme.spacing.lg,
                borderRadius: '8px',
                boxShadow: getThemeShadow(theme, 'md'),
              }}
            >
              <h3
                style={{
                  color: item.yearColor ?? theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: theme.spacing.xs,
                  marginTop: 0,
                }}
              >
                {item.year}
              </h3>
              <p style={{ color: theme.colors.text, margin: 0 }}>{item.event}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Horizontal layout
// ---------------------------------------------------------------------------

function HorizontalItems({ items, theme }: { items: TimelineItem[]; theme: Theme }) {
  return (
    <div style={{ position: 'relative' }}>
      {/* Horizontal connecting line — aligned to dot centre (12px = half of 16px + 4px border) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: theme.colors.secondary,
        }}
      />

      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              minWidth: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: `0 ${theme.spacing.sm}`,
              position: 'relative',
            }}
          >
            {/* Dot */}
            <div style={makeDotStyle(item, theme)} />

            {/* Year */}
            <h3
              style={{
                color: item.yearColor ?? theme.colors.primary,
                fontWeight: 'bold',
                marginBottom: theme.spacing.xs,
                marginTop: theme.spacing.xs,
                textAlign: 'center',
              }}
            >
              {item.year}
            </h3>

            {/* Event card */}
            <div
              style={{
                backgroundColor: item.cardBackground ?? theme.colors.surface,
                padding: theme.spacing.sm,
                borderRadius: '8px',
                boxShadow: getThemeShadow(theme, 'md'),
                width: '100%',
              }}
            >
              <p style={{ color: theme.colors.text, margin: 0, textAlign: 'center' }}>
                {item.event}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline — public component
// ---------------------------------------------------------------------------

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

      {content.layout === 'horizontal' ? (
        <HorizontalItems items={content.items} theme={theme} />
      ) : (
        <VerticalItems items={content.items} theme={theme} />
      )}
    </div>
  );
}

export default Timeline;
