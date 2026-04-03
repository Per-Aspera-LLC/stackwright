/**
 * Resolves a background value from YAML content. If the value matches a
 * theme color key (e.g., 'surface', 'primary'), it resolves from the
 * current theme.colors — which is dark-mode-aware. Otherwise, passes
 * through as a literal CSS value.
 *
 * This enables YAML authors to write `background: "surface"` and get
 * the correct color in both light and dark modes automatically.
 *
 * In dark mode with a theme background image, a semi-transparent dark
 * overlay is applied to ensure text contrast.
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
  backgroundImage?: {
    url?: string;
  };
}

export function resolveBackground(
  bg: string | undefined,
  theme: ThemeWithColors,
  isDarkMode?: boolean
): string {
  if (!bg) return 'transparent';

  if (THEME_COLOR_KEYS.has(bg)) {
    const resolvedColor = theme.colors[bg] ?? bg;

    // In dark mode, if the theme has a background image, layer a dark
    // overlay on top for better text contrast.
    if (isDarkMode && theme.backgroundImage?.url) {
      return `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${theme.backgroundImage.url}')`;
    }

    return resolvedColor;
  }
  return bg;
}
