import React from 'react';
import { SvgIconProps } from '@mui/material/SvgIcon';
import * as MuiIcons from '@mui/icons-material';
import { stackwrightIconRegistry } from '../registry/iconRegistry';

interface StackwrightIconProps extends SvgIconProps {
  name: string;
  fallback?: 'hide' | 'error' | 'mui-default';
}

export function StackwrightIcon({ 
  name, 
  fallback = 'mui-default', 
  ...props 
}: StackwrightIconProps) {
  // Get the custom icon with proper typing
  const customIcon = stackwrightIconRegistry.get(name);
  
  if (customIcon) {
    const IconComponent = customIcon as React.ComponentType<SvgIconProps>;
    return <IconComponent {...props} />;
  }

  // Fallback to MUI icons
  if (fallback === 'mui-default') {
    const MuiIcon = (MuiIcons as any)[name];
    if (MuiIcon) {
      return <MuiIcon {...props} />;
    }
  }

  // Handle missing icons based on fallback strategy
  if (fallback === 'hide') {
    return null;
  }

  if (fallback === 'error') {
    console.error(`Icon '${name}' not found in Stackwright icon registry or MUI icons`);
    return null;
  }

  // Default fallback
  return <MuiIcons.Help {...props} />;
}