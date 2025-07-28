import React from 'react';
import { Button } from '@mui/material';
import { ButtonContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getHoverColor, resolveColor } from '../../utils/colorUtils';
import { getStackwrightImage } from '../../utils/stackwrightComponentRegistry';

interface ThemedButtonProps {
  button: ButtonContent;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  background?: string;
  className?: string;
}

export function ThemedButton({ 
  button, 
  size = 'large', 
  color,
  background,
  className 
}: ThemedButtonProps) {
  const theme = useSafeTheme();
  const StackwrightImage = getStackwrightImage();
  
  // Simple color resolution: use theme colors if name matches, otherwise use as-is
  const resolveColor = (colorValue: string) => {
    if (colorValue.startsWith('#')) return colorValue;
    return theme.colors[colorValue as keyof typeof theme.colors] || colorValue;
  };
  
  // Priority: button.buttonColor > color prop > theme.colors.accent
  const buttonTextColor = button.buttonColor 
    ? resolveColor(button.buttonColor)
    : color 
    ? resolveColor(color)
    : theme.colors.accent;
    
  // Priority: button.buttonBackground > background prop > theme.colors.primary
  const buttonColor = button.buttonBackground 
    ? resolveColor(button.buttonBackground)
    : background 
    ? resolveColor(background)
    : theme.colors.primary;
    
  const hoverColor = getHoverColor(buttonColor);

  return (
    <Button
      variant={button.variant}
      href={button.href}
      size={size}
      className={className}
      sx={{
          backgroundColor: buttonColor,
          color: buttonTextColor,
          '&:hover': {
            backgroundColor: hoverColor, 
        },
        textTransform: 'none'
      }}
      startIcon={button.image && (
        <StackwrightImage 
          src={button.image} 
          alt={button.label || button.text} 
          width={24} 
          height={24}
        />
      )}
    >
      {button.text}
    </Button>
  );
}  
