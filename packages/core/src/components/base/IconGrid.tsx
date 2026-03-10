'use client';
import React from 'react';
import { IconGridContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

function renderIcon(src: string, sizePx: number, color: string) {
  const IconComponent = getIconRegistry()?.get(src);
  if (IconComponent) {
    return <IconComponent size={sizePx} color={color} />;
  }
  return <span style={{ color, fontFamily: 'monospace', fontSize: '0.75rem' }}>{src}</span>;
}

export function IconGrid({ heading, icons, background }: IconGridContent) {
  const theme = useSafeTheme();

  const headingColor = resolveColor(
    heading?.textColor ? heading.textColor : theme.colors.primary,
    theme.colors
  );

  return (
    <div
      style={{
        padding: '16px 0',
        background: background || 'transparent',
        margin: '32px',
      }}
    >
      {heading?.text && (
        <h3 style={{ color: headingColor, marginBottom: '24px', textAlign: 'center' }}>
          {heading.text}
        </h3>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '24px',
          justifyItems: 'center',
        }}
      >
        {icons.map((icon, index) => {
          const iconColor = icon.color
            ? resolveColor(icon.color, theme.colors)
            : theme.colors.primary;
          const sizePx = typeof icon.height === 'number' ? icon.height : 48;

          return (
            <div
              key={index}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: sizePx,
                  width: sizePx,
                }}
              >
                {renderIcon(icon.src, sizePx, iconColor)}
              </div>
              {icon.label && (
                <span
                  style={{
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    color: theme.colors.text,
                    fontWeight: 500,
                  }}
                >
                  {icon.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
