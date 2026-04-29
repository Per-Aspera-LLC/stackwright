import { describe, it, expect } from 'vitest';
import {
  highlightCode,
  getTokenColor,
  highlightCodeWithMode,
} from '../../src/utils/prismHighlighter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert every token in an array satisfies the HighlightToken shape. */
function expectWellFormedTokens(tokens: ReturnType<typeof highlightCode>) {
  for (const token of tokens) {
    expect(token.type === null || typeof token.type === 'string').toBe(true);
    expect(typeof token.content).toBe('string');
  }
}

// ---------------------------------------------------------------------------
// highlightCode
// ---------------------------------------------------------------------------

describe('highlightCode', () => {
  it('returns a single plain-text token when no language is provided', () => {
    const tokens = highlightCode('hello');
    expect(tokens).toEqual([{ type: null, content: 'hello' }]);
  });

  it('falls back to plain-text when the language is unsupported', () => {
    const tokens = highlightCode('hello', 'cobol');
    expect(tokens).toEqual([{ type: null, content: 'hello' }]);
  });

  it('produces at least one keyword token for JavaScript "const"', () => {
    const tokens = highlightCode('const x = 1;', 'javascript');
    expect(tokens.some((t) => t.type === 'keyword')).toBe(true);
  });

  describe('language alias resolution', () => {
    it('"js" resolves to javascript and produces keyword tokens', () => {
      const tokens = highlightCode('const x = 1;', 'js');
      expect(tokens.some((t) => t.type === 'keyword')).toBe(true);
    });

    it('"yml" resolves to yaml and produces typed tokens', () => {
      const tokens = highlightCode('x: 1', 'yml');
      expect(tokens.some((t) => t.type !== null)).toBe(true);
    });

    it('"py" resolves to python and produces typed tokens', () => {
      const tokens = highlightCode('def f(): pass', 'py');
      expect(tokens.some((t) => t.type !== null)).toBe(true);
    });

    it('"sh" resolves to bash and produces typed tokens', () => {
      const tokens = highlightCode('echo hi', 'sh');
      expect(tokens.some((t) => t.type !== null)).toBe(true);
    });

    it('"shell" resolves to bash and produces typed tokens', () => {
      const tokens = highlightCode('echo hi', 'shell');
      expect(tokens.some((t) => t.type !== null)).toBe(true);
    });
  });

  it('every token from any call has the correct HighlightToken shape', () => {
    const cases = [
      highlightCode('hello'),
      highlightCode('hello', 'cobol'),
      highlightCode('const x = 1;', 'javascript'),
      highlightCode('x: 1', 'yml'),
    ];
    for (const tokens of cases) {
      expectWellFormedTokens(tokens);
    }
  });

  it('multi-line code produces more than 2 tokens for JavaScript', () => {
    const tokens = highlightCode('const a = 1;\nconst b = 2;', 'javascript');
    expect(tokens.length).toBeGreaterThan(2);
  });
});

// ---------------------------------------------------------------------------
// getTokenColor
// ---------------------------------------------------------------------------

describe('getTokenColor', () => {
  it('returns a truthy string for a known token type in light mode', () => {
    const color = getTokenColor('keyword');
    expect(typeof color).toBe('string');
    expect(color).toBeTruthy();
  });

  it('returns a different color in dark mode vs light mode for the same token type', () => {
    const light = getTokenColor('keyword', false);
    const dark = getTokenColor('keyword', true);
    expect(typeof dark).toBe('string');
    expect(dark).not.toBe(light);
  });

  it('returns undefined for a null type', () => {
    expect(getTokenColor(null)).toBeUndefined();
  });

  it('returns undefined for an unknown token type', () => {
    expect(getTokenColor('unknownXYZ')).toBeUndefined();
  });

  it('defaults to light mode when isDark is not provided', () => {
    expect(getTokenColor('string')).toBe(getTokenColor('string', false));
  });
});

// ---------------------------------------------------------------------------
// highlightCodeWithMode
// ---------------------------------------------------------------------------

describe('highlightCodeWithMode', () => {
  it('attaches a resolved color string to every token with a known type', () => {
    const tokens = highlightCodeWithMode('const x = 1;', 'javascript', false);

    // Every token whose type resolves to a color must carry that color.
    for (const token of tokens) {
      const expected = getTokenColor(token.type, false);
      if (expected !== undefined) {
        expect(token.color).toBe(expected);
      }
    }

    // Specifically: the keyword token color must match getTokenColor('keyword', false).
    const kwToken = tokens.find((t) => t.type === 'keyword');
    expect(kwToken).toBeDefined();
    expect(kwToken!.color).toBe(getTokenColor('keyword', false));
  });

  it('dark-mode keyword color differs from light-mode keyword color', () => {
    const lightTokens = highlightCodeWithMode('const x = 1;', 'javascript', false);
    const darkTokens = highlightCodeWithMode('const x = 1;', 'javascript', true);

    const lightKw = lightTokens.find((t) => t.type === 'keyword');
    const darkKw = darkTokens.find((t) => t.type === 'keyword');

    expect(lightKw).toBeDefined();
    expect(darkKw).toBeDefined();
    expect(lightKw!.color).not.toBe(darkKw!.color);
  });
});
