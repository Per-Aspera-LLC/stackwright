import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@stackwright/themes';

/**
 * Font link data structure matching the _font-links.json output format.
 */
interface FontLink {
  rel: string;
  href: string;
  crossorigin?: boolean;
}

interface FontLinksData {
  links: FontLink[];
}

/**
 * Try to load font links from the prebuild-generated _font-links.json.
 * Falls back to empty array for backward compatibility.
 */
function getFontLinks(): FontLink[] {
  try {
    // In Next.js, public files are served from the root, so stackwright-content
    // is at /stackwright-content/_font-links.json
    const fontLinksData = require('/stackwright-content/_font-links.json') as FontLinksData;
    return fontLinksData?.links ?? [];
  } catch {
    // File doesn't exist or is invalid - backward compatibility
    return [];
  }
}

/**
 * Base `_document.tsx` component for Stackwright Next.js apps.
 *
 * Includes:
 * - `ColorModeScript` blocking script for flash-free dark mode
 * - Auto-generated Google Fonts `<link>` tags from theme config
 *
 * Use in `pages/_document.tsx`:
 *
 * ```tsx
 * import { StackwrightDocument } from '@stackwright/nextjs';
 * export default StackwrightDocument;
 * ```
 *
 * Or extend it:
 *
 * ```tsx
 * import { StackwrightDocument } from '@stackwright/nextjs';
 * export default function MyDocument() {
 *   return <StackwrightDocument lang="en" />;
 * }
 * ```
 */
export function StackwrightDocument({ lang = 'en' }: { lang?: string }) {
  const fontLinks = getFontLinks();

  return (
    <Html lang={lang}>
      <Head>
        <ColorModeScript />
        {fontLinks.map((link, index) => (
          <link
            key={index}
            rel={link.rel}
            href={link.href}
            {...(link.crossorigin ? { crossOrigin: 'anonymous' } : {})}
          />
        ))}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
