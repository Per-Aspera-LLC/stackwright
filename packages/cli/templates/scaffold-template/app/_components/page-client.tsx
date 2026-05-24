'use client';
import { DynamicPage } from '@stackwright/core';

/**
 * Client Component wrapper for DynamicPage.
 *
 * DynamicPage reads from the Stackwright component registry (module-level singleton).
 * The registry is populated by Providers (a 'use client' component). This component
 * sits on the client side of that boundary so the registry is available when rendering.
 */
export function StackwrightPageClient({ content }: { content: unknown }) {
  return <DynamicPage content={content as any} />;
}
