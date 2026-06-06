import {
  generateStackwrightStaticParams,
  getStackwrightPageData,
  getStackwrightSiteConfig,
} from '@stackwright/nextjs/server';
import { notFound } from 'next/navigation';
import { StackwrightPageClient } from '../_components/page-client';
import type { PageContent, SiteConfig } from '@stackwright/types';

export const generateStaticParams = generateStackwrightStaticParams;
export const dynamicParams = false;

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pageData = await getStackwrightPageData(slug);
  const siteConfig = getStackwrightSiteConfig();
  if (!pageData) notFound();
  return (
    <StackwrightPageClient
      pageContent={pageData as PageContent}
      siteConfig={siteConfig as SiteConfig}
    />
  );
}
