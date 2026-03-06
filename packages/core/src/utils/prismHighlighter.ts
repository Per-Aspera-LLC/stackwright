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

/** A flattened token with type and text, ready for rendering. */
export interface HighlightToken {
    type: string | null; // null = plain text
    content: string;
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
function flattenTokens(
    tokens: (string | Prism.Token)[],
    parentType?: string,
): HighlightToken[] {
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
                result.push(
                    ...flattenTokens([token.content as Prism.Token], type),
                );
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
 */
export function getTokenColor(type: string | null): string | undefined {
    if (!type) return undefined;
    return TOKEN_COLORS[type];
}
