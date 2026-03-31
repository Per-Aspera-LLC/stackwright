import React from 'react';
import { AlertContent, AlertVariant } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { hexToRgba } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

const variantConfig: Record<AlertVariant, { color: string; iconName: string }> = {
  info: { color: '#3b82f6', iconName: 'Info' },
  warning: { color: '#f59e0b', iconName: 'AlertTriangle' },
  success: { color: '#22c55e', iconName: 'CheckCircle' },
  danger: { color: '#ef4444', iconName: 'CircleAlert' },
  note: { color: '', iconName: 'Info' },
  tip: { color: '#8b5cf6', iconName: 'CheckCircle' },
};

export function Alert({ variant, title, body, background }: AlertContent) {
  const theme = useSafeTheme();
  const config = variantConfig[variant];
  const accentColor = config.color || theme.colors.textSecondary;
  const alertBgColor = hexToRgba(accentColor, 0.1);

  const iconRegistry = getIconRegistry();
  const IconComponent = iconRegistry?.get(config.iconName);

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme),
      }}
    >
      <div
        role="alert"
        style={{
          maxWidth: '768px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.md} ${theme.spacing.md}`,
          backgroundColor: alertBgColor,
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: '8px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            marginTop: '2px',
            color: accentColor,
          }}
        >
          {IconComponent ? (
            <IconComponent size={20} color={accentColor} />
          ) : (
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>
              {variant === 'success'
                ? '\u2713'
                : variant === 'danger'
                  ? '\u2717'
                  : variant === 'warning'
                    ? '\u26A0'
                    : '\u2139'}
            </span>
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div
              style={{
                fontWeight: 600,
                color: accentColor,
                marginBottom: body ? '4px' : 0,
              }}
            >
              {title}
            </div>
          )}
          <div
            style={{
              color: theme.colors.text,
              lineHeight: 1.6,
              opacity: 0.9,
            }}
          >
            {body}
          </div>
        </div>
      </div>
    </section>
  );
}
