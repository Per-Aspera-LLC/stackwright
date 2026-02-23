import React from 'react';
import { Button, Typography } from '@mui/material';
import { ButtonContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { getBetterTextColor, getHoverColor, resolveColor } from '../../utils/colorUtils';
import { Media } from '../media/Media';

interface ThemedButtonProps {
  button: ButtonContent;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function ThemedButton({ 
  button,
  className 
}: ThemedButtonProps) {
  const theme = useSafeTheme();

  const buttonColor = button.bgColor ? resolveColor(button.bgColor, theme.colors) : theme.colors.primary;
  const buttonTextColor = button.textColor ? resolveColor(button.textColor, theme.colors) : theme.colors.text;

  const hoverColor = getHoverColor(buttonColor);

  const buttonSize = button.variantSize ? button.variantSize : 'medium';

  return (
    <Button
      variant={button.variant}
      href={button.href}
      size={buttonSize}
      className={className}
      sx={{
          backgroundColor: buttonColor,
          color: buttonTextColor,
          '&:hover': {
            backgroundColor: hoverColor,
        },
        textTransform: 'none'
      }}
      startIcon={button.icon && (
        <Media
          src={button.icon.src} 
          alt={''} 
          label={button.text.concat(' icon')}
          color={buttonTextColor}
        />
      )}
    >
        <Typography 
          variant={button.textSize} 
          sx={{
          color: buttonTextColor
          }}
          >
          {button.text}
        </Typography>
        
    </Button>
  );
}  
