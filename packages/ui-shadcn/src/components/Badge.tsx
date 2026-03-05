import React from 'react';
import { cn } from '../cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--sw-color-primary)] text-white',
  secondary: 'bg-[var(--sw-color-secondary)] text-white',
  outline: 'border border-[var(--sw-color-primary)] text-[var(--sw-color-primary)]',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
