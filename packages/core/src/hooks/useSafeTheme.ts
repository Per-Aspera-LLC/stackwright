import { useTheme } from '@stackwright/themes';

// Default theme fallback
const defaultTheme = {
  colors: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#b45309',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    textSecondary: '#6b7280',
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
