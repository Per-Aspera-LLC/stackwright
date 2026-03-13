/**
 * Hint maps for schema-driven scaffold content generation.
 *
 * Each function returns a HintMap that tells generateDefaults() what semantic
 * values to use for scaffold output. The hints are flat dot-path overrides —
 * the generator handles structural correctness from the Zod schema.
 */

import type { HintMap } from './schema-defaults';

// ---------------------------------------------------------------------------
// Site Config (stackwright.yml)
// ---------------------------------------------------------------------------

export function getSiteConfigHints(siteTitle: string, themeId: string, year: number): HintMap {
  return {
    // Required top-level
    title: { value: siteTitle },

    // Optional: themeName
    themeName: { value: themeId, include: true },

    // Required: navigation (array)
    navigation: { arrayLength: 2 },
    'navigation.0.label': { value: 'Home' },
    'navigation.0.href': { value: '/' },
    'navigation.1.label': { value: 'Getting Started' },
    'navigation.1.href': { value: '/getting-started' },

    // Required: appBar
    'appBar.titleText': { value: siteTitle },
    'appBar.backgroundColor': { value: 'primary', include: true },
    'appBar.textColor': { value: 'secondary', include: true },

    // Optional: footer
    footer: { include: true },
    'footer.backgroundColor': { value: 'primary', include: true },
    'footer.textColor': { value: 'secondary', include: true },
    'footer.copyright': { value: `© ${year} ${siteTitle}. All rights reserved.`, include: true },
    'footer.links': { arrayLength: 0, include: true },

    // Optional: customTheme
    customTheme: { include: true },
    'customTheme.id': { value: 'custom' },
    'customTheme.name': { value: `${siteTitle} Theme` },
    'customTheme.description': { value: `Custom theme for ${siteTitle}` },
    'customTheme.colors.primary': { value: '#1976d2' },
    'customTheme.colors.secondary': { value: '#ffffff' },
    'customTheme.colors.accent': { value: '#ff9800' },
    'customTheme.colors.background': { value: '#fdfdfd' },
    'customTheme.colors.surface': { value: '#f5f5f5' },
    'customTheme.colors.text': { value: '#1a1a1a' },
    'customTheme.colors.textSecondary': { value: '#666666' },
    'customTheme.typography.fontFamily.primary': { value: 'Inter' },
    'customTheme.typography.fontFamily.secondary': { value: 'Inter' },
    'customTheme.typography.scale.xs': { value: '0.75rem' },
    'customTheme.typography.scale.sm': { value: '0.875rem' },
    'customTheme.typography.scale.base': { value: '1rem' },
    'customTheme.typography.scale.lg': { value: '1.125rem' },
    'customTheme.typography.scale.xl': { value: '1.25rem' },
    'customTheme.typography.scale.2xl': { value: '1.5rem' },
    'customTheme.typography.scale.3xl': { value: '1.875rem' },
    'customTheme.spacing.xs': { value: '0.5rem' },
    'customTheme.spacing.sm': { value: '0.75rem' },
    'customTheme.spacing.md': { value: '1rem' },
    'customTheme.spacing.lg': { value: '1.5rem' },
    'customTheme.spacing.xl': { value: '2rem' },
    'customTheme.spacing.2xl': { value: '3rem' },
  };
}

// ---------------------------------------------------------------------------
// Root Page (pages/content.yml)
// ---------------------------------------------------------------------------

export function getRootPageHints(siteTitle: string): HintMap {
  return {
    'content.content_items': { arrayLength: 1 },
    'content.content_items.0': { pick: 'main' },
    'content.content_items.0.label': { value: 'hero-section' },
    'content.content_items.0.heading.text': { value: `Welcome to ${siteTitle}` },
    'content.content_items.0.heading.textSize': { value: 'h1' },
    'content.content_items.0.heading.textColor': { value: 'secondary', include: true },
    'content.content_items.0.textBlocks': { arrayLength: 2 },
    'content.content_items.0.textBlocks.0.text': {
      value:
        'Your new Stackwright site is ready. Pages are YAML files — edit pages/content.yml to update this page.',
    },
    'content.content_items.0.textBlocks.0.textSize': { value: 'h6' },
    'content.content_items.0.textBlocks.1.text': {
      value:
        'Add more pages by creating subdirectories under pages/. Each directory with a content.yml becomes a route.',
    },
    'content.content_items.0.textBlocks.1.textSize': { value: 'body1' },
    'content.content_items.0.buttons': { arrayLength: 1, include: true },
    'content.content_items.0.buttons.0.label': { value: 'get-started-btn' },
    'content.content_items.0.buttons.0.text': { value: 'Get Started' },
    'content.content_items.0.buttons.0.textSize': { value: 'body1' },
    'content.content_items.0.buttons.0.variant': { value: 'contained' },
    'content.content_items.0.buttons.0.href': { value: '/getting-started', include: true },
    'content.content_items.0.buttons.0.bgColor': { value: 'secondary', include: true },
    'content.content_items.0.buttons.0.textColor': { value: 'primary', include: true },
    'content.content_items.0.buttons.0.size': { value: 'large', include: true },
  };
}

// ---------------------------------------------------------------------------
// Getting Started Page (pages/getting-started/content.yml)
// ---------------------------------------------------------------------------

export function getGettingStartedHints(): HintMap {
  return {
    'content.content_items': { arrayLength: 5 },

    // Item 0: Hero
    'content.content_items.0': { pick: 'main' },
    'content.content_items.0.label': { value: 'gs-hero' },
    'content.content_items.0.heading.text': { value: 'Getting Started' },
    'content.content_items.0.heading.textSize': { value: 'h1' },
    'content.content_items.0.heading.textColor': { value: 'secondary', include: true },
    'content.content_items.0.textBlocks': { arrayLength: 1 },
    'content.content_items.0.textBlocks.0.text': {
      value:
        'This page lives at pages/getting-started/content.yml. The directory name becomes the URL slug.',
    },
    'content.content_items.0.textBlocks.0.textSize': { value: 'body1' },

    // Item 1: Adding Pages
    'content.content_items.1': { pick: 'main' },
    'content.content_items.1.label': { value: 'gs-add-page' },
    'content.content_items.1.heading.text': { value: 'Adding Pages' },
    'content.content_items.1.heading.textSize': { value: 'h2' },
    'content.content_items.1.textBlocks': { arrayLength: 1 },
    'content.content_items.1.textBlocks.0.text': {
      value: 'Use the CLI to add a new page, or create the directory and content.yml manually:',
    },
    'content.content_items.1.textBlocks.0.textSize': { value: 'body1' },
    'content.content_items.1.background': { value: '#f5f5f5', include: true },

    // Item 2: Code block
    'content.content_items.2': { pick: 'code_block' },
    'content.content_items.2.label': { value: 'gs-add-page-code' },
    'content.content_items.2.language': { value: 'bash', include: true },
    'content.content_items.2.code': {
      value: 'stackwright page add my-page --heading "My New Page"',
    },
    'content.content_items.2.background': { value: '#f5f5f5', include: true },

    // Item 3: Content Types
    'content.content_items.3': { pick: 'main' },
    'content.content_items.3.label': { value: 'gs-content-types' },
    'content.content_items.3.heading.text': { value: 'Content Types' },
    'content.content_items.3.heading.textSize': { value: 'h2' },
    'content.content_items.3.textBlocks': { arrayLength: 1 },
    'content.content_items.3.textBlocks.0.text': {
      value:
        'Each entry in content_items uses a key that maps to a component: main, timeline, carousel, icon_grid, tabbed_content, code_block.',
    },
    'content.content_items.3.textBlocks.0.textSize': { value: 'body1' },

    // Item 4: Theme Customization
    'content.content_items.4': { pick: 'main' },
    'content.content_items.4.label': { value: 'gs-theme' },
    'content.content_items.4.heading.text': { value: 'Customizing the Theme' },
    'content.content_items.4.heading.textSize': { value: 'h2' },
    'content.content_items.4.textBlocks': { arrayLength: 1 },
    'content.content_items.4.textBlocks.0.text': {
      value:
        'Edit the customTheme block in stackwright.yml to change colors and typography across every page instantly.',
    },
    'content.content_items.4.textBlocks.0.textSize': { value: 'body1' },
    'content.content_items.4.background': { value: '#f5f5f5', include: true },
  };
}
