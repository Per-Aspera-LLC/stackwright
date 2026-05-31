import React from 'react';
import { micromark } from 'micromark';
import { TextBlock } from '@stackwright/types';
import { v4 as uuidv4 } from 'uuid';
import { useSafeTheme } from '../../hooks/useSafeTheme';

const BULLET_CHARACTER = '-';
const LIST_CHARACTER = '#';

interface TextGridProps {
  content: TextBlock[];
  config?: {
    list_icon?: string;
  };
}

/**
 * Renders a TextBlock using CommonMark via micromark.
 * micromark does NOT pass through raw HTML by default (allowDangerousHtml: false),
 * so the output is XSS-safe by construction — no sanitization library needed.
 */
function renderMarkdown(text: string, color?: string): React.ReactNode {
  const html = micromark(text);
  return <div style={{ color: color ?? 'inherit' }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Renders a string with inline markdown: **bold**, *italic*, `code`.
 * Returns an array of React nodes safe to embed in JSX.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  // Pattern captures: **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function TextGrid({ content, config }: TextGridProps) {
  const theme = useSafeTheme();
  const listIcon = config?.list_icon || '•';

  const startsWithBullet = (text: string) => {
    return text.trimStart().startsWith(BULLET_CHARACTER);
  };

  const startsWithListNumber = (text: string) => {
    return text.trimStart().startsWith(LIST_CHARACTER);
  };

  const renderText = (textBlock: TextBlock) => {
    if (startsWithBullet(textBlock.text) || startsWithListNumber(textBlock.text)) {
      return textBlock.text.replace(BULLET_CHARACTER, '').replace(LIST_CHARACTER, '').trim();
    }
    switch (textBlock.text) {
      case '%DIVIDER%':
        return (
          <hr
            style={{
              border: 'none',
              borderTop: `1px solid ${textBlock.textColor || theme.colors.textSecondary}`,
              width: '100%',
            }}
          />
        );
      case '%SPACER%':
        return <div style={{ height: 16 }} />;
      default:
        return (
          <p
            style={{
              margin: 0,
              color: textBlock.textColor || theme.colors.text,
            }}
          >
            {renderInlineMarkdown(textBlock.text)}
          </p>
        );
    }
  };

  let listNumber = 1;

  return (
    <>
      {content.map((textItem) => {
        // Markdown mode: pass the entire text to micromark, skip line-splitting and special chars
        if (textItem.format === 'markdown') {
          return (
            <div key={uuidv4()}>
              {renderMarkdown(textItem.text, textItem.textColor ?? theme.colors.text)}
            </div>
          );
        }

        // Plain mode (default): existing line-splitting + bullet/list/special char logic
        return (
          <div key={uuidv4()}>
            {textItem.text
              .split('\n')
              .filter((line) => line.trim() !== '')
              .map((line) => {
                const lineBlock: TextBlock = {
                  ...textItem,
                  text: line,
                };
                return (
                  <div
                    key={uuidv4()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    {startsWithBullet(line) && listIcon && (
                      <span
                        style={{
                          color: theme.colors.primary,
                        }}
                      >
                        {listIcon}
                      </span>
                    )}

                    {startsWithListNumber(line) && (
                      <span
                        style={{
                          color: theme.colors.primary,
                        }}
                      >
                        {listNumber++}.
                      </span>
                    )}

                    {renderText(lineBlock)}
                  </div>
                );
              })}
          </div>
        );
      })}
    </>
  );
}
