/**
 * @stackwright/nextjs/server
 *
 * Server-only exports for @stackwright/nextjs.
 *
 * Import from this entry when running in a server context:
 *   - Next.js App Router Server Components
 *   - generateStaticParams / generateMetadata functions
 *   - next.config.js (Node.js context)
 *
 * Do NOT import this from:
 *   - 'use client' components
 *   - pages/_app.tsx or pages/_document.tsx
 *   - Any file that runs in the browser
 *
 * @example App Router layout.tsx
 * ```typescript
 * import { StackwrightLayout } from '@stackwright/nextjs/server';
 * ```
 *
 * @example App Router dynamic page
 * ```typescript
 * import { generateStackwrightStaticParams, getStackwrightPageData } from '@stackwright/nextjs/server';
 * ```
 */

export { StackwrightLayout } from './components/StackwrightLayout';
export {
  generateStackwrightStaticParams,
  getStackwrightPageData,
  getStackwrightSiteConfig,
} from './static-generation';
