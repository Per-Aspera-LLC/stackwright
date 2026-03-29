import type { Theme } from '@stackwright/themes';
import { useTheme } from '@stackwright/themes';

// Default theme fallback - complete Theme type
const defaultTheme: Theme = {
  id: 'default',
  name: 'Default Theme',
  description: 'Fallback theme when ThemeProvider is not available',
  colors: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#b45309',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  typography: {
    fontFamily: { primary: 'sans-serif', secondary: 'sans-serif' },
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
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  components: {
    button: {
      primary: 'bg-amber-600 text-white hover:bg-amber-700 px-8 py-3 rounded-lg font-semibold',
      secondary:
        'text-amber-600 border border-amber-600 hover:bg-amber-50 px-8 py-3 rounded-lg font-semibold',
    },
    card: {},
    header: {},
    footer: {},
  },
};

/**
 * Safe theme hook that provides fallback values if ThemeProvider is not available.
 * Only swallows the "must be used within a ThemeProvider" error; re-throws all others.
 */
export function useSafeTheme() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional: try/catch fallback pattern
    const { theme } = useTheme();
    return theme;
  } catch (error) {
    if (error instanceof Error && error.message.includes('must be used within a ThemeProvider')) {
      console.warn('ThemeProvider not found, using default theme');
      return defaultTheme;
    }
    throw error;
  }
}
