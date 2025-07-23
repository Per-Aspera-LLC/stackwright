import fs from 'fs-extra';
import path from 'path';
import { GeneratedTheme } from './brandThemeConverter';

export async function applyThemeToProject(theme: GeneratedTheme, outputDir: string): Promise<void> {
  console.log(`🎨 Applying theme "${theme.name}" to project at ${outputDir}...`);
  
  // Ensure output directory exists
  await fs.ensureDir(outputDir);
  
  // Create theme configuration file
  await writeThemeConfig(theme, outputDir);
  
  // Generate CSS variables
  await generateCSSVariables(theme, outputDir);
  
  // Generate Tailwind config
  await generateTailwindConfig(theme, outputDir);
  
  // Create theme provider component
  await generateThemeProvider(theme, outputDir);
  
  console.log('✅ Theme applied successfully');
}

async function writeThemeConfig(theme: GeneratedTheme, outputDir: string): Promise<void> {
  const configPath = path.join(outputDir, 'theme.config.json');
  await fs.writeJson(configPath, theme, { spaces: 2 });
  console.log(`📝 Theme config written to ${configPath}`);
}

async function generateCSSVariables(theme: GeneratedTheme, outputDir: string): Promise<void> {
  // Safe access to component styles with fallbacks
  const buttonBase = theme.components?.button?.base || 'px-4 py-2 font-medium transition-colors rounded-md';
  const buttonPrimary = theme.components?.button?.primary || `bg-[${theme.colors.primary}] text-white hover:opacity-90`;
  const buttonSecondary = theme.components?.button?.secondary || `bg-[${theme.colors.secondary}] text-white hover:opacity-90`;
  const cardBase = theme.components?.card?.base || `bg-[${theme.colors.surface}] border border-gray-200 rounded-md p-6`;

  const css = `/* Generated theme variables for ${theme.name} */
:root {
  /* Colors */
  --color-primary: ${theme.colors.primary};
  --color-secondary: ${theme.colors.secondary};
  --color-accent: ${theme.colors.accent};
  --color-background: ${theme.colors.background};
  --color-surface: ${theme.colors.surface};
  --color-text: ${theme.colors.text};
  --color-text-secondary: ${theme.colors.textSecondary};
  
  /* Typography */
  --font-primary: ${theme.typography.fontFamily.primary};
  --font-secondary: ${theme.typography.fontFamily.secondary};
  
  /* Spacing */
  --spacing-xs: ${theme.spacing.xs};
  --spacing-sm: ${theme.spacing.sm};
  --spacing-md: ${theme.spacing.md};
  --spacing-lg: ${theme.spacing.lg};
  --spacing-xl: ${theme.spacing.xl};
  --spacing-2xl: ${theme.spacing['2xl']};
}

/* Component base styles */
.btn {
  @apply ${cleanTailwindClasses(buttonBase)};
}

.btn-primary {
  @apply ${cleanTailwindClasses(buttonPrimary)};
  background-color: var(--color-primary);
  color: white;
}

.btn-secondary {
  @apply ${cleanTailwindClasses(buttonSecondary)};
  background-color: var(--color-secondary);
  color: white;
}

.card {
  @apply ${cleanTailwindClasses(cardBase)};
  background-color: var(--color-surface);
}
`;

  const cssPath = path.join(outputDir, 'src', 'styles', 'theme.css');
  await fs.ensureDir(path.dirname(cssPath));
  await fs.writeFile(cssPath, css);
  console.log(`🎨 CSS variables written to ${cssPath}`);
}

// Helper function to clean Tailwind classes for CSS variables
function cleanTailwindClasses(classString: string): string {
  return classString
    .replace(/bg-\[.*?\]/g, '') // Remove arbitrary background colors
    .replace(/text-\[.*?\]/g, '') // Remove arbitrary text colors
    .replace(/border-\[.*?\]/g, '') // Remove arbitrary border colors
    .replace(/hover:opacity-\d+/g, '') // Remove hover opacity
    .replace(/\s+/g, ' ') // Clean up multiple spaces
    .trim();
}

async function generateTailwindConfig(theme: GeneratedTheme, outputDir: string): Promise<void> {
  // Safe font family parsing
  const primaryFonts = theme.typography.fontFamily.primary
    .split(',')
    .map(f => `'${f.trim()}'`)
    .join(', ');
  
  const secondaryFonts = theme.typography.fontFamily.secondary
    .split(',')
    .map(f => `'${f.trim()}'`)
    .join(', ');

  const config = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '${theme.colors.primary}',
        secondary: '${theme.colors.secondary}',
        accent: '${theme.colors.accent}',
        surface: '${theme.colors.surface}',
      },
      fontFamily: {
        primary: [${primaryFonts}],
        secondary: [${secondaryFonts}],
      },
      spacing: {
        'xs': '${theme.spacing.xs}',
        'sm': '${theme.spacing.sm}',
        'md': '${theme.spacing.md}',
        'lg': '${theme.spacing.lg}',
        'xl': '${theme.spacing.xl}',
        '2xl': '${theme.spacing['2xl']}',
      }
    },
  },
  plugins: [],
}
`;

  const configPath = path.join(outputDir, 'tailwind.config.js');
  await fs.writeFile(configPath, config);
  console.log(`⚙️ Tailwind config written to ${configPath}`);
}

async function generateThemeProvider(theme: GeneratedTheme, outputDir: string): Promise<void> {
  const themeProvider = `import React, { createContext, useContext, ReactNode } from 'react';

const theme = ${JSON.stringify(theme, null, 2)};

interface ThemeContextType {
  theme: typeof theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { theme };
`;

  const providerPath = path.join(outputDir, 'src', 'components', 'ThemeProvider.tsx');
  await fs.ensureDir(path.dirname(providerPath));
  await fs.writeFile(providerPath, themeProvider);
  console.log(`⚛️ Theme provider written to ${providerPath}`);
}