import { generateStackwrightStaticParams, getStackwrightPageData } from '@stackwright/nextjs';
import { notFound } from 'next/navigation';
import { StackwrightPageClient } from '../_components/page-client';

export const generateStaticParams = generateStackwrightStaticParams;

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const pageData = await getStackwrightPageData(slug);
  if (!pageData) notFound();
  return <StackwrightPageClient content={pageData} />;
}
