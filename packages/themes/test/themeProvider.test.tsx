import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useState } from 'react';
import { ThemeProvider, useTheme, themeToCSSVars, ThemeStyleInjector } from '../src/ThemeProvider';
import type { Theme } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeTheme = (overrides: Partial<Theme> = {}): Theme => ({
  id: 'test',
  name: 'Test Theme',
  description: 'Test theme',
  colors: {
    primary: '#ff0000',
    secondary: '#00ff00',
    accent: '#0000ff',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#000000',
    textSecondary: '#666666',
  },
  typography: {
    fontFamily: { primary: 'Inter, sans-serif', secondary: 'Georgia, serif' },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  ...overrides,
});

// Component that consumes the theme context for testing
function ThemeConsumer() {
  const { theme } = useTheme();
  return (
    <div>
      <span data-testid="theme-name">{theme.name}</span>
      <span data-testid="primary-color">{theme.colors.primary}</span>
      <span data-testid="font-primary">{theme.typography.fontFamily.primary}</span>
      <span data-testid="spacing-md">{theme.spacing.md}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ThemeProvider + useTheme
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  it('provides theme values to children via useTheme', () => {
    const theme = makeTheme({ name: 'My Theme' });
    render(
      <ThemeProvider theme={theme}>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-name')).toHaveTextContent('My Theme');
    expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
    expect(screen.getByTestId('font-primary')).toHaveTextContent('Inter, sans-serif');
    expect(screen.getByTestId('spacing-md')).toHaveTextContent('1rem');
  });

  it('allows theme to be updated via setTheme', () => {
    const initialTheme = makeTheme({ name: 'Initial' });
    const updatedTheme = makeTheme({
      name: 'Updated',
      colors: { ...makeTheme().colors, primary: '#abcdef' },
    });

    function ThemeSwitcher() {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="current-name">{theme.name}</span>
          <span data-testid="current-primary">{theme.colors.primary}</span>
          <button onClick={() => setTheme(updatedTheme)}>Switch</button>
        </div>
      );
    }

    render(
      <ThemeProvider theme={initialTheme}>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-name')).toHaveTextContent('Initial');
    expect(screen.getByTestId('current-primary')).toHaveTextContent('#ff0000');

    act(() => {
      screen.getByText('Switch').click();
    });

    expect(screen.getByTestId('current-name')).toHaveTextContent('Updated');
    expect(screen.getByTestId('current-primary')).toHaveTextContent('#abcdef');
  });
});

describe('useTheme', () => {
  it('throws when used outside ThemeProvider', () => {
    // Suppress React error boundary output for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      useTheme();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow('useTheme must be used within a ThemeProvider');

    consoleSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// themeToCSSVars
// ---------------------------------------------------------------------------

describe('themeToCSSVars', () => {
  it('generates all expected CSS custom properties', () => {
    const theme = makeTheme();
    const vars = themeToCSSVars(theme);

    expect(vars['--sw-color-primary']).toBe('#ff0000');
    expect(vars['--sw-color-secondary']).toBe('#00ff00');
    expect(vars['--sw-color-accent']).toBe('#0000ff');
    expect(vars['--sw-color-bg']).toBe('#ffffff');
    expect(vars['--sw-color-surface']).toBe('#f5f5f5');
    expect(vars['--sw-color-text']).toBe('#000000');
    expect(vars['--sw-color-text-secondary']).toBe('#666666');
  });

  it('maps typography font families', () => {
    const theme = makeTheme();
    const vars = themeToCSSVars(theme);

    expect(vars['--sw-font-primary']).toBe('Inter, sans-serif');
    expect(vars['--sw-font-secondary']).toBe('Georgia, serif');
  });

  it('maps spacing tokens', () => {
    const theme = makeTheme();
    const vars = themeToCSSVars(theme);

    expect(vars['--sw-spacing-xs']).toBe('0.25rem');
    expect(vars['--sw-spacing-sm']).toBe('0.5rem');
    expect(vars['--sw-spacing-md']).toBe('1rem');
    expect(vars['--sw-spacing-lg']).toBe('1.5rem');
    expect(vars['--sw-spacing-xl']).toBe('2rem');
    expect(vars['--sw-spacing-2xl']).toBe('3rem');
  });

  it('uses fallback values when typography is missing', () => {
    const theme = makeTheme();
    // @ts-ignore — testing runtime fallback behavior
    delete theme.typography;
    const vars = themeToCSSVars(theme);

    expect(vars['--sw-font-primary']).toBe('sans-serif');
    expect(vars['--sw-font-secondary']).toBe('sans-serif');
  });

  it('uses fallback values when spacing is missing', () => {
    const theme = makeTheme();
    // @ts-ignore — testing runtime fallback behavior
    delete theme.spacing;
    const vars = themeToCSSVars(theme);

    expect(vars['--sw-spacing-xs']).toBe('0.25rem');
    expect(vars['--sw-spacing-md']).toBe('1rem');
    expect(vars['--sw-spacing-2xl']).toBe('3rem');
  });
});

// ---------------------------------------------------------------------------
// ThemeStyleInjector
// ---------------------------------------------------------------------------

describe('ThemeStyleInjector', () => {
  it('renders children with CSS custom properties as inline styles', () => {
    const theme = makeTheme();
    render(
      <ThemeStyleInjector theme={theme}>
        <span data-testid="child">Content</span>
      </ThemeStyleInjector>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    // The parent div should have CSS vars set as style
    const wrapper = screen.getByTestId('child').parentElement!;
    expect(wrapper.style.getPropertyValue('--sw-color-primary')).toBe('#ff0000');
    expect(wrapper.style.getPropertyValue('--sw-spacing-md')).toBe('1rem');
    expect(wrapper.style.getPropertyValue('--sw-font-primary')).toBe('Inter, sans-serif');
  });

  it('applies className to wrapper div', () => {
    const theme = makeTheme();
    const { container } = render(
      <ThemeStyleInjector theme={theme} className="app-root">
        <span>Content</span>
      </ThemeStyleInjector>
    );

    const wrapper = container.firstElementChild!;
    expect(wrapper).toHaveClass('app-root');
  });
});
