import React from 'react';
import { ColorMode } from './types';

/**
 * Blocking script that reads the `sw-color-mode` cookie and applies the
 * correct color mode attribute to `<html>` before React hydrates.
 *
 * Place this in `_document.tsx` `<Head>` (Pages Router) or in a `<script>`
 * tag in `layout.tsx` (App Router). It must execute before the body is
 * painted — intentionally render-blocking.
 *
 * The `data-sw-color-mode` attribute set by this script is read by
 * `ThemeProvider`'s `systemPreference` initialiser, ensuring the first
 * React render matches the visible state — no hydration mismatch.
 *
 * For return visitors (cookie exists): correct theme on first paint, zero flash.
 * For first-time visitors with OS dark mode: one-frame flash (same as next-themes v0.2).
 */
export function ColorModeScript({ fallback = 'system' }: { fallback?: ColorMode }) {
  // The script is raw JS — no React, no module imports. It reads the cookie
  // and sets a data attribute. ~300 bytes, executes in <1ms.
  const scriptContent = `
(function(){
  try {
    var m = document.cookie.match(/(?:^|; )sw-color-mode=([^;]*)/);
    var mode = m ? m[1] : '${fallback}';
    if (mode === 'system') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-sw-color-mode', mode);
  } catch(e) {}
})();
`.trim();

  return <script dangerouslySetInnerHTML={{ __html: scriptContent }} />;
}
