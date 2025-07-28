import DynamicPage from 'components/DynamicPage';
import {  PageContent, SiteConfig } from '@stackwright/types';
import { getStackwrightStaticGeneration } from '../utils/stackwrightComponentRegistry';

interface SlugPageProps {
  pageContent: PageContent;
  siteConfig: SiteConfig;
}

export default function SlugPage({ pageContent, siteConfig }: SlugPageProps) {
  return <DynamicPage pageContent={pageContent} siteConfig={siteConfig} />;
}

// Export the static generation functions from stackwright registry
export const getSlugStaticPaths = () => getStackwrightStaticGeneration().getStaticPaths;
export const getSlugStaticProps = () => getStackwrightStaticGeneration().getStaticProps;

// Export the props interface for reuse
export type { SlugPageProps };
