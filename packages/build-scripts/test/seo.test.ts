import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateSitemap, generateRobotsTxt, collectPageMeta } from '../src/seo';
import type { SitemapOptions } from '../src/seo';

// ---------------------------------------------------------------------------
// generateSitemap
// ---------------------------------------------------------------------------

describe('generateSitemap', () => {
  const baseOptions: SitemapOptions = {
    pages: [],
    baseUrl: 'https://example.com',
    buildDate: '2026-05-31',
  };

  it('returns valid XML with correct namespace declarations', () => {
    const xml = generateSitemap(baseOptions);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('</urlset>');
  });

  it('generates empty urlset when no pages are provided', () => {
    const xml = generateSitemap(baseOptions);
    expect(xml).not.toContain('<url>');
  });

  it('includes page slugs as <url> entries', () => {
    const xml = generateSitemap({
      ...baseOptions,
      pages: [{ slug: null }, { slug: 'about' }, { slug: 'docs/getting-started' }],
    });
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/about</loc>');
    expect(xml).toContain('<loc>https://example.com/docs/getting-started</loc>');
  });

  it('sets <lastmod> to the build date', () => {
    const xml = generateSitemap({
      ...baseOptions,
      pages: [{ slug: 'about' }],
    });
    expect(xml).toContain('<lastmod>2026-05-31</lastmod>');
  });

  it('excludes pages with noindex: true', () => {
    const xml = generateSitemap({
      ...baseOptions,
      pages: [{ slug: 'about' }, { slug: 'contact', meta: { noindex: true } }, { slug: 'blog' }],
    });
    expect(xml).toContain('https://example.com/about');
    expect(xml).toContain('https://example.com/blog');
    expect(xml).not.toContain('https://example.com/contact');
  });

  it('adds xhtml:link alternates for locale variants', () => {
    const xml = generateSitemap({
      ...baseOptions,
      pages: [{ slug: 'about' }, { slug: 'about', locale: 'fr' }],
    });
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain('hreflang="fr"');
    expect(xml).toContain('href="https://example.com/about"');
    expect(xml).toContain('href="https://example.com/fr/about"');
  });

  it('strips trailing slash from baseUrl', () => {
    const xml = generateSitemap({
      ...baseOptions,
      baseUrl: 'https://example.com/',
      pages: [{ slug: 'about' }],
    });
    expect(xml).toContain('<loc>https://example.com/about</loc>');
    expect(xml).not.toContain('example.com//');
  });

  it('handles locale root pages correctly', () => {
    const xml = generateSitemap({
      ...baseOptions,
      pages: [{ slug: null }, { slug: null, locale: 'fr' }],
    });
    expect(xml).toContain('https://example.com/');
    expect(xml).toContain('https://example.com/fr');
  });
});

// ---------------------------------------------------------------------------
// generateRobotsTxt
// ---------------------------------------------------------------------------

describe('generateRobotsTxt', () => {
  it('includes User-agent, Allow, and Disallow directives', () => {
    const txt = generateRobotsTxt('https://example.com');
    expect(txt).toContain('User-agent: *');
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Disallow: /api/');
    expect(txt).toContain('Disallow: /_next/');
    expect(txt).toContain('Disallow: /stackwright-content/');
  });

  it('references the sitemap URL', () => {
    const txt = generateRobotsTxt('https://example.com');
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
  });

  it('strips trailing slash from baseUrl', () => {
    const txt = generateRobotsTxt('https://example.com/');
    expect(txt).toContain('Sitemap: https://example.com/sitemap.xml');
    expect(txt).not.toContain('example.com//');
  });
});

// ---------------------------------------------------------------------------
// collectPageMeta
// ---------------------------------------------------------------------------

describe('collectPageMeta', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-seo-test-'));
  });

  it('returns empty array for non-existent directory', () => {
    const pages = collectPageMeta('/non/existent/path');
    expect(pages).toEqual([]);
  });

  it('reads top-level page JSON files', () => {
    // Write _root.json and about.json
    fs.writeFileSync(
      path.join(tmpDir, '_root.json'),
      JSON.stringify({ content: { content_items: [] } })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'about.json'),
      JSON.stringify({ content: { content_items: [] } })
    );

    const pages = collectPageMeta(tmpDir);
    const slugs = pages.map((p) => p.slug);
    expect(slugs).toContain(null); // root page
    expect(slugs).toContain('about');
  });

  it('skips reserved files', () => {
    for (const reserved of [
      '_site.json',
      '_font-links.json',
      'search-index.json',
      '_icon-manifest.json',
      '_site.fr.json',
    ]) {
      fs.writeFileSync(path.join(tmpDir, reserved), '{}');
    }
    fs.writeFileSync(
      path.join(tmpDir, 'about.json'),
      JSON.stringify({ content: { content_items: [] } })
    );

    const pages = collectPageMeta(tmpDir);
    expect(pages).toHaveLength(1);
    expect(pages[0].slug).toBe('about');
  });

  it('skips collections directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'collections'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'collections', 'blog.json'), '{}');

    const pages = collectPageMeta(tmpDir);
    expect(pages).toHaveLength(0);
  });

  it('extracts noindex from page meta', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'secret.json'),
      JSON.stringify({ content: { meta: { noindex: true }, content_items: [] } })
    );

    const pages = collectPageMeta(tmpDir);
    expect(pages[0].meta?.noindex).toBe(true);
  });

  it('handles locale subdirectories', () => {
    fs.mkdirSync(path.join(tmpDir, 'fr'), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, 'fr', '_root.json'),
      JSON.stringify({ content: { content_items: [] } })
    );
    fs.writeFileSync(
      path.join(tmpDir, 'fr', 'about.json'),
      JSON.stringify({ content: { content_items: [] } })
    );

    const pages = collectPageMeta(tmpDir);
    const frRoot = pages.find((p) => p.locale === 'fr' && p.slug === null);
    const frAbout = pages.find((p) => p.locale === 'fr' && p.slug === 'about');
    expect(frRoot).toBeDefined();
    expect(frAbout).toBeDefined();
  });
});
