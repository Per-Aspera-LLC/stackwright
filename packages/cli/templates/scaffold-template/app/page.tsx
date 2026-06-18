import { getStackwrightPageData, getStackwrightSiteConfig } from '@stackwright/nextjs/server';
import { notFound } from 'next/navigation';
import { StackwrightPageClient } from './_components/page-client';
import type { PageContent, SiteConfig } from '@stackwright/types';

/** Home page — renders the root content.yml. */
export default async function HomePage() {
  const pageData = await getStackwrightPageData(undefined);
  const siteConfig = getStackwrightSiteConfig();
  if (!pageData) notFound();
  return (
    <StackwrightPageClient
      pageContent={pageData as PageContent}
      siteConfig={siteConfig as SiteConfig}
    />
  );
}
