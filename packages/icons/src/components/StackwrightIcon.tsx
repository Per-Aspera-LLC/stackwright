import React from 'react';
import { IconProps, stackwrightIconRegistry } from '../registry/iconRegistry';

interface StackwrightIconProps extends IconProps {
  name: string;
  fallback?: 'hide' | 'error';
}

// Simple question-mark SVG used when no icon is registered and fallback isn't 'hide'
function UnknownIcon({ size = 24, color = 'currentColor', className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function StackwrightIcon({ name, fallback = 'hide', ...props }: StackwrightIconProps) {
  const customIcon = stackwrightIconRegistry.get(name);

  if (customIcon) {
    const IconComponent = customIcon;
    return <IconComponent {...props} />;
  }

  if (fallback === 'error') {
    console.error(`Icon '${name}' not found in Stackwright icon registry`);
    return null;
  }

  if (fallback === 'hide') {
    return null;
  }

  return <UnknownIcon {...props} />;
}
