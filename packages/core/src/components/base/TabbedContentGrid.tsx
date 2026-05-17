'use client';

import React, { useState, useRef, useCallback } from 'react';
import { TabbedContent, ContentItem } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';

export function TabbedContentGrid(content: TabbedContent) {
  const theme = useSafeTheme();
  const [value, setValue] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Roving tabindex keyboard handler for the tablist.
   * ArrowRight/Left: cycle through tabs and activate.
   * Home/End: jump to first/last tab.
   * This satisfies WCAG 2.1.1 (Keyboard) and the WAI-ARIA Tabs pattern.
   */
  const handleTabListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabCount = content.tabs.length;
      if (tabCount === 0) return;

      let next: number | null = null;
      switch (e.key) {
        case 'ArrowRight':
          next = (value + 1) % tabCount;
          break;
        case 'ArrowLeft':
          next = (value - 1 + tabCount) % tabCount;
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = tabCount - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      setValue(next);
      tabRefs.current[next]?.focus();
    },
    [value, content.tabs.length]
  );

  return (
    <div
      style={{
        flexGrow: 1,
        width: '100%',
        padding: theme.spacing.xl,
      }}
    >
      <div
        style={{
          width: '100%',
          textAlign: 'center',
          margin: `${theme.spacing.md} 0`,
        }}
      >
        <p
          style={{
            width: '100%',
            textAlign: 'center',
            color: theme.colors.text,
            marginBottom: theme.spacing.xs,
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
            aria-label={content.heading?.text ?? 'Tabs'}
            onKeyDown={handleTabListKeyDown}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              borderBottom: `2px solid ${theme.colors.textSecondary}22`,
              width: '100%',
              overflowX: 'auto',
            }}
          >
            {content.tabs.map((tab: ContentItem, index) => {
              const contentData = tab;
              const isActive = value === index;
              return (
                <button
                  key={index}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  role="tab"
                  id={`tab-${index}`}
                  aria-controls={`tabpanel-${index}`}
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setValue(index)}
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
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
                    padding: theme.spacing.lg,
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
