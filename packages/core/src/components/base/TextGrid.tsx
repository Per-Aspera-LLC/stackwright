import React from 'react';
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
            {textBlock.text}
          </p>
        );
    }
  };

  let listNumber = 1;

  return (
    <>
      {content.map((textItem) => (
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
                    gap: '16px',
                    marginBottom: '8px',
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
      ))}
    </>
  );
}
