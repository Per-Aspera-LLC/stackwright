import React from 'react';
import fs from 'fs';
import path from 'path';
import { ColorModeScript } from '@stackwright/themes/color-mode-script';
import type { ColorMode } from '@stackwright/themes';

/**
 * Font link data structure matching the _font-links.json output format.
 */
interface FontLink {
  rel: string;
  href: string;
  crossorigin?: boolean;
}

/**
 * Minimal shape we read from `_theme.json` — mirrors `StackwrightThemeFile`
 * from `@stackwright/types` but typed locally to avoid pulling the full Zod
 * schema into the server bundle.
 */
interface ThemeFileSummary {
  customTheme?: {
    colors?: { background?: string };
    darkColors?: { background?: string };
  };
  defaultColorMode?: ColorMode;
}

/**
 * Read `_theme.json` written by `compileTheme()` during prebuild.
 * Returns a partial summary, or null when the file is absent / unreadable.
 *
 * This runs as a Server Component — `fs` access is safe here.
 */
function getThemeFile(): ThemeFileSummary | null {
  try {
    const themePath = path.join(process.cwd(), 'public', 'stackwright-content', '_theme.json');
    const raw = fs.readFileSync(themePath, 'utf8');
    return JSON.parse(raw) as ThemeFileSummary;
  } catch {
    return null;
  }
}

/**
 * Try to load font links from the prebuild-generated _font-links.json.
 * Falls back to empty array for backward compatibility.
 *
 * This runs as a Server Component — `fs` access is safe here.
 */
function getFontLinks(): FontLink[] {
  try {
    const fontLinksPath = path.join(
      process.cwd(),
      'public',
      'stackwright-content',
      '_font-links.json'
    );
    const raw = fs.readFileSync(fontLinksPath, 'utf8');
    const data = JSON.parse(raw) as { links?: FontLink[] };
    return data?.links ?? [];
  } catch {
    // File doesn't exist or is invalid — backward compatibility
    return [];
  }
}

interface ThemeBackgrounds {
  light?: string;
  dark?: string;
}

/**
 * Resolve theme background colors for the blocking ColorModeScript.
 *
 * Resolution order:
 * 1. `_theme.json` (written by compileTheme) — preferred source post-Bead-1
 * 2. `_site.json`.customTheme — defensive fallback for legacy setups where
 *    `_theme.json` may be absent or empty
 *
 * This runs as a Server Component — `fs` access is safe here.
 */
function getThemeBackgrounds(themeFile: ThemeFileSummary | null): ThemeBackgrounds {
  // Path 1 — dedicated _theme.json
  const themeCustom = themeFile?.customTheme;
  if (themeCustom) {
    const light = themeCustom.colors?.background;
    const dark = themeCustom.darkColors?.background;
    if (light || dark) {
      return {
        ...(light ? { light } : {}),
        ...(dark ? { dark } : {}),
      };
    }
  }

  // Path 2 — legacy fallback: read customTheme from _site.json
  try {
    const sitePath = path.join(process.cwd(), 'public', 'stackwright-content', '_site.json');
    const raw = fs.readFileSync(sitePath, 'utf8');
    const data = JSON.parse(raw) as {
      customTheme?: {
        colors?: { background?: string };
        darkColors?: { background?: string };
      };
    };
    const light = data?.customTheme?.colors?.background;
    const dark = data?.customTheme?.darkColors?.background;
    return {
      ...(light ? { light } : {}),
      ...(dark ? { dark } : {}),
    };
  } catch {
    // File doesn't exist or is invalid — backward compatibility
    return {};
  }
}

interface StackwrightLayoutProps {
  children: React.ReactNode;
  /** BCP 47 language tag for the `<html lang>` attribute. Defaults to 'en'. */
  lang?: string;
}

/**
 * App Router root layout component for Stackwright Next.js apps.
 *
 * Includes:
 * - `ColorModeScript` blocking script for flash-free dark mode
 * - Auto-generated Google Fonts `<link>` tags from theme config
 *
 * Use in `app/layout.tsx`:
 *
 * ```tsx
 * import { StackwrightLayout } from '@stackwright/nextjs';
 *
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return <StackwrightLayout>{children}</StackwrightLayout>;
 * }
 * ```
 *
 * Or with a custom `lang` attribute:
 *
 * ```tsx
 * export default function RootLayout({ children }: { children: React.ReactNode }) {
 *   return <StackwrightLayout lang="fr">{children}</StackwrightLayout>;
 * }
 * ```
 */
export function StackwrightLayout({ children, lang = 'en' }: StackwrightLayoutProps) {
  const themeFile = getThemeFile();
  const fontLinks = getFontLinks();
  const themeBackgrounds = getThemeBackgrounds(themeFile);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <ColorModeScript
          fallback={themeFile?.defaultColorMode ?? 'system'}
          lightBackground={themeBackgrounds.light}
          darkBackground={themeBackgrounds.dark}
        />
        {fontLinks.map((link, index) => (
          <link
            key={index}
            rel={link.rel}
            href={link.href}
            {...(link.crossorigin ? { crossOrigin: 'anonymous' } : {})}
          />
        ))}
      </head>
      <body>{children}</body>
    </html>
  );
}
