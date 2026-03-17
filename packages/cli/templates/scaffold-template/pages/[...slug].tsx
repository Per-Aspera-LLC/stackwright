import { DynamicPage } from '@stackwright/core';
import type { GetStaticPaths, GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';

export default DynamicPage;

/** Recursively find all .json files, returning paths relative to baseDir. */
function findContentFiles(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'collections') continue; // raw data, not pages
    if (entry.isDirectory()) {
      results.push(...findContentFiles(path.join(dir, entry.name), baseDir));
    } else if (
      entry.name.endsWith('.json') &&
      entry.name !== '_site.json' &&
      entry.name !== '_root.json'
    ) {
      const rel = path.relative(baseDir, path.join(dir, entry.name));
      results.push(rel.replace(/\.json$/, '').replace(/\\/g, '/'));
    }
  }
  return results;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const dir = path.join(process.cwd(), 'public', 'stackwright-content');
  const slugPaths = findContentFiles(dir, dir);
  return {
    paths: slugPaths.map((slugPath) => ({
      params: { slug: slugPath.split('/') },
    })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const segments = Array.isArray(params?.slug) ? params.slug : [params?.slug ?? ''];
  const slugPath = segments.join('/');
  const dir = path.join(process.cwd(), 'public', 'stackwright-content');

  // Validate against known content files to prevent path traversal
  const knownPaths = new Set(findContentFiles(dir, dir));
  if (!knownPaths.has(slugPath)) {
    return { notFound: true };
  }

  const contentFile = path.join(dir, `${slugPath}.json`);
  if (!fs.existsSync(contentFile)) {
    return { notFound: true };
  }

  const pageContent = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
  const siteConfig = JSON.parse(fs.readFileSync(path.join(dir, '_site.json'), 'utf8'));
  return { props: { pageContent, siteConfig } };
};
