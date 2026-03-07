import React from 'react';
import { ButtonContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getHoverColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';

interface ThemedButtonProps {
  button: ButtonContent;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeStyles: Record<string, React.CSSProperties> = {
  small: { padding: '4px 10px', fontSize: '0.8125rem' },
  medium: { padding: '6px 16px', fontSize: '0.875rem' },
  large: { padding: '8px 22px', fontSize: '0.9375rem' },
};

const variantStyles = (
  variant: string | undefined,
  bgColor: string,
  textColor: string,
  _hoverColor: string
): React.CSSProperties => {
  switch (variant) {
    case 'outlined':
      return { backgroundColor: 'transparent', color: bgColor, border: `1px solid ${bgColor}` };
    case 'text':
      return { backgroundColor: 'transparent', color: textColor, border: 'none' };
    default: // 'contained'
      return { backgroundColor: bgColor, color: textColor, border: 'none' };
  }
};

export function ThemedButton({ button, className }: ThemedButtonProps) {
  const theme = useSafeTheme();

  const buttonColor = button.bgColor
    ? resolveColor(button.bgColor, theme.colors)
    : theme.colors.primary;
  const buttonTextColor = button.textColor
    ? resolveColor(button.textColor, theme.colors)
    : theme.colors.text;
  const hoverColor = getHoverColor(buttonColor);
  const buttonSize = button.variantSize || 'medium';

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    textTransform: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.75,
    transition: 'background-color 0.2s, box-shadow 0.2s',
    ...(sizeStyles[buttonSize] || sizeStyles.medium),
    ...variantStyles(button.variant, buttonColor, buttonTextColor, hoverColor),
  };

  const content = (
    <>
      {button.icon && (
        <Media
          src={button.icon.src}
          alt={''}
          label={button.text.concat(' icon')}
          color={buttonTextColor}
        />
      )}
      <span style={{ color: buttonTextColor }}>{button.text}</span>
    </>
  );

  if (button.href) {
    return (
      <a href={button.href} className={className} style={baseStyle}>
        {content}
      </a>
    );
  }

  return (
    <button className={className} style={baseStyle}>
      {content}
    </button>
  );
}
