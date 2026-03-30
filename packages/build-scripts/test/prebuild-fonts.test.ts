import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  extractGoogleFontNames,
  generateGoogleFontsUrl,
  generateFontLinkTags,
} from '../src/prebuild';
import { runPrebuild } from '../src/prebuild';

// --------------------------------------------------------------------------
// extractGoogleFontNames tests
// --------------------------------------------------------------------------

describe('extractGoogleFontNames', () => {
  it('extracts a single font name', () => {
    const result = extractGoogleFontNames('JetBrains Mono');
    expect(result).toEqual(['JetBrains Mono']);
  });

  it('extracts multiple fonts separated by commas', () => {
    const result = extractGoogleFontNames('Roboto, sans-serif');
    expect(result).toEqual(['Roboto']);
  });

  it('handles quoted font names', () => {
    const result = extractGoogleFontNames('"Helvetica Neue", Arial');
    expect(result).toEqual(['Helvetica Neue', 'Arial']);
  });

  it('handles single-quoted font names', () => {
    const result = extractGoogleFontNames("'Inter', system-ui");
    expect(result).toEqual(['Inter']);
  });

  it('handles mixed system fonts', () => {
    const result = extractGoogleFontNames('Roboto, Arial, sans-serif');
    expect(result).toEqual(['Roboto', 'Arial']);
  });

  it('filters out all system fonts', () => {
    const result = extractGoogleFontNames('serif, sans-serif');
    expect(result).toEqual([]);
  });

  it('handles empty string', () => {
    const result = extractGoogleFontNames('');
    expect(result).toEqual([]);
  });

  it('handles null input', () => {
    const result = extractGoogleFontNames(null as unknown as string);
    expect(result).toEqual([]);
  });

  it('handles undefined input', () => {
    const result = extractGoogleFontNames(undefined as unknown as string);
    expect(result).toEqual([]);
  });

  it('handles whitespace around font names', () => {
    const result = extractGoogleFontNames('  Roboto  ,  Arial  , sans-serif');
    expect(result).toEqual(['Roboto', 'Arial']);
  });

  it('handles complex mixed case', () => {
    const result = extractGoogleFontNames('Open Sans, serif, Inter');
    expect(result).toEqual(['Open Sans', 'Inter']);
  });

  it('handles font names with numbers', () => {
    const result = extractGoogleFontNames('Roboto Mono, Arial');
    expect(result).toEqual(['Roboto Mono', 'Arial']);
  });

  it('handles all CSS system font keywords', () => {
    const allSystemFonts =
      'serif, sans-serif, monospace, cursive, fantasy, system-ui, ui-serif, ui-sans-serif, ui-monospace, ui-rounded, math, emoji, fangsong';
    const result = extractGoogleFontNames(allSystemFonts);
    expect(result).toEqual([]);
  });

  it('handles font names with special characters', () => {
    const result = extractGoogleFontNames('"Roboto Flex", Arial');
    expect(result).toEqual(['Roboto Flex', 'Arial']);
  });
});

// --------------------------------------------------------------------------
// generateGoogleFontsUrl tests
// --------------------------------------------------------------------------

describe('generateGoogleFontsUrl', () => {
  it('generates URL for a single font', () => {
    const result = generateGoogleFontsUrl(['Roboto']);
    expect(result).toBe('https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap');
  });

  it('generates URL for multiple fonts', () => {
    const result = generateGoogleFontsUrl(['Roboto', 'Inter']);
    expect(result).toContain('family=Roboto:wght@400');
    expect(result).toContain('family=Inter:wght@400');
    expect(result).toContain('https://fonts.googleapis.com/css2?');
    expect(result).toContain('&display=swap');
  });

  it('handles empty array', () => {
    const result = generateGoogleFontsUrl([]);
    expect(result).toBe('');
  });

  it('handles null/undefined input', () => {
    const result = generateGoogleFontsUrl(null as unknown as string[]);
    expect(result).toBe('');
  });

  it('encodes spaces with plus signs', () => {
    const result = generateGoogleFontsUrl(['JetBrains Mono']);
    expect(result).toContain('family=JetBrains+Mono:wght@400');
  });

  it('handles fonts with multiple words', () => {
    const result = generateGoogleFontsUrl(['Open Sans', 'Helvetica Neue']);
    expect(result).toContain('family=Open+Sans:wght@400');
    expect(result).toContain('family=Helvetica+Neue:wght@400');
  });

  it('returns valid URL format', () => {
    const result = generateGoogleFontsUrl(['Roboto']);
    expect(result).toMatch(/^https:\/\/fonts\.googleapis\.com\/css2\?.*display=swap$/);
  });
});

// --------------------------------------------------------------------------
// generateFontLinkTags tests
// --------------------------------------------------------------------------

describe('generateFontLinkTags', () => {
  it('generates font links with primary font family', () => {
    const siteConfig = {
      customTheme: {
        typography: {
          fontFamily: {
            primary: 'Roboto, sans-serif',
            secondary: '',
          },
        },
      },
    };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: true,
    });
    expect(result[1].rel).toBe('stylesheet');
    expect(result[1].href).toContain('family=Roboto:wght@400');
  });

  it('generates font links with secondary font family', () => {
    const siteConfig = {
      customTheme: {
        typography: {
          fontFamily: {
            primary: 'sans-serif',
            secondary: 'Open Sans, sans-serif',
          },
        },
      },
    };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toHaveLength(2);
    expect(result[1].href).toContain('family=Open+Sans:wght@400');
  });

  it('deduplicates fonts from primary and secondary', () => {
    const siteConfig = {
      customTheme: {
        typography: {
          fontFamily: {
            primary: 'Roboto, sans-serif',
            secondary: 'Roboto, sans-serif',
          },
        },
      },
    };
    const result = generateFontLinkTags(siteConfig);
    // Should only have one font in the URL, not duplicated
    expect(result[1].href).toContain('family=Roboto:wght@400');
    // Count occurrences - should only appear once
    const fontCount = (result[1].href.match(/family=Roboto/g) || []).length;
    expect(fontCount).toBe(1);
  });

  it('returns empty array without customTheme', () => {
    const siteConfig = {};
    const result = generateFontLinkTags(siteConfig);
    expect(result).toEqual([]);
  });

  it('returns empty array with empty customTheme', () => {
    const siteConfig = { customTheme: {} };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toEqual([]);
  });

  it('returns empty array without typography', () => {
    const siteConfig = { customTheme: { colors: {} } };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toEqual([]);
  });

  it('returns empty array without fontFamily', () => {
    const siteConfig = {
      customTheme: { typography: { headings: {} } },
    };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toEqual([]);
  });

  it('combines fonts from both primary and secondary', () => {
    const siteConfig = {
      customTheme: {
        typography: {
          fontFamily: {
            primary: 'Roboto, sans-serif',
            secondary: 'Open Sans, sans-serif',
          },
        },
      },
    };
    const result = generateFontLinkTags(siteConfig);
    expect(result[1].href).toContain('family=Roboto:wght@400');
    expect(result[1].href).toContain('family=Open+Sans:wght@400');
  });

  it('handles null siteConfig', () => {
    const result = generateFontLinkTags(null);
    expect(result).toEqual([]);
  });

  it('handles undefined siteConfig', () => {
    const result = generateFontLinkTags(undefined);
    expect(result).toEqual([]);
  });

  it('generates font links with full theme structure', () => {
    const siteConfig = {
      customTheme: {
        id: 'test-theme',
        name: 'Test Theme',
        description: 'A test theme',
        colors: { primary: '#000' },
        typography: {
          scale: { base: 16 },
          fontFamily: {
            primary: 'Inter, sans-serif',
            secondary: 'Roboto Mono, monospace',
          },
        },
        spacing: { base: 8 },
      },
    };
    const result = generateFontLinkTags(siteConfig);
    expect(result).toHaveLength(2);
    expect(result[0].rel).toBe('preconnect');
    expect(result[1].rel).toBe('stylesheet');
    expect(result[1].href).toContain('family=Inter:wght@400');
    expect(result[1].href).toContain('family=Roboto+Mono:wght@400');
  });
});
