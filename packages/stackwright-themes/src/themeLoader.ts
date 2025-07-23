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
    // In a real implementation, this would load from the file system
    // For now, we'll embed the themes
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
    console.log(`🎨 Registered custom theme: ${theme.name}`);
  }

  static loadCustomTheme(theme: Theme): Theme {
    this.registerCustomTheme(theme);
    return theme;
  }

  private static getEmbeddedTheme(name: string): string {
    const themes: Record<string, string> = {
      corporate: `
name: "Corporate"
colors:
  primary:
    50: "#fef7ee"
    100: "#fdedd3"
    500: "#f59e0b"
    600: "#d97706"
    700: "#b45309"
  neutral:
    50: "#f8fafc"
    100: "#f1f5f9"
    700: "#334155"
    800: "#1e293b"
    900: "#0f172a"
  text:
    primary: "#1f2937"
    secondary: "#6b7280"
    inverse: "#ffffff"

spacing:
  section: "py-20"
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"

typography:
  hero: "text-4xl md:text-6xl font-bold"
  subtitle: "text-xl md:text-2xl"

components:
  button:
    primary: "bg-amber-600 text-white hover:bg-amber-700 px-8 py-3 rounded-lg font-semibold"
    secondary: "text-amber-600 border border-amber-600 hover:bg-amber-50 px-8 py-3 rounded-lg font-semibold"
  header:
    background: "bg-white shadow-sm"
    border: "border-b border-gray-200"
  hero:
    background: "bg-gradient-to-br from-slate-900 to-slate-800"
`,
      soft: `
name: "Soft"
colors:
  primary:
    50: "#fdf2f8"
    100: "#fce7f3"
    500: "#ec4899"
    600: "#db2777"
    700: "#be185d"
  neutral:
    50: "#fefefe"
    100: "#f9fafb"
    700: "#6b7280"
    800: "#4b5563"
    900: "#374151"
  text:
    primary: "#374151"
    secondary: "#9ca3af"
    inverse: "#ffffff"

spacing:
  section: "py-16"
  container: "max-w-6xl mx-auto px-6 sm:px-8 lg:px-10"

typography:
  hero: "text-3xl md:text-5xl font-semibold"
  subtitle: "text-lg md:text-xl"

components:
  button:
    primary: "bg-pink-600 text-white hover:bg-pink-700 px-6 py-2 rounded-full font-medium"
    secondary: "text-pink-600 border border-pink-600 hover:bg-pink-50 px-6 py-2 rounded-full font-medium"
  header:
    background: "bg-neutral-50 shadow-none"
    border: "border-b border-neutral-200"
  hero:
    background: "bg-gradient-to-br from-neutral-100 to-neutral-200"
`
    };

    if (!themes[name]) {
      throw new Error(`Theme '${name}' not found`);
    }

    return themes[name];
  }
}