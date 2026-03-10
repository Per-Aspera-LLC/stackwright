'use client';

import React, { useState } from 'react';
import { TabbedContent, ContentItem } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';

export function TabbedContentGrid(content: TabbedContent) {
  const theme = useSafeTheme();
  const [value, setValue] = useState(0);

  return (
    <div
      style={{
        flexGrow: 1,
        width: '100%',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          margin: '16px 0',
        }}
      >
        <p
          style={{
            width: '100%',
            textAlign: 'center',
            color: theme.colors.text,
            marginBottom: '8px',
          }}
        >
          {content.heading.text}
        </p>

        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            role="tablist"
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '4px',
              borderBottom: `2px solid ${theme.colors.textSecondary}22`,
              width: '100%',
              overflowX: 'auto',
            }}
          >
            {content.tabs.map((tab: ContentItem, index) => {
              const contentData = Object.values(tab)[0];
              const isActive = value === index;
              return (
                <button
                  key={index}
                  role="tab"
                  id={`tab-${index}`}
                  aria-controls={`tabpanel-${index}`}
                  aria-selected={isActive}
                  onClick={() => setValue(index)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderBottom: isActive
                      ? `2px solid ${theme.colors.primary}`
                      : '2px solid transparent',
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                    marginBottom: '-2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {contentData?.label ?? `Tab ${index + 1}`}
                </button>
              );
            })}
          </div>
          {content.tabs.map((tab: ContentItem, index) => (
            <div
              key={index}
              role="tabpanel"
              hidden={value !== index}
              id={`tabpanel-${index}`}
              aria-labelledby={`tab-${index}`}
              style={{ width: '100%' }}
            >
              {value === index && (
                <div
                  style={{
                    padding: '24px',
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  {renderContent(tab)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
