import { describe, it, expect, beforeAll } from 'vitest';
import {
  ensureHighlighter,
  highlightCode,
  getTokenColor,
  highlightCodeWithMode,
  isHighlighterReady,
} from '../../src/utils/shikiHighlighter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert every token satisfies the HighlightToken shape. */
function expectWellFormedTokens(tokens: ReturnType<typeof highlightCode>) {
  for (const token of tokens) {
    expect(token.type === null || typeof token.type === 'string').toBe(true);
    expect(typeof token.content).toBe('string');
  }
}

/** Assert at least one token carries a truthy `color`. */
function expectColoredTokens(tokens: ReturnType<typeof highlightCode>) {
  expect(tokens.some((t) => !!t.color)).toBe(true);
}

// ---------------------------------------------------------------------------
// Setup — Shiki needs to load WASM grammars, so give it breathing room
// ---------------------------------------------------------------------------

beforeAll(async () => {
  await ensureHighlighter();
}, 30_000);

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

  it('produces multiple tokens with color information for JavaScript', () => {
    const tokens = highlightCode('const x = 1;', 'javascript');
    expect(tokens.length).toBeGreaterThan(1);
    expectColoredTokens(tokens);
  });

  it('multi-line code produces newline-separated tokens', () => {
    const tokens = highlightCode('const a = 1;\nconst b = 2;', 'javascript');
    // There should be an explicit newline token between the two lines
    expect(tokens.some((t) => t.content === '\n')).toBe(true);
    expect(tokens.length).toBeGreaterThan(2);
  });

  it('every token satisfies the HighlightToken shape', () => {
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
});

// ---------------------------------------------------------------------------
// Language alias resolution
// ---------------------------------------------------------------------------

describe('language alias resolution', () => {
  it('"js" produces colored tokens (resolves to javascript)', () => {
    expectColoredTokens(highlightCode('const x = 1;', 'js'));
  });

  it('"yml" produces colored tokens (resolves to yaml)', () => {
    expectColoredTokens(highlightCode('x: 1', 'yml'));
  });

  it('"py" produces colored tokens (resolves to python)', () => {
    expectColoredTokens(highlightCode('def f(): pass', 'py'));
  });

  it('"sh" produces colored tokens (resolves to bash)', () => {
    expectColoredTokens(highlightCode('echo hi', 'sh'));
  });

  it('"shell" produces colored tokens (resolves to bash)', () => {
    expectColoredTokens(highlightCode('echo hi', 'shell'));
  });

  it('"ts" produces colored tokens (resolves to typescript)', () => {
    expectColoredTokens(highlightCode('const x: number = 1;', 'ts'));
  });
});

// ---------------------------------------------------------------------------
// Dark mode support
// ---------------------------------------------------------------------------

describe('dark mode support', () => {
  it('produces different token colors for isDark=true vs isDark=false', () => {
    const lightTokens = highlightCode('const x = 1;', 'javascript', false);
    const darkTokens = highlightCode('const x = 1;', 'javascript', true);

    // Both sets should have colored tokens
    expectColoredTokens(lightTokens);
    expectColoredTokens(darkTokens);

    // At least one token color should differ between light and dark
    const lightColors = lightTokens.map((t) => t.color);
    const darkColors = darkTokens.map((t) => t.color);
    const hasDifference = lightColors.some((c, i) => c !== darkColors[i]);
    expect(hasDifference).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getTokenColor (backward compat) — deprecated stub, always returns undefined
// ---------------------------------------------------------------------------

describe('getTokenColor (backward compat)', () => {
  it('returns undefined for null type', () => {
    expect(getTokenColor(null)).toBeUndefined();
  });

  it('returns undefined for a known Prism type like "keyword"', () => {
    expect(getTokenColor('keyword')).toBeUndefined();
  });

  it('returns undefined for unknown type', () => {
    expect(getTokenColor('unknownXYZ')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// highlightCodeWithMode (backward compat) — alias for highlightCode
// ---------------------------------------------------------------------------

describe('highlightCodeWithMode (backward compat)', () => {
  it('returns the same result as highlightCode', () => {
    const direct = highlightCode('const x = 1;', 'javascript', false);
    const compat = highlightCodeWithMode('const x = 1;', 'javascript', false);
    expect(compat).toEqual(direct);
  });

  it('tokens have color field populated for known languages', () => {
    const tokens = highlightCodeWithMode('const x = 1;', 'javascript', false);
    expectColoredTokens(tokens);
  });
});

// ---------------------------------------------------------------------------
// isHighlighterReady
// ---------------------------------------------------------------------------

describe('isHighlighterReady', () => {
  it('returns true after ensureHighlighter has been awaited', () => {
    // beforeAll already awaited ensureHighlighter, so this should be true
    expect(isHighlighterReady()).toBe(true);
  });
});
