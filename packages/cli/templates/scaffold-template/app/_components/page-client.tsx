'use client';
import { DynamicPage } from '@stackwright/core';
import type { PageContent, SiteConfig } from '@stackwright/types';

/**
 * Client Component wrapper for DynamicPage.
 *
 * DynamicPage reads from the Stackwright component registry (module-level singleton).
 * The registry is populated by Providers (a 'use client' component). This component
 * sits on the client side of that boundary so the registry is available when rendering.
 */
export function StackwrightPageClient({
  pageContent,
  siteConfig,
}: {
  pageContent: PageContent;
  siteConfig: SiteConfig;
}) {
  return <DynamicPage pageContent={pageContent} siteConfig={siteConfig} />;
}
