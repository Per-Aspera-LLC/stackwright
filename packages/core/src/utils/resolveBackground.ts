/**
 * Resolves a background value from YAML content. If the value matches a
 * theme color key (e.g., 'surface', 'primary'), it resolves from the
 * current theme.colors — which is dark-mode-aware. Otherwise, passes
 * through as a literal CSS value.
 *
 * This enables YAML authors to write `background: "surface"` and get
 * the correct color in both light and dark modes automatically.
 */
const THEME_COLOR_KEYS = new Set([
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'textSecondary',
]);

/** Minimal shape — only needs `colors` from the theme. */
interface ThemeWithColors {
  colors: Record<string, string>;
}

export function resolveBackground(bg: string | undefined, theme: ThemeWithColors): string {
  if (!bg) return 'transparent';
  if (THEME_COLOR_KEYS.has(bg)) {
    return theme.colors[bg] ?? bg;
  }
  return bg;
}
