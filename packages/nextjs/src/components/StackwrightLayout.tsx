import React from 'react';
import fs from 'fs';
import path from 'path';
import { ColorModeScript } from '@stackwright/themes/color-mode-script';

/**
 * Font link data structure matching the _font-links.json output format.
 */
interface FontLink {
  rel: string;
  href: string;
  crossorigin?: boolean;
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
  const fontLinks = getFontLinks();

  return (
    <html lang={lang}>
      <head>
        <ColorModeScript />
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
