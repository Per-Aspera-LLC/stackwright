import React from 'react';
import { cn } from '../cn';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className, orientation = 'horizontal' }: SeparatorProps) {
  return (
    <hr
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'border-[var(--sw-color-surface)]',
        orientation === 'horizontal' ? 'w-full border-t my-4' : 'h-full border-l mx-4',
        className
      )}
    />
  );
}
