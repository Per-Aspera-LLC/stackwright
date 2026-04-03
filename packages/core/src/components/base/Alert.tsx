import React from 'react';
import { AlertContent, AlertVariant } from '@stackwright/types';
import { useSafeColorMode, useSafeTheme } from '../../hooks/useSafeTheme';
import { hexToRgba } from '../../utils/colorUtils';
import { resolveBackground } from '../../utils/resolveBackground';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

// Light mode accent colors
const VARIANT_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  success: '#22c55e',
  danger: '#ef4444',
  note: '#6b7280',
  tip: '#8b5cf6',
} as const;

// Dark mode accent colors (higher contrast for dark backgrounds)
const VARIANT_COLORS_DARK = {
  info: '#60a5fa',
  warning: '#fbbf24',
  success: '#4ade80',
  danger: '#f87171',
  note: '#94a3b8',
  tip: '#a78bfa',
} as const;

const ICON_NAMES: Record<AlertVariant, string> = {
  info: 'Info',
  warning: 'AlertTriangle',
  success: 'CheckCircle',
  danger: 'CircleAlert',
  note: 'Info',
  tip: 'CheckCircle',
};

export function Alert({ variant, title, body, background }: AlertContent) {
  const theme = useSafeTheme();
  const resolvedColorMode = useSafeColorMode();

  // Select appropriate accent color based on color mode
  const colors = resolvedColorMode === 'dark' ? VARIANT_COLORS_DARK : VARIANT_COLORS;
  const accentColor = colors[variant] || theme.colors.textSecondary;
  const alertBgColor = hexToRgba(accentColor, 0.1);

  const iconRegistry = getIconRegistry();
  const IconComponent = iconRegistry?.get(ICON_NAMES[variant]);

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: resolveBackground(background, theme, resolvedColorMode === 'dark'),
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
                color: theme.colors.text,
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
