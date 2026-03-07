import React from 'react';
import { AlertContent, AlertVariant } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getIconRegistry } from '../../utils/stackwrightComponentRegistry';

const variantConfig: Record<AlertVariant, { color: string; bgColor: string; iconName: string }> = {
  info: { color: '#2563eb', bgColor: '#eff6ff', iconName: 'Info' },
  warning: { color: '#d97706', bgColor: '#fffbeb', iconName: 'AlertTriangle' },
  success: { color: '#16a34a', bgColor: '#f0fdf4', iconName: 'CheckCircle' },
  danger: { color: '#dc2626', bgColor: '#fef2f2', iconName: 'CircleAlert' },
  note: { color: '#6b7280', bgColor: '#f9fafb', iconName: 'Info' },
  tip: { color: '#7c3aed', bgColor: '#f5f3ff', iconName: 'CheckCircle' },
};

export function Alert({ variant, title, body, background }: AlertContent) {
  const theme = useSafeTheme();
  const config = variantConfig[variant];

  const iconRegistry = getIconRegistry();
  const IconComponent = iconRegistry?.get(config.iconName);

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: background || 'transparent',
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
          backgroundColor: config.bgColor,
          borderLeft: `4px solid ${config.color}`,
          borderRadius: '8px',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flexShrink: 0,
            marginTop: '2px',
            color: config.color,
          }}
        >
          {IconComponent ? (
            <IconComponent size={20} color={config.color} />
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
                color: config.color,
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
