/**
 * Shared test fixtures for Stackwright E2E tests.
 *
 * Page routes and content type locations vary by example site.
 * This module provides site-aware constants so tests don't hardcode paths.
 */

const TEST_SITE = process.env.TEST_SITE || 'stackwright-docs';

/** Pages that exist on the current test site. */
export interface SitePage {
  path: string;
  name: string;
}

const DOCS_PAGES: SitePage[] = [
  { path: '/', name: 'Home' },
  { path: '/getting-started', name: 'Getting Started' },
  { path: '/content-types', name: 'Content Types' },
  { path: '/cli', name: 'CLI Reference' },
  { path: '/otter-raft', name: 'Otter Raft' },
  { path: '/showcase', name: 'Showcase' },
];

const HELLO_PAGES: SitePage[] = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/getting-started', name: 'Getting Started' },
  { path: '/showcase', name: 'Showcase' },
  { path: '/privacy-policy', name: 'Privacy Policy' },
  { path: '/terms-of-service', name: 'Terms of Service' },
  { path: '/blog', name: 'Blog' },
];

export const PAGES: SitePage[] = TEST_SITE === 'stackwright-docs' ? DOCS_PAGES : HELLO_PAGES;

/** Page that has all content type demos. */
export const SHOWCASE_PAGE = '/showcase';

/** Content type sections on the showcase page, identified by data-label. */
const DOCS_SHOWCASE_SECTIONS = [
  { label: 'main-demo', name: 'main' },
  { label: 'carousel-demo', name: 'carousel' },
  { label: 'timeline-demo', name: 'timeline' },
  { label: 'icon-grid-demo', name: 'icon_grid' },
  { label: 'tabbed-content-demo', name: 'tabbed_content' },
  { label: 'code-block-yaml-demo', name: 'code_block' },
  { label: 'feature-list-demo', name: 'feature_list' },
  { label: 'testimonial-grid-demo', name: 'testimonial_grid' },
  { label: 'faq-demo', name: 'faq' },
  { label: 'pricing-table-demo', name: 'pricing_table' },
  { label: 'alert-info-demo', name: 'alert' },
  { label: 'contact-form-stub-demo', name: 'contact_form_stub' },
  { label: 'text-block-demo', name: 'text_block' },
  { label: 'grid-demo', name: 'grid' },
];

const HELLO_SHOWCASE_SECTIONS = [
  { label: 'main-demo', name: 'main' },
  { label: 'carousel-demo', name: 'carousel' },
  { label: 'timeline-demo', name: 'timeline' },
  { label: 'icon-grid-demo', name: 'icon_grid' },
  { label: 'tabbed-content-demo', name: 'tabbed_content' },
  { label: 'code-block-yaml-demo', name: 'code_block' },
  { label: 'feature-list-demo', name: 'feature_list' },
  { label: 'testimonial-grid-demo', name: 'testimonial_grid' },
  { label: 'faq-demo', name: 'faq' },
  { label: 'pricing-table-demo', name: 'pricing_table' },
  { label: 'alert-info-demo', name: 'alert' },
  { label: 'contact-form-stub-demo', name: 'contact_form_stub' },
];

export const SHOWCASE_SECTIONS = TEST_SITE === 'stackwright-docs' ? DOCS_SHOWCASE_SECTIONS : HELLO_SHOWCASE_SECTIONS;

/** Nav link text patterns (docs uses emoji prefixes). */
export const NAV_PATTERNS: { [key: string]: { text: RegExp; path: string } | undefined } = TEST_SITE === 'stackwright-docs'
  ? {
      home: { text: /Home/i, path: '/' },
      gettingStarted: { text: /Getting Started/i, path: '/getting-started' },
      contentTypes: { text: /Content Types/i, path: '/content-types' },
      cli: { text: /CLI/i, path: '/cli' },
      otterRaft: { text: /Otter Raft/i, path: '/otter-raft' },
      showcase: { text: /Showcase/i, path: '/showcase' },
    }
  : {
      home: { text: /Home/i, path: '/' },
      about: { text: /About/i, path: '/about' },
      gettingStarted: { text: /Getting Started/i, path: '/getting-started' },
      showcase: { text: /Showcase/i, path: '/showcase' },
      blog: { text: /Blog/i, path: '/blog' },
    };

/** Whether the current site has a theme toggle button. */
export const HAS_THEME_TOGGLE = TEST_SITE !== 'stackwright-docs';
