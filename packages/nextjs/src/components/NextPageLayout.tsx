'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PageLayout } from '@stackwright/core';
import type { PageContent, SiteConfig } from '@stackwright/types';

interface NextPageLayoutProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
}

/**
 * Next.js App Router-aware wrapper around {@link PageLayout}.
 *
 * Wires `router.push` from `next/navigation` into `SearchModal` as the
 * `onNavigate` handler, replacing the default `window.location.href`
 * hard-navigation with a proper client-side route transition.
 *
 * Use this in your `app/[...slug]/page.tsx` instead of importing
 * `PageLayout` directly from `@stackwright/core`:
 *
 * ```tsx
 * // app/[...slug]/page.tsx
 * import { NextPageLayout } from '@stackwright/nextjs';
 *
 * export default function Page({ pageContent, siteConfig }) {
 *   return <NextPageLayout pageContent={pageContent} siteConfig={siteConfig} />;
 * }
 * ```
 */
export function NextPageLayout({ pageContent, siteConfig }: NextPageLayoutProps) {
  const router = useRouter();

  return (
    <PageLayout
      pageContent={pageContent}
      siteConfig={siteConfig}
      onNavigate={(path) => router.push(path)}
    />
  );
}
