import React from 'react';
import { MenuContent } from '@stackwright/types';
import { MenuThemeConfig } from './menuTheme';
interface MenuItemProps {
  item: MenuContent;
  isCompressed: boolean;
  getTextColor: (bg: string, variant?: string, emphasized?: boolean) => string;
  theme: MenuThemeConfig;
}

export const MenuItemComponent = ({ item, isCompressed, theme }: MenuItemProps) => {
  const effectiveVariant = isCompressed ? 'text' : item.variant;
  const isEmphasizedVariant = item.variant === 'contained' || item.variant === 'outlined';
  const colorSet = theme.colors[effectiveVariant as keyof typeof theme.colors] || theme.colors.default;

  const textColor = isCompressed && item.variant === 'contained'
    ? theme.colors.contained.background
    : colorSet.text;

  return (
    <a
      href={item.href || '#'}
      style={{
        display: 'block',
        padding: '8px 16px',
        backgroundColor: colorSet.background,
        color: colorSet.text,
        border: effectiveVariant === 'outlined' ? `1px solid ${colorSet.border}` : 'none',
        borderRadius: isEmphasizedVariant && !isCompressed ? '24px' : 0,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: textColor }}>
        {item.text}
      </span>
    </a>
  );
};