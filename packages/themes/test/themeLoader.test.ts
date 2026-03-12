import { describe, it, expect } from 'vitest';
import { ThemeLoader } from '../src/themeLoader';
import type { Theme } from '../src/types';

// The ThemeLoader uses a static Map, so we need to be careful about state
// leaking between tests. We work around this by using unique theme names.

const makeCustomTheme = (overrides: Partial<Theme> = {}): Theme => ({
  id: 'test-theme',
  name: 'Test Theme',
  description: 'A theme for testing',
  colors: {
    primary: '#aabbcc',
    secondary: '#112233',
    accent: '#ccbbaa',
    background: '#ffffff',
    surface: '#f0f0f0',
    text: '#000000',
    textSecondary: '#666666',
  },
  typography: {
    fontFamily: { primary: 'Arial, sans-serif', secondary: 'Georgia, serif' },
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
  ...overrides,
});

describe('ThemeLoader.loadThemeFromFile', () => {
  it('loads the corporate theme and returns a valid ThemeConfig', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Corporate');
    expect(theme.id).toBe('corporate');
  });

  it('corporate theme has flat hex string colors (not nested objects)', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    expect(typeof theme.colors.primary).toBe('string');
    expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(typeof theme.colors.secondary).toBe('string');
    expect(typeof theme.colors.background).toBe('string');
    expect(typeof theme.colors.surface).toBe('string');
    expect(typeof theme.colors.text).toBe('string');
    expect(typeof theme.colors.textSecondary).toBe('string');
  });

  it('loads the soft theme and returns a valid ThemeConfig', () => {
    const theme = ThemeLoader.loadThemeFromFile('soft');
    expect(theme).toBeDefined();
    expect(theme.name).toBe('Soft');
    expect(theme.id).toBe('soft');
  });

  it('soft theme has flat hex string colors', () => {
    const theme = ThemeLoader.loadThemeFromFile('soft');
    expect(typeof theme.colors.primary).toBe('string');
    expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('throws for an unknown theme name', () => {
    expect(() => ThemeLoader.loadThemeFromFile('nonexistent')).toThrow(
      "Theme 'nonexistent' not found"
    );
  });

  it('loaded themes have required typography and spacing fields', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    expect(theme.typography).toBeDefined();
    expect(theme.typography.fontFamily.primary).toBeTruthy();
    expect(theme.spacing).toBeDefined();
    expect(theme.spacing.md).toBeTruthy();
  });
});

describe('ThemeLoader.loadThemeFromYaml', () => {
  it('parses valid YAML and returns a theme', () => {
    const yaml = `
id: "yaml-test"
name: "YAML Test"
description: "Parsed from YAML"
colors:
  primary: "#ff0000"
  secondary: "#00ff00"
  accent: "#0000ff"
  background: "#ffffff"
  surface: "#eeeeee"
  text: "#111111"
  textSecondary: "#555555"
typography:
  fontFamily:
    primary: "Roboto, sans-serif"
    secondary: "Roboto, sans-serif"
  scale:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    2xl: "1.5rem"
    3xl: "1.875rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
`;
    const theme = ThemeLoader.loadThemeFromYaml(yaml);
    expect(theme.name).toBe('YAML Test');
    expect(theme.colors.primary).toBe('#ff0000');
  });

  it('throws for invalid YAML syntax', () => {
    expect(() => ThemeLoader.loadThemeFromYaml('{ invalid: yaml: content: :')).toThrow(
      'Failed to parse theme YAML'
    );
  });
});

describe('ThemeLoader.registerCustomTheme / getTheme', () => {
  it('registers a custom theme and retrieves it by name', () => {
    const custom = makeCustomTheme({ name: 'My Custom Theme A' });
    ThemeLoader.registerCustomTheme(custom);
    const retrieved = ThemeLoader.getTheme('My Custom Theme A');
    expect(retrieved).toBeDefined();
    expect(retrieved?.colors.primary).toBe('#aabbcc');
  });

  it('getTheme returns undefined for an unregistered name', () => {
    expect(ThemeLoader.getTheme('__does_not_exist__')).toBeUndefined();
  });

  it('overwriting a theme by name replaces it', () => {
    const v1 = makeCustomTheme({
      name: 'Overwrite Test',
      colors: { ...makeCustomTheme().colors, primary: '#111111' },
    });
    const v2 = makeCustomTheme({
      name: 'Overwrite Test',
      colors: { ...makeCustomTheme().colors, primary: '#222222' },
    });
    ThemeLoader.registerCustomTheme(v1);
    ThemeLoader.registerCustomTheme(v2);
    expect(ThemeLoader.getTheme('Overwrite Test')?.colors.primary).toBe('#222222');
  });
});

describe('ThemeLoader.loadCustomTheme', () => {
  it('registers the theme and returns it', () => {
    const custom = makeCustomTheme({ name: 'LoadCustom Test' });
    const returned = ThemeLoader.loadCustomTheme(custom);
    expect(returned).toBe(custom);
    expect(ThemeLoader.getTheme('LoadCustom Test')).toBeDefined();
  });
});

describe('ThemeLoader.getAllThemes', () => {
  it('returns an array (may include themes registered by other tests)', () => {
    // Load a known theme to ensure at least one is present
    ThemeLoader.loadThemeFromFile('corporate');
    const all = ThemeLoader.getAllThemes();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  it('includes a custom theme after registration', () => {
    const uniqueName = `AllThemes-${Date.now()}`;
    ThemeLoader.registerCustomTheme(makeCustomTheme({ name: uniqueName }));
    const names = ThemeLoader.getAllThemes().map((t) => t.name);
    expect(names).toContain(uniqueName);
  });
});

// ---------------------------------------------------------------------------
// Dark mode colors in embedded themes
// ---------------------------------------------------------------------------

describe('Embedded themes — darkColors', () => {
  it('corporate theme includes darkColors', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    expect(theme.darkColors).toBeDefined();
    expect(typeof theme.darkColors!.primary).toBe('string');
    expect(theme.darkColors!.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('soft theme includes darkColors', () => {
    const theme = ThemeLoader.loadThemeFromFile('soft');
    expect(theme.darkColors).toBeDefined();
    expect(typeof theme.darkColors!.primary).toBe('string');
    expect(theme.darkColors!.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('darkColors has all required color fields', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    const dark = theme.darkColors!;
    expect(dark.primary).toBeTruthy();
    expect(dark.secondary).toBeTruthy();
    expect(dark.accent).toBeTruthy();
    expect(dark.background).toBeTruthy();
    expect(dark.surface).toBeTruthy();
    expect(dark.text).toBeTruthy();
    expect(dark.textSecondary).toBeTruthy();
  });

  it('darkColors differ from light colors', () => {
    const theme = ThemeLoader.loadThemeFromFile('corporate');
    // At minimum, background should be different
    expect(theme.darkColors!.background).not.toBe(theme.colors.background);
    expect(theme.darkColors!.text).not.toBe(theme.colors.text);
  });
});
