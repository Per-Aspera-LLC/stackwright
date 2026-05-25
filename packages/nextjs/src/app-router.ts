import { registerStackwrightComponents } from '@stackwright/core';

import { NextStackwrightImage } from './components/NextStackwrightImage';
import { NextStackwrightLink } from './components/NextStackwrightLink';
import { NextStackwrightRouter, NextStackwrightRoute } from './components/NextStackwrightRouter';

/**
 * Register Next.js adapter components for App Router projects.
 *
 * Use this instead of `registerNextJSComponents` in App Router setups.
 * This function intentionally omits `NextStackwrightHead` (which depends on
 * `next/head`, a Pages Router API) to avoid Turbopack bundling issues.
 *
 * In App Router, use the Metadata API for SEO instead:
 * https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 *
 * @example
 * ```tsx
 * // app/_components/providers.tsx
 * 'use client';
 * import { registerAppRouterComponents } from '@stackwright/nextjs/app-router';
 * registerAppRouterComponents();
 * ```
 */
export function registerAppRouterComponents() {
  registerStackwrightComponents({
    Image: NextStackwrightImage,
    Link: NextStackwrightLink,
    Router: NextStackwrightRouter,
    Route: NextStackwrightRoute,
  });
}

export const appRouterComponents = {
  Image: NextStackwrightImage,
  Link: NextStackwrightLink,
  Router: NextStackwrightRouter,
  Route: NextStackwrightRoute,
};
