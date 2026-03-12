import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import {
  ThemeProvider,
  useTheme,
  useThemeOptional,
  themeToCSSVars,
  ThemeStyleInjector,
} from '../src/ThemeProvider';
import type { Theme, ThemeColors } from '../src/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIGHT_COLORS: ThemeColors = {
  primary: '#ff0000',
  secondary: '#00ff00',
  accent: '#0000ff',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#000000',
  textSecondary: '#666666',
};

const DARK_COLORS: ThemeColors = {
  primary: '#ff6666',
  secondary: '#66ff66',
  accent: '#6666ff',
  background: '#111111',
  surface: '#222222',
  text: '#eeeeee',
  textSecondary: '#aaaaaa',
};

const makeTheme = (overrides: Partial<Theme> = {}): Theme => ({
  id: 'test',
  name: 'Test Theme',
  description: 'Test theme',
  colors: LIGHT_COLORS,
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

  it('reads theme from context when no theme prop is provided', () => {
    const theme = makeTheme();
    render(
      <ThemeProvider theme={theme}>
        <ThemeStyleInjector>
          <span data-testid="ctx-child">Context Content</span>
        </ThemeStyleInjector>
      </ThemeProvider>
    );

    const wrapper = screen.getByTestId('ctx-child').parentElement!;
    expect(wrapper.style.getPropertyValue('--sw-color-primary')).toBe('#ff0000');
  });

  it('renders children unstyled when no theme prop and no provider', () => {
    render(
      <ThemeStyleInjector>
        <span data-testid="bare-child">Bare Content</span>
      </ThemeStyleInjector>
    );

    // Should not crash; child should render
    expect(screen.getByTestId('bare-child')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// useThemeOptional
// ---------------------------------------------------------------------------

describe('useThemeOptional', () => {
  it('returns undefined when used outside ThemeProvider', () => {
    function OptionalConsumer() {
      const ctx = useThemeOptional();
      return <span data-testid="optional">{ctx ? 'has-context' : 'no-context'}</span>;
    }

    render(<OptionalConsumer />);
    expect(screen.getByTestId('optional')).toHaveTextContent('no-context');
  });

  it('returns context when inside ThemeProvider', () => {
    function OptionalConsumer() {
      const ctx = useThemeOptional();
      return <span data-testid="optional">{ctx ? 'has-context' : 'no-context'}</span>;
    }

    render(
      <ThemeProvider theme={makeTheme()}>
        <OptionalConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('optional')).toHaveTextContent('has-context');
  });
});

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------

describe('Dark mode', () => {
  const darkTheme = makeTheme({ darkColors: DARK_COLORS });

  it('defaults colorMode to system', () => {
    function ModeReader() {
      const { colorMode } = useTheme();
      return <span data-testid="mode">{colorMode}</span>;
    }

    render(
      <ThemeProvider theme={darkTheme}>
        <ModeReader />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('system');
  });

  it('uses light colors when colorMode is system and OS prefers light', () => {
    // Default matchMedia mock returns matches: false (light)
    render(
      <ThemeProvider theme={darkTheme}>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('primary-color')).toHaveTextContent(LIGHT_COLORS.primary);
  });

  it('switches to dark colors when setColorMode("dark") is called', () => {
    function DarkToggle() {
      const { theme, setColorMode, resolvedColorMode } = useTheme();
      return (
        <div>
          <span data-testid="bg">{theme.colors.background}</span>
          <span data-testid="resolved">{resolvedColorMode}</span>
          <button onClick={() => setColorMode('dark')}>Go Dark</button>
        </div>
      );
    }

    render(
      <ThemeProvider theme={darkTheme}>
        <DarkToggle />
      </ThemeProvider>
    );

    // Initially light
    expect(screen.getByTestId('bg')).toHaveTextContent(LIGHT_COLORS.background);
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');

    // Switch to dark
    act(() => {
      screen.getByText('Go Dark').click();
    });

    expect(screen.getByTestId('bg')).toHaveTextContent(DARK_COLORS.background);
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('switches back to light colors when setColorMode("light") is called', () => {
    function ModeToggle() {
      const { theme, setColorMode } = useTheme();
      return (
        <div>
          <span data-testid="bg">{theme.colors.background}</span>
          <button onClick={() => setColorMode('dark')}>Dark</button>
          <button onClick={() => setColorMode('light')}>Light</button>
        </div>
      );
    }

    render(
      <ThemeProvider theme={darkTheme}>
        <ModeToggle />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Dark').click();
    });
    expect(screen.getByTestId('bg')).toHaveTextContent(DARK_COLORS.background);

    act(() => {
      screen.getByText('Light').click();
    });
    expect(screen.getByTestId('bg')).toHaveTextContent(LIGHT_COLORS.background);
  });

  it('falls back to light colors when darkColors is not defined', () => {
    const noDarkTheme = makeTheme(); // no darkColors

    function DarkToggle() {
      const { theme, setColorMode } = useTheme();
      return (
        <div>
          <span data-testid="bg">{theme.colors.background}</span>
          <button onClick={() => setColorMode('dark')}>Go Dark</button>
        </div>
      );
    }

    render(
      <ThemeProvider theme={noDarkTheme}>
        <DarkToggle />
      </ThemeProvider>
    );

    act(() => {
      screen.getByText('Go Dark').click();
    });

    // Should gracefully stay with light colors — no crash
    expect(screen.getByTestId('bg')).toHaveTextContent(LIGHT_COLORS.background);
  });

  it('exposes rawTheme with both color sets intact', () => {
    function RawThemeReader() {
      const { rawTheme, setColorMode } = useTheme();
      return (
        <div>
          <span data-testid="raw-light">{rawTheme.colors.primary}</span>
          <span data-testid="raw-dark">{rawTheme.darkColors?.primary ?? 'none'}</span>
          <button onClick={() => setColorMode('dark')}>Dark</button>
        </div>
      );
    }

    render(
      <ThemeProvider theme={darkTheme}>
        <RawThemeReader />
      </ThemeProvider>
    );

    // rawTheme should always have original colors regardless of mode
    expect(screen.getByTestId('raw-light')).toHaveTextContent(LIGHT_COLORS.primary);
    expect(screen.getByTestId('raw-dark')).toHaveTextContent(DARK_COLORS.primary);

    act(() => {
      screen.getByText('Dark').click();
    });

    // rawTheme unchanged after mode switch
    expect(screen.getByTestId('raw-light')).toHaveTextContent(LIGHT_COLORS.primary);
    expect(screen.getByTestId('raw-dark')).toHaveTextContent(DARK_COLORS.primary);
  });

  it('accepts initialColorMode prop', () => {
    function ModeReader() {
      const { colorMode, resolvedColorMode } = useTheme();
      return (
        <div>
          <span data-testid="mode">{colorMode}</span>
          <span data-testid="resolved">{resolvedColorMode}</span>
        </div>
      );
    }

    render(
      <ThemeProvider theme={darkTheme} initialColorMode="dark">
        <ModeReader />
      </ThemeProvider>
    );

    expect(screen.getByTestId('mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('updates CSS vars in ThemeStyleInjector on mode change', () => {
    function DarkToggle() {
      const { setColorMode } = useTheme();
      return <button onClick={() => setColorMode('dark')}>Go Dark</button>;
    }

    render(
      <ThemeProvider theme={darkTheme}>
        <ThemeStyleInjector>
          <span data-testid="injected-child">Content</span>
          <DarkToggle />
        </ThemeStyleInjector>
      </ThemeProvider>
    );

    const wrapper = screen.getByTestId('injected-child').parentElement!;
    expect(wrapper.style.getPropertyValue('--sw-color-bg')).toBe(LIGHT_COLORS.background);

    act(() => {
      screen.getByText('Go Dark').click();
    });

    expect(wrapper.style.getPropertyValue('--sw-color-bg')).toBe(DARK_COLORS.background);
    expect(wrapper.style.getPropertyValue('--sw-color-text')).toBe(DARK_COLORS.text);
    expect(wrapper.style.getPropertyValue('--sw-color-primary')).toBe(DARK_COLORS.primary);
  });
});
