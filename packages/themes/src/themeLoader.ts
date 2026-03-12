import * as yaml from 'js-yaml';
import { Theme } from './types';

export class ThemeLoader {
  private static themes: Map<string, Theme> = new Map();

  static loadThemeFromYaml(yamlContent: string): Theme {
    try {
      const theme = yaml.load(yamlContent) as Theme;
      this.themes.set(theme.name, theme);
      return theme;
    } catch (error) {
      throw new Error(`Failed to parse theme YAML: ${error}`);
    }
  }

  static loadThemeFromFile(themeName: string): Theme {
    const themeData = this.getEmbeddedTheme(themeName);
    return this.loadThemeFromYaml(themeData);
  }

  static getTheme(name: string): Theme | undefined {
    return this.themes.get(name);
  }

  static getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  static registerCustomTheme(theme: Theme): void {
    this.themes.set(theme.name, theme);
  }

  static loadCustomTheme(theme: Theme): Theme {
    this.registerCustomTheme(theme);
    return theme;
  }

  private static getEmbeddedTheme(name: string): string {
    const themes: Record<string, string> = {
      corporate: `
id: "corporate"
name: "Corporate"
description: "A professional amber-toned corporate theme"
colors:
  primary: "#f59e0b"
  secondary: "#334155"
  accent: "#d97706"
  background: "#f8fafc"
  surface: "#ffffff"
  text: "#1f2937"
  textSecondary: "#6b7280"
darkColors:
  primary: "#fbbf24"
  secondary: "#94a3b8"
  accent: "#f59e0b"
  background: "#0f172a"
  surface: "#1e293b"
  text: "#f1f5f9"
  textSecondary: "#94a3b8"
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
`,
      soft: `
id: "soft"
name: "Soft"
description: "A gentle pink-toned soft theme"
colors:
  primary: "#ec4899"
  secondary: "#6b7280"
  accent: "#db2777"
  background: "#f9fafb"
  surface: "#ffffff"
  text: "#374151"
  textSecondary: "#9ca3af"
darkColors:
  primary: "#f472b6"
  secondary: "#9ca3af"
  accent: "#ec4899"
  background: "#111827"
  surface: "#1f2937"
  text: "#f9fafb"
  textSecondary: "#9ca3af"
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
`,
    };

    if (!themes[name]) {
      throw new Error(`Theme '${name}' not found`);
    }

    return themes[name];
  }
}
