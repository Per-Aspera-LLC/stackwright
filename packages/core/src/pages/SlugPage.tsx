import DynamicPage from '../components/DynamicPage';
import {  PageContent, SiteConfig } from '@stackwright/types';
import { getStackwrightStaticGeneration } from '../utils/stackwrightUtilityRegistry';

interface SlugPageProps {
  pageContent: PageContent;
  siteConfig: SiteConfig;
}

export default function SlugPage({ pageContent, siteConfig }: SlugPageProps) {
  return <DynamicPage pageContent={pageContent} siteConfig={siteConfig} />;
}

// Export the static generation functions from stackwright registry
// These are lazily evaluated to ensure registry is populated first
export const getSlugStaticPaths = (...args: any[]) => {
  return getStackwrightStaticGeneration().getStaticPaths(...args);
};

export const getSlugStaticProps = (...args: any[]) => {
  return getStackwrightStaticGeneration().getStaticProps(...args);
};

// Export the props interface for reuse
export type { SlugPageProps };