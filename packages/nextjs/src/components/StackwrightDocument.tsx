import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@stackwright/themes';

/**
 * Base `_document.tsx` component for Stackwright Next.js apps.
 *
 * Includes the `ColorModeScript` blocking script for flash-free dark mode.
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
  return (
    <Html lang={lang}>
      <Head>
        <ColorModeScript />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
