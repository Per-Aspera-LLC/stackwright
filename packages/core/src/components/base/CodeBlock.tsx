import React, { useState, useEffect } from 'react';
import { CodeBlockContent } from '@stackwright/types';
import { useSafeTheme, useSafeColorMode } from '../../hooks/useSafeTheme';
import { resolveBackground } from '../../utils/resolveBackground';
import { ensureHighlighter, highlightCode, isHighlighterReady } from '../../utils/shikiHighlighter';
import type { HighlightToken } from '../../utils/shikiHighlighter';

/**
 * Split a flat token list into per-line groups so each line can be
 * rendered independently (required for line-number alignment).
 */
function splitTokensByLine(tokens: HighlightToken[]): HighlightToken[][] {
  const lines: HighlightToken[][] = [[]];
  for (const token of tokens) {
    const parts = token.content.split('\n');
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) lines.push([]);
      if (parts[p].length > 0) {
        lines[lines.length - 1].push({ type: token.type, content: parts[p], color: token.color });
      }
    }
  }
  return lines;
}

export function CodeBlock({ code, language, lineNumbers = false, background }: CodeBlockContent) {
  const theme = useSafeTheme();
  const resolvedColorMode = useSafeColorMode();
  const isDark = resolvedColorMode === 'dark';

  const [ready, setReady] = useState(isHighlighterReady());
  useEffect(() => {
    if (!ready) {
      ensureHighlighter().then(() => setReady(true));
    }
  }, [ready]);

  const tokens = highlightCode(code.trimEnd(), language, isDark);
  const tokenLines = splitTokensByLine(tokens);

  return (
    <div
      style={{
        margin: `0 ${theme.spacing.xl}`,
        padding: `${theme.spacing.md} 0`,
        background: resolveBackground(background, theme, resolvedColorMode === 'dark'),
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '4px',
          overflow: 'hidden',
          maxWidth: '100%',
          border: `1px solid ${theme.colors.textSecondary}22`,
        }}
      >
        {language && (
          <div
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.md}`,
              borderBottom: `1px solid ${theme.colors.textSecondary}22`,
            }}
          >
            <span
              style={{
                fontSize: '0.75rem',
                color: theme.colors.textSecondary,
                fontFamily: 'monospace',
              }}
            >
              {language}
            </span>
          </div>
        )}
        <pre
          style={{
            margin: 0,
            padding: theme.spacing.md,
            overflowX: 'auto',
            overflowY: 'hidden',
            maxWidth: '100%',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: theme.colors.text,
            whiteSpace: 'pre',
            fontVariantLigatures: 'none',
          }}
        >
          {tokenLines.map((lineTokens, i) => (
            <span key={i} style={{ display: 'block' }}>
              {lineNumbers && (
                <span
                  style={{
                    userSelect: 'none',
                    minWidth: '2ch',
                    textAlign: 'right',
                    color: theme.colors.textSecondary,
                    display: 'inline-block',
                    marginRight: theme.spacing.md,
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span>
                {lineTokens.length > 0
                  ? lineTokens.map((t, j) =>
                      t.color ? (
                        <span key={j} style={{ color: t.color }}>
                          {t.content}
                        </span>
                      ) : (
                        <span key={j}>{t.content}</span>
                      )
                    )
                  : ' '}
              </span>
              {'\n'}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}
