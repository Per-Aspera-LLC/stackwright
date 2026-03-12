import Head from 'next/head';

interface NextStackwrightHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogSiteName?: string;
  canonical?: string;
  noindex?: boolean;
}

/**
 * Next.js adapter for Stackwright's Head component.
 * Renders SEO meta tags via next/head. Only emits tags for fields that are set
 * -- no empty <meta> tags, no placeholder content.
 */
export function NextStackwrightHead({
  title,
  description,
  ogImage,
  ogSiteName,
  canonical,
  noindex,
}: NextStackwrightHeadProps) {
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogSiteName && <meta property="og:site_name" content={ogSiteName} />}
      <meta property="og:type" content="website" />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
    </Head>
  );
}
