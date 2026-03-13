import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  ReactNode,
  CSSProperties,
} from 'react';
import { Theme, ColorMode, ThemeColors } from './types';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface ThemeContextType {
  /** The resolved theme — `colors` reflects the active color mode. */
  theme: Theme;
  /** The original theme with both `colors` and `darkColors` intact. */
  rawTheme: Theme;
  setTheme: (theme: Theme) => void;
  /** Current color mode setting (`'light'`, `'dark'`, or `'system'`). */
  colorMode: ColorMode;
  /** Switch the color mode. */
  setColorMode: (mode: ColorMode) => void;
  /** The actually active mode after resolving `'system'`. */
  resolvedColorMode: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const COLOR_MODE_COOKIE = 'sw-color-mode';

/** Detect OS-level dark mode preference via `matchMedia`. SSR-safe. */
function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * SSR-safe `useLayoutEffect`. Falls back to `useEffect` on the server to
 * avoid React warnings, but uses `useLayoutEffect` on the client so that
 * color-mode state updates happen before the browser paints — preventing
 * a visible flash of the wrong theme.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Pick the effective colors for the given mode. */
function resolveColors(theme: Theme, mode: 'light' | 'dark'): ThemeColors {
  if (mode === 'dark' && theme.darkColors) {
    return theme.darkColors;
  }
  return theme.colors;
}

/**
 * Read a cookie by name. SSR-safe (returns undefined when no document).
 * Inline to avoid circular dependency on @stackwright/core.
 */
function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Write a cookie. SSR-safe no-op when no document. */
function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie =
    name + '=' + encodeURIComponent(value) + '; max-age=' + maxAge + '; path=/; SameSite=Lax';
}

/** Remove a cookie by setting max-age=0. */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = name + '=; max-age=0; path=/';
}

// ---------------------------------------------------------------------------
// ThemeProvider
// ---------------------------------------------------------------------------

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
  /** Initial color mode. Defaults to `'system'`. */
  initialColorMode?: ColorMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme: initialTheme,
  children,
  initialColorMode = 'system',
}) => {
  const [rawTheme, setRawTheme] = useState<Theme>(initialTheme);
  const [colorMode, setColorModeState] = useState<ColorMode>(initialColorMode);
  // Always initialise to 'light' — this matches the server render and
  // avoids the hydration mismatch that occurred when the useState
  // initialiser read from the DOM attribute set by ColorModeScript.
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // After hydration, sync the real color mode from cookie / blocking-script
  // attribute / OS preference. Uses layoutEffect to run before the browser
  // paints, so the user never sees the wrong theme.
  useIsomorphicLayoutEffect(() => {
    const saved = readCookie(COLOR_MODE_COOKIE);
    if (saved === 'light' || saved === 'dark') {
      setColorModeState(saved);
    }

    // Trust the blocking ColorModeScript's attribute first, then fall back
    // to matchMedia.
    const attr = document.documentElement.getAttribute('data-sw-color-mode');
    if (attr === 'dark' || attr === 'light') {
      setSystemPreference(attr);
    } else {
      setSystemPreference(getSystemPreference());
    }
  }, []);

  // Listen for OS-level color scheme changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Persist color mode to cookie on change, and clear when set to 'system'.
  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    if (mode === 'system') {
      deleteCookie(COLOR_MODE_COOKIE);
    } else {
      writeCookie(COLOR_MODE_COOKIE, mode);
    }
  }, []);

  const resolvedColorMode: 'light' | 'dark' = colorMode === 'system' ? systemPreference : colorMode;

  // Build the effective theme — swap `colors` for `darkColors` when in dark mode.
  const theme = useMemo<Theme>(() => {
    const effectiveColors = resolveColors(rawTheme, resolvedColorMode);
    if (effectiveColors === rawTheme.colors) return rawTheme;
    return { ...rawTheme, colors: effectiveColors };
  }, [rawTheme, resolvedColorMode]);

  const setTheme = useCallback((t: Theme) => setRawTheme(t), []);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, rawTheme, setTheme, colorMode, setColorMode, resolvedColorMode }),
    [theme, rawTheme, setTheme, colorMode, setColorMode, resolvedColorMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Access the current theme and color mode controls.
 * Must be called inside a `<ThemeProvider>`.
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Like `useTheme`, but returns `undefined` instead of throwing when
 * no `ThemeProvider` is present. Useful for optional-context components
 * like `ThemeStyleInjector`.
 */
export const useThemeOptional = (): ThemeContextType | undefined => {
  return useContext(ThemeContext);
};

// ---------------------------------------------------------------------------
// CSS custom property helpers
// ---------------------------------------------------------------------------

/**
 * Converts a Stackwright Theme to CSS custom properties.
 * Inject these via ThemeStyleInjector or a `<style>` tag.
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

// ---------------------------------------------------------------------------
// ThemeStyleInjector
// ---------------------------------------------------------------------------

interface ThemeStyleInjectorProps {
  /**
   * Explicit theme override. When omitted the resolved theme from the
   * nearest `ThemeProvider` is used automatically — this is the
   * recommended approach so CSS vars stay in sync with color mode changes.
   */
  theme?: Theme;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps children in a div that injects Stackwright CSS custom properties.
 * Place this inside a `<ThemeProvider>` and it will track color mode
 * changes automatically.
 */
export function ThemeStyleInjector({
  theme: themeProp,
  children,
  className,
}: ThemeStyleInjectorProps) {
  const ctx = useThemeOptional();
  const theme = themeProp ?? ctx?.theme;

  if (!theme) {
    // No theme from prop or context — render children unstyled rather than crashing.
    return <>{children}</>;
  }

  const cssVars = themeToCSSVars(theme);
  return (
    <div className={className} style={cssVars as CSSProperties}>
      {children}
    </div>
  );
}
