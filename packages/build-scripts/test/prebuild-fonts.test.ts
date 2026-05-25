import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  extractGoogleFontNames,
  generateGoogleFontsUrl,
  generateFontLinkTags,
  getAllGoogleFontNames,
  downloadAndBundleFonts,
} from '../src/prebuild';

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

// --------------------------------------------------------------------------
// getAllGoogleFontNames tests
// --------------------------------------------------------------------------

describe('getAllGoogleFontNames', () => {
  it('extracts fonts from primary fontFamily', () => {
    const siteConfig = {
      customTheme: { typography: { fontFamily: { primary: 'Roboto, sans-serif', secondary: '' } } },
    };
    expect(getAllGoogleFontNames(siteConfig)).toEqual(['Roboto']);
  });

  it('extracts fonts from both primary and secondary', () => {
    const siteConfig = {
      customTheme: {
        typography: { fontFamily: { primary: 'Inter, sans-serif', secondary: 'Open Sans, serif' } },
      },
    };
    expect(getAllGoogleFontNames(siteConfig)).toEqual(['Inter', 'Open Sans']);
  });

  it('deduplicates fonts that appear in both primary and secondary', () => {
    const siteConfig = {
      customTheme: {
        typography: {
          fontFamily: { primary: 'Roboto, sans-serif', secondary: 'Roboto, monospace' },
        },
      },
    };
    const result = getAllGoogleFontNames(siteConfig);
    expect(result).toEqual(['Roboto']);
    expect(result).toHaveLength(1);
  });

  it('returns empty array when customTheme is missing', () => {
    expect(getAllGoogleFontNames({})).toEqual([]);
  });

  it('returns empty array when typography is missing', () => {
    expect(getAllGoogleFontNames({ customTheme: { colors: {} } })).toEqual([]);
  });

  it('returns empty array when fontFamily is missing', () => {
    expect(getAllGoogleFontNames({ customTheme: { typography: {} } })).toEqual([]);
  });

  it('returns empty array for null siteConfig', () => {
    expect(getAllGoogleFontNames(null)).toEqual([]);
  });

  it('returns empty array when only system fonts are used', () => {
    const siteConfig = {
      customTheme: {
        typography: { fontFamily: { primary: 'sans-serif', secondary: 'serif' } },
      },
    };
    expect(getAllGoogleFontNames(siteConfig)).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// downloadAndBundleFonts tests
// --------------------------------------------------------------------------

describe('downloadAndBundleFonts', () => {
  let tmpDir: string;

  afterEach(() => {
    vi.unstubAllGlobals();
    // Clean up temp dir if it was created
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('returns empty array for empty fonts list', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-test-'));
    const result = await downloadAndBundleFonts([], tmpDir);
    expect(result).toEqual([]);
  });

  it('returns local stylesheet link when fetch succeeds with woff2 URLs', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-test-'));

    const mockCss = [
      '@font-face {',
      "  font-family: 'Roboto';",
      "  src: url(https://fonts.gstatic.com/s/roboto/v47/KFOMCnqEu92Fr1ME7kSn.woff2) format('woff2');",
      '}',
    ].join('\n');

    const mockFetch = vi
      .fn()
      // First call: fetch the Google Fonts CSS
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockCss })
      // Second call: download the woff2 file
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        arrayBuffer: async () => new ArrayBuffer(8),
      });

    vi.stubGlobal('fetch', mockFetch);

    const result = await downloadAndBundleFonts(['Roboto'], tmpDir);

    expect(result).toEqual([{ rel: 'stylesheet', href: '/fonts/fonts.css' }]);

    // fonts.css should exist and contain local path
    const cssPath = path.join(tmpDir, 'fonts', 'fonts.css');
    expect(fs.existsSync(cssPath)).toBe(true);
    const writtenCss = fs.readFileSync(cssPath, 'utf8');
    expect(writtenCss).toContain('/fonts/');
    expect(writtenCss).not.toContain('fonts.gstatic.com');

    // The woff2 file should be downloaded
    const fontsDir = path.join(tmpDir, 'fonts');
    const files = fs.readdirSync(fontsDir).filter((f) => f.endsWith('.woff2'));
    expect(files).toHaveLength(1);
    expect(files[0]).toBe('v47-KFOMCnqEu92Fr1ME7kSn.woff2');
  });

  it('falls back to external links when CSS fetch returns non-200', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-test-'));

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' });

    vi.stubGlobal('fetch', mockFetch);

    const result = await downloadAndBundleFonts(['Roboto'], tmpDir);

    // Falls back to external: preconnect + stylesheet
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: true,
    });
    expect(result[1].rel).toBe('stylesheet');
    expect(result[1].href).toContain('fonts.googleapis.com');
  });

  it('falls back to external links when fetch throws a network error', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-test-'));

    const mockFetch = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', mockFetch);

    const result = await downloadAndBundleFonts(['Inter'], tmpDir);

    expect(result).toHaveLength(2);
    expect(result[0].rel).toBe('preconnect');
    expect(result[1].href).toContain('family=Inter:wght@400');
  });

  it('writes fonts.css even when no woff2 URLs are found in CSS', async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-test-'));

    const mockCss = "/* no woff2 here */\n@font-face { font-family: 'Roboto'; }";
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockCss });

    vi.stubGlobal('fetch', mockFetch);

    const result = await downloadAndBundleFonts(['Roboto'], tmpDir);

    // Still returns local stylesheet (writes CSS even with no woff2s)
    expect(result).toEqual([{ rel: 'stylesheet', href: '/fonts/fonts.css' }]);
    expect(fs.existsSync(path.join(tmpDir, 'fonts', 'fonts.css'))).toBe(true);
  });
});
