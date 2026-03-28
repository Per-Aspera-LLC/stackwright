import React from 'react';
import { CodeBlockContent } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveBackground } from '../../utils/resolveBackground';
import { highlightCode, getTokenColor, HighlightToken } from '../../utils/prismHighlighter';

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
        lines[lines.length - 1].push({ type: token.type, content: parts[p] });
      }
    }
  }
  return lines;
}

export function CodeBlock({ code, language, lineNumbers = false, background }: CodeBlockContent) {
  const theme = useSafeTheme();

  const tokens = highlightCode(code.trimEnd(), language);
  const tokenLines = splitTokensByLine(tokens);

  return (
    <div
      style={{
        margin: `0 ${theme.spacing.xl}`,
        padding: `${theme.spacing.md} 0`,
        background: resolveBackground(background, theme),
      }}
    >
      <div
        style={{
          backgroundColor: '#f4f4f5',
          borderRadius: '4px',
          overflow: 'auto',
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
            overflow: 'auto',
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: theme.colors.text,
          }}
        >
          {tokenLines.map((lineTokens, i) => (
            <span key={i} style={{ display: 'flex', gap: theme.spacing.md }}>
              {lineNumbers && (
                <span
                  style={{
                    userSelect: 'none',
                    minWidth: '2ch',
                    textAlign: 'right',
                    color: theme.colors.textSecondary,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
              )}
              <span>
                {lineTokens.length > 0
                  ? lineTokens.map((t, j) => {
                      const color = getTokenColor(t.type);
                      return color ? (
                        <span key={j} style={{ color }}>
                          {t.content}
                        </span>
                      ) : (
                        <span key={j}>{t.content}</span>
                      );
                    })
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
