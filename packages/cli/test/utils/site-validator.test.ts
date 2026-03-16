import { describe, it, expect } from 'vitest';
import { validateSiteComposition } from '../../src/utils/site-validator';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const VALID_SITE_CONFIG = `
title: "Test Site"
navigation:
  - label: "Home"
    href: "/"
  - label: "About"
    href: "/about"
appBar:
  titleText: "Test Site"
customTheme:
  id: test
  name: Test Theme
  description: Test theme for validation
  colors:
    primary: "#1976d2"
    secondary: "#ffffff"
    accent: "#ff9800"
    background: "#fdfdfd"
    surface: "#f5f5f5"
    text: "#1a1a1a"
    textSecondary: "#666666"
  typography:
    fontFamily:
      primary: Inter
      secondary: Inter
    scale:
      xs: "0.75rem"
      sm: "0.875rem"
      base: "1rem"
      lg: "1.125rem"
      xl: "1.25rem"
      2xl: "1.5rem"
      3xl: "1.875rem"
  spacing:
    xs: "0.5rem"
    sm: "0.75rem"
    md: "1rem"
    lg: "1.5rem"
    xl: "2rem"
    2xl: "3rem"
`;

const VALID_ROOT_PAGE = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Welcome"
        textSize: "h1"
      textBlocks:
        - text: "Hello world"
          textSize: "body1"
`;

const VALID_ABOUT_PAGE = `
content:
  content_items:
    - type: main
      label: "about-hero"
      heading:
        text: "About Us"
        textSize: "h1"
      textBlocks:
        - text: "We are a company."
          textSize: "body1"
`;

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe('validateSiteComposition — schema validation', () => {
  it('returns valid: true for a coherent site', () => {
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      about: VALID_ABOUT_PAGE,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns schema errors for invalid site config YAML syntax', () => {
    const result = validateSiteComposition('bad: yaml: [[broken', {
      '/': VALID_ROOT_PAGE,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.category === 'schema' && e.source === '_site')).toBe(true);
  });

  it('returns schema errors for site config missing required fields', () => {
    const result = validateSiteComposition('themeName: corporate\n', {
      '/': VALID_ROOT_PAGE,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.category === 'schema' && e.source === '_site')).toBe(true);
  });

  it('returns schema errors for invalid page YAML', () => {
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': 'bad: yaml: [[broken',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.category === 'schema' && e.source === '/')).toBe(true);
  });

  it('returns schema errors for page missing required fields', () => {
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': 'content:\n  content_items: "not-an-array"\n',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.source === '/')).toBe(true);
  });

  it('still validates pages when site config is invalid', () => {
    const result = validateSiteComposition('invalid: true\n', {
      '/': 'bad: yaml: [[broken',
    });
    expect(result.valid).toBe(false);
    // Should have errors for both site config and the page
    expect(result.errors.some((e) => e.source === '_site')).toBe(true);
    expect(result.errors.some((e) => e.source === '/')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Navigation checks
// ---------------------------------------------------------------------------

describe('validateSiteComposition — navigation linkage', () => {
  it('reports error when navigation href has no matching page', () => {
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
  - label: "Pricing"
    href: "/pricing"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(siteConfig, {
      '/': VALID_ROOT_PAGE,
    });
    expect(result.valid).toBe(false);
    const navError = result.errors.find(
      (e) => e.category === 'navigation' && e.message.includes('/pricing')
    );
    expect(navError).toBeDefined();
    expect(navError!.severity).toBe('error');
  });

  it('ignores external navigation hrefs', () => {
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
  - label: "GitHub"
    href: "https://github.com"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(siteConfig, {
      '/': VALID_ROOT_PAGE,
    });
    expect(result.valid).toBe(true);
  });

  it('reports warning for orphan pages not in navigation', () => {
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      about: VALID_ABOUT_PAGE,
      secret: VALID_ABOUT_PAGE,
    });
    const orphanWarning = result.warnings.find(
      (w) => w.category === 'navigation' && w.message.includes('secret')
    );
    expect(orphanWarning).toBeDefined();
    expect(orphanWarning!.severity).toBe('warning');
  });
});

// ---------------------------------------------------------------------------
// Button link checks
// ---------------------------------------------------------------------------

describe('validateSiteComposition — button links', () => {
  it('warns when a button href points to a non-existent page', () => {
    const pageWithButton = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Hello"
        textSize: "h1"
      textBlocks:
        - text: "Hi"
          textSize: "body1"
      buttons:
        - text: "Go"
          textSize: "body1"
          variant: "contained"
          href: "/nonexistent"
`;
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(siteConfig, {
      '/': pageWithButton,
    });
    const linkWarning = result.warnings.find(
      (w) => w.category === 'links' && w.message.includes('/nonexistent')
    );
    expect(linkWarning).toBeDefined();
  });

  it('does not warn when button href points to an existing page', () => {
    const pageWithButton = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Hello"
        textSize: "h1"
      textBlocks:
        - text: "Hi"
          textSize: "body1"
      buttons:
        - text: "About"
          textSize: "body1"
          variant: "contained"
          href: "/about"
`;
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': pageWithButton,
      about: VALID_ABOUT_PAGE,
    });
    const linkWarnings = result.warnings.filter((w) => w.category === 'links');
    expect(linkWarnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Collection checks
// ---------------------------------------------------------------------------

describe('validateSiteComposition — collection references', () => {
  it('warns when collection_list references unknown collection', () => {
    const pageWithCollection = `
content:
  content_items:
    - type: collection_list
      label: "posts-list"
      source: "posts"
      layout: "cards"
      card:
        title: "{{title}}"
`;
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(
      siteConfig,
      { '/': pageWithCollection },
      { existingCollections: ['products'] }
    );
    const colWarning = result.warnings.find(
      (w) => w.category === 'collections' && w.message.includes('posts')
    );
    expect(colWarning).toBeDefined();
  });

  it('does not warn when collection_list references a known collection', () => {
    const pageWithCollection = `
content:
  content_items:
    - type: collection_list
      label: "posts-list"
      source: "posts"
      layout: "cards"
      card:
        title: "{{title}}"
`;
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(
      siteConfig,
      { '/': pageWithCollection },
      { existingCollections: ['posts'] }
    );
    const colWarnings = result.warnings.filter((w) => w.category === 'collections');
    expect(colWarnings).toHaveLength(0);
  });

  it('skips collection check when existingCollections is not provided', () => {
    const pageWithCollection = `
content:
  content_items:
    - type: collection_list
      label: "posts-list"
      source: "posts"
      layout: "cards"
      card:
        title: "{{title}}"
`;
    const siteConfig = `
title: "Test"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test"
`;
    const result = validateSiteComposition(siteConfig, { '/': pageWithCollection });
    const colWarnings = result.warnings.filter((w) => w.category === 'collections');
    expect(colWarnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// SEO checks
// ---------------------------------------------------------------------------

describe('validateSiteComposition — duplicate titles', () => {
  it('warns when two pages have the same meta.title', () => {
    const page1 = `
content:
  meta:
    title: "Same Title"
  content_items:
    - type: main
      label: "p1"
      heading:
        text: "Page 1"
        textSize: "h1"
      textBlocks:
        - text: "Content"
          textSize: "body1"
`;
    const page2 = `
content:
  meta:
    title: "Same Title"
  content_items:
    - type: main
      label: "p2"
      heading:
        text: "Page 2"
        textSize: "h1"
      textBlocks:
        - text: "Content"
          textSize: "body1"
`;
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': page1,
      about: page2,
    });
    const seoWarning = result.warnings.find(
      (w) => w.category === 'seo' && w.message.includes('Same Title')
    );
    expect(seoWarning).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Theme color checks
// ---------------------------------------------------------------------------

describe('validateSiteComposition — theme color references', () => {
  it('warns when content references a color not in the palette', () => {
    const pageWithBadColor = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Hello"
        textSize: "h1"
      textBlocks:
        - text: "Hi"
          textSize: "body1"
      background: "nonexistent-color"
`;
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': pageWithBadColor,
      about: VALID_ABOUT_PAGE,
    });
    const themeWarning = result.warnings.find(
      (w) => w.category === 'theme' && w.message.includes('nonexistent-color')
    );
    expect(themeWarning).toBeDefined();
  });

  it('does not warn for hex colors', () => {
    const pageWithHexColor = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Hello"
        textSize: "h1"
      textBlocks:
        - text: "Hi"
          textSize: "body1"
      background: "#ff0000"
`;
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': pageWithHexColor,
      about: VALID_ABOUT_PAGE,
    });
    const themeWarnings = result.warnings.filter((w) => w.category === 'theme');
    expect(themeWarnings).toHaveLength(0);
  });

  it('does not warn for valid palette key references', () => {
    const pageWithPaletteRef = `
content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Hello"
        textSize: "h1"
      textBlocks:
        - text: "Hi"
          textSize: "body1"
      background: "primary"
`;
    const result = validateSiteComposition(VALID_SITE_CONFIG, {
      '/': pageWithPaletteRef,
      about: VALID_ABOUT_PAGE,
    });
    const themeWarnings = result.warnings.filter((w) => w.category === 'theme');
    expect(themeWarnings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Skips cross-page checks on invalid site config
// ---------------------------------------------------------------------------

describe('validateSiteComposition — cross-check gating', () => {
  it('skips navigation checks when site config is schema-invalid', () => {
    const invalidConfig = 'themeName: corporate\n';
    const result = validateSiteComposition(invalidConfig, {
      '/': VALID_ROOT_PAGE,
    });
    // Should have schema errors but no navigation errors
    expect(result.errors.some((e) => e.category === 'schema')).toBe(true);
    expect(result.errors.some((e) => e.category === 'navigation')).toBe(false);
    expect(result.warnings.some((w) => w.category === 'navigation')).toBe(false);
  });
});
