'use client';

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../cn';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
  href?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler;
  startIcon?: React.ReactNode;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[var(--sw-color-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--sw-color-secondary)] text-white hover:opacity-90',
  outline:
    'border border-[var(--sw-color-primary)] text-[var(--sw-color-primary)] bg-transparent hover:bg-[var(--sw-color-primary)] hover:text-white',
  text: 'text-[var(--sw-color-primary)] bg-transparent hover:opacity-75',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'cursor-pointer select-none whitespace-nowrap';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  href,
  children,
  startIcon,
  ...props
}: ButtonProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (asChild) {
    return (
      <Slot className={classes} {...(props as any)}>
        {children}
      </Slot>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target={props.target} rel={props.rel} style={props.style}>
        {startIcon}
        {children}
      </a>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      className={classes}
      disabled={props.disabled}
      onClick={props.onClick}
      style={props.style}
    >
      {startIcon}
      {children}
    </button>
  );
}
