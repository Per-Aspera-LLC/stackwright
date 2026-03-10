import React, { createContext, useContext, useState, ReactNode, CSSProperties } from 'react';
import { Theme } from './types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ theme: initialTheme, children }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Converts a Stackwright Theme to CSS custom properties.
 * Inject these via ThemeStyleInjector or a <style> tag.
 */
export function themeToCSSVars(theme: Theme): Record<string, string> {
  return {
    '--sw-color-primary': theme.colors.primary,
    '--sw-color-secondary': theme.colors.secondary,
    '--sw-color-accent': theme.colors.accent,
    '--sw-color-bg': theme.colors.background,
    '--sw-color-surface': theme.colors.surface,
    '--sw-color-text': theme.colors.text,
    '--sw-color-text-secondary': theme.colors.textSecondary,
    '--sw-font-primary': theme.typography?.fontFamily?.primary ?? 'sans-serif',
    '--sw-font-secondary': theme.typography?.fontFamily?.secondary ?? 'sans-serif',
    '--sw-spacing-xs': theme.spacing?.xs ?? '0.25rem',
    '--sw-spacing-sm': theme.spacing?.sm ?? '0.5rem',
    '--sw-spacing-md': theme.spacing?.md ?? '1rem',
    '--sw-spacing-lg': theme.spacing?.lg ?? '1.5rem',
    '--sw-spacing-xl': theme.spacing?.xl ?? '2rem',
    '--sw-spacing-2xl': theme.spacing?.['2xl'] ?? '3rem',
  };
}

interface ThemeStyleInjectorProps {
  theme: Theme;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps children in a div that injects Stackwright CSS custom properties.
 * Place this at the top of the component tree alongside ThemeProvider.
 */
export function ThemeStyleInjector({ theme, children, className }: ThemeStyleInjectorProps) {
  const cssVars = themeToCSSVars(theme);
  return (
    <div className={className} style={cssVars as CSSProperties}>
      {children}
    </div>
  );
}