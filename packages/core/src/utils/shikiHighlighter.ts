import {
  createHighlighterCore,
  createJavaScriptRegexEngine,
  bundledLanguages,
  bundledThemes,
} from 'shiki';
import type { HighlighterCore, ThemedToken } from 'shiki';

// Debug logging utility — only logs when STACKWRIGHT_DEBUG is enabled in development
const debugLog = (message: string, data?: unknown) => {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`[shiki] ${message}`, data ?? '');
  }
};

// ---------------------------------------------------------------------------
// Public interface — same shape as the old Prism-based highlighter
// ---------------------------------------------------------------------------

/** A flattened token with type and text, ready for rendering. */
export interface HighlightToken {
  type: string | null; // null = plain text
  content: string;
  color?: string; // resolved inline by Shiki's theme
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Languages pre-loaded at startup (matching the previous Prism set). */
const PRELOAD_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'yaml',
  'css',
  'html',
  'xml',
  'json',
  'bash',
  'jsx',
  'tsx',
] as const;

/** Map common shorthand aliases to Shiki grammar names. */
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  yml: 'yaml',
  html: 'html',
  xml: 'xml',
  sh: 'bash',
  shell: 'bash',
};

const LIGHT_THEME = 'github-light';
const DARK_THEME = 'github-dark';

// ---------------------------------------------------------------------------
// Singleton highlighter
// ---------------------------------------------------------------------------

let highlighter: HighlighterCore | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the Shiki highlighter singleton.
 * Safe to call multiple times — subsequent calls return the same promise.
 */
export async function ensureHighlighter(): Promise<void> {
  if (highlighter) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    debugLog('Initializing…');

    const engine = createJavaScriptRegexEngine();

    // Resolve theme registrations in parallel
    const [lightTheme, darkTheme] = await Promise.all([
      bundledThemes[LIGHT_THEME]().then((m) => m.default),
      bundledThemes[DARK_THEME]().then((m) => m.default),
    ]);

    // Resolve language registrations in parallel
    // Each loader returns { default: LanguageRegistration[] }, so we flatten.
    const langArrays = await Promise.all(
      PRELOAD_LANGUAGES.map((lang) => bundledLanguages[lang]().then((m) => m.default))
    );

    highlighter = await createHighlighterCore({
      engine,
      themes: [lightTheme, darkTheme],
      langs: langArrays.flat(),
    });

    debugLog('Ready', {
      themes: [LIGHT_THEME, DARK_THEME],
      languages: highlighter.getLoadedLanguages(),
    });
  })();

  return initPromise;
}

/** Check whether the highlighter has completed initialization. */
export function isHighlighterReady(): boolean {
  return highlighter !== null;
}

// Kick off loading immediately at module scope so the highlighter is
// (hopefully) warm by the time the first `highlightCode` call arrives.
const _preload = ensureHighlighter();
// Silence "unused variable" lint — the side-effect is the point.
void _preload;

// ---------------------------------------------------------------------------
// Language resolution
// ---------------------------------------------------------------------------

function resolveLanguage(language: string): string {
  const lower = language.toLowerCase();
  return LANGUAGE_ALIASES[lower] ?? lower;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Tokenize source code with Shiki and return a flat list of
 * `HighlightToken`s with inline colors resolved from the active theme.
 *
 * Falls back to a single plain-text token when:
 * - no language is provided
 * - the highlighter hasn't finished loading yet
 * - the requested language isn't loaded
 * - Shiki throws for any reason
 */
export function highlightCode(
  code: string,
  language?: string,
  isDark: boolean = false
): HighlightToken[] {
  // Fast path — nothing to highlight
  if (!language || !highlighter) {
    return [{ type: null, content: code }];
  }

  const resolved = resolveLanguage(language);

  if (!highlighter.getLoadedLanguages().includes(resolved)) {
    debugLog(`Language not loaded: "${resolved}"`, { original: language });
    return [{ type: null, content: code }];
  }

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  try {
    const lines: ThemedToken[][] = highlighter.codeToTokensBase(code, {
      lang: resolved,
      theme,
    });

    // Flatten Shiki's 2-D (lines × tokens) structure into a 1-D array,
    // inserting explicit newline tokens between lines.
    const result: HighlightToken[] = [];

    for (let i = 0; i < lines.length; i++) {
      if (i > 0) {
        result.push({ type: null, content: '\n' });
      }
      for (const token of lines[i]) {
        result.push({
          type: null,
          content: token.content,
          color: token.color,
        });
      }
    }

    return result;
  } catch (err) {
    debugLog('codeToTokensBase failed — returning plain text', err);
    return [{ type: null, content: code }];
  }
}

// ---------------------------------------------------------------------------
// Backward-compat exports
// ---------------------------------------------------------------------------

/**
 * @deprecated Shiki embeds colors directly on each token via the `color`
 * field.  This stub is kept only so existing call-sites don't break at
 * import time — it always returns `undefined`.
 */
export function getTokenColor(_type: string | null, _isDark: boolean = false): string | undefined {
  return undefined;
}

/**
 * Alias for {@link highlightCode}.
 * Retained for backward compatibility with call-sites that used the
 * Prism-era `highlightCodeWithMode` name.
 */
export function highlightCodeWithMode(
  code: string,
  language?: string,
  isDark: boolean = false
): HighlightToken[] {
  return highlightCode(code, language, isDark);
}
