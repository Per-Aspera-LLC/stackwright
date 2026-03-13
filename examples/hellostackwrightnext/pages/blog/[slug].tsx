/**
 * Blog entry page — renders individual collection entries.
 *
 * Uses the prebuild JSON from public/stackwright-content/collections/posts/.
 * The entry's `body` field is rendered as the main text content within the
 * standard DynamicPage layout (header, footer, theming).
 */

import React from 'react';
import type { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import { DynamicPage } from '@stackwright/core';

interface BlogEntryProps {
  pageContent: any;
  siteConfig: any;
}

export default function BlogEntry({ pageContent, siteConfig }: BlogEntryProps) {
  return <DynamicPage pageContent={pageContent} siteConfig={siteConfig} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const collectionsDir = path.join(
    process.cwd(),
    'public',
    'stackwright-content',
    'collections',
    'posts'
  );

  if (!fs.existsSync(collectionsDir)) {
    return { paths: [], fallback: 'blocking' };
  }

  const slugs = fs
    .readdirSync(collectionsDir)
    .filter((f) => f.endsWith('.json') && f !== '_index.json')
    .map((f) => f.replace(/\.json$/, ''));

  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  if (!slug) return { notFound: true };

  // Sanitize to prevent path traversal
  const safeSlug = path.basename(slug);
  const entryPath = path.join(
    process.cwd(),
    'public',
    'stackwright-content',
    'collections',
    'posts',
    `${safeSlug}.json`
  );

  if (!fs.existsSync(entryPath)) {
    return { notFound: true };
  }

  const entry = JSON.parse(fs.readFileSync(entryPath, 'utf8'));
  const siteConfig = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'public', 'stackwright-content', '_site.json'),
      'utf8'
    )
  );

  // Build a synthetic PageContent from the collection entry
  const pageContent = {
    content: {
      content_items: [
        {
          type: 'main' as const,
          label: `blog-entry-${safeSlug}`,
            heading: {
              text: entry.title || safeSlug,
              textSize: 'h3',
              textColor: 'secondary',
            },
            textBlocks: [
              ...(entry.date || entry.author
                ? [
                    {
                      text: [
                        entry.date
                          ? new Date(entry.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : '',
                        entry.author ? `by ${entry.author}` : '',
                      ]
                        .filter(Boolean)
                        .join(' · '),
                      textSize: 'subtitle2' as const,
                    },
                  ]
                : []),
              ...(entry.body
                ? [{ text: entry.body, textSize: 'body1' as const }]
                : []),
            ],
            buttons: [
              {
                label: 'back-to-blog',
                text: '← Back to Blog',
                textSize: 'body1' as const,
                variant: 'text' as const,
                href: '/blog',
              },
            ],
        },
      ],
    },
  };

  return { props: { pageContent, siteConfig } };
};
