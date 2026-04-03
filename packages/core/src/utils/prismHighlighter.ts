import Prism from 'prismjs';

// Load language grammars
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup'; // HTML/XML
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

// Map common language aliases to Prism grammar keys
const LANGUAGE_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  yml: 'yaml',
  html: 'markup',
  xml: 'markup',
  sh: 'bash',
  shell: 'bash',
};

/**
 * Inline color palette for syntax tokens.
 * Designed for the light (#f4f4f5) code block background.
 */
const TOKEN_COLORS: Record<string, string> = {
  comment: '#6a737d',
  prolog: '#6a737d',
  doctype: '#6a737d',
  cdata: '#6a737d',
  punctuation: '#24292e',
  property: '#005cc5',
  tag: '#22863a',
  boolean: '#005cc5',
  number: '#005cc5',
  constant: '#005cc5',
  symbol: '#005cc5',
  selector: '#6f42c1',
  'attr-name': '#6f42c1',
  string: '#032f62',
  char: '#032f62',
  'template-string': '#032f62',
  builtin: '#6f42c1',
  inserted: '#22863a',
  operator: '#d73a49',
  entity: '#005cc5',
  url: '#032f62',
  keyword: '#d73a49',
  'attr-value': '#032f62',
  function: '#6f42c1',
  'class-name': '#6f42c1',
  regex: '#032f62',
  important: '#d73a49',
  variable: '#e36209',
  deleted: '#d73a49',
  atrule: '#d73a49',
};

/**
 * Dark mode color palette for syntax tokens.
 * GitHub Dark-inspired colors for dark (#0d1117) code block background.
 */
const DARK_TOKEN_COLORS: Record<string, string> = {
  comment: '#8b949e',
  prolog: '#8b949e',
  doctype: '#8b949e',
  cdata: '#8b949e',
  punctuation: '#c9d1d9',
  property: '#79c0ff',
  tag: '#7ee787',
  boolean: '#79c0ff',
  number: '#79c0ff',
  constant: '#79c0ff',
  symbol: '#79c0ff',
  selector: '#d2a8ff',
  'attr-name': '#d2a8ff',
  string: '#a5d6ff',
  char: '#a5d6ff',
  'template-string': '#a5d6ff',
  builtin: '#d2a8ff',
  inserted: '#7ee787',
  operator: '#ff7b72',
  entity: '#79c0ff',
  url: '#a5d6ff',
  keyword: '#ff7b72',
  'attr-value': '#a5d6ff',
  function: '#d2a8ff',
  'class-name': '#d2a8ff',
  regex: '#a5d6ff',
  important: '#ff7b72',
  variable: '#ffa657',
  deleted: '#ff7b72',
  atrule: '#ff7b72',
};

/** A flattened token with type and text, ready for rendering. */
export interface HighlightToken {
  type: string | null; // null = plain text
  content: string;
  color?: string; // resolved color when using highlightCodeWithMode
}

/**
 * Resolve a language string to a Prism grammar key.
 * Returns undefined if the language is not supported.
 */
function resolveLanguage(language: string): string | undefined {
  const lower = language.toLowerCase();
  const resolved = LANGUAGE_ALIASES[lower] ?? lower;
  return Prism.languages[resolved] ? resolved : undefined;
}

/**
 * Flatten Prism's nested token tree into a flat list of HighlightTokens.
 */
function flattenTokens(tokens: (string | Prism.Token)[], parentType?: string): HighlightToken[] {
  const result: HighlightToken[] = [];
  for (const token of tokens) {
    if (typeof token === 'string') {
      result.push({ type: parentType ?? null, content: token });
    } else {
      const type = token.type;
      if (Array.isArray(token.content)) {
        result.push(...flattenTokens(token.content as (string | Prism.Token)[], type));
      } else if (typeof token.content === 'string') {
        result.push({ type, content: token.content });
      } else {
        // Single nested token
        result.push(...flattenTokens([token.content as Prism.Token], type));
      }
    }
  }
  return result;
}

/**
 * Tokenize code with Prism and return flat highlight tokens.
 * Returns plain-text tokens if the language is unsupported.
 */
export function highlightCode(code: string, language?: string): HighlightToken[] {
  if (!language) {
    return [{ type: null, content: code }];
  }

  const resolvedLang = resolveLanguage(language);
  if (!resolvedLang) {
    return [{ type: null, content: code }];
  }

  const grammar = Prism.languages[resolvedLang];
  const tokens = Prism.tokenize(code, grammar);
  return flattenTokens(tokens);
}

/**
 * Get the inline color for a token type.
 * @param type - The token type from Prism
 * @param isDark - Whether to use dark mode colors (default: false)
 */
export function getTokenColor(type: string | null, isDark: boolean = false): string | undefined {
  if (!type) return undefined;
  const colors = isDark ? DARK_TOKEN_COLORS : TOKEN_COLORS;
  return colors[type];
}

/**
 * Tokenize code with Prism and return tokens with colors already resolved.
 * @param code - The source code to highlight
 * @param language - The language identifier
 * @param isDark - Whether to use dark mode colors (default: false)
 */
export function highlightCodeWithMode(
  code: string,
  language?: string,
  isDark: boolean = false
): HighlightToken[] {
  const tokens = highlightCode(code, language);
  return tokens.map((token) => ({
    ...token,
    color: getTokenColor(token.type, isDark),
  }));
}
