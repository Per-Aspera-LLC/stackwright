import { getStackwrightPageData } from '@stackwright/nextjs';
import { notFound } from 'next/navigation';
import { StackwrightPageClient } from './_components/page-client';

/** Home page — renders the root content.yml. */
export default async function HomePage() {
  const pageData = await getStackwrightPageData(undefined);
  if (!pageData) notFound();
  return <StackwrightPageClient content={pageData} />;
}
