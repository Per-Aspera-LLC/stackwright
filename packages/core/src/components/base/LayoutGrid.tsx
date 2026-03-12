import React, { useState, useEffect } from 'react';
import { GridContent, ContentItem } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';

const DEFAULT_STACK_BELOW = 768;

/**
 * LayoutGrid — composable multi-column layout content type.
 *
 * Each column contains its own `content_items` array, rendered recursively
 * through the standard content renderer. Nested grids are filtered out
 * to prevent infinite recursion.
 */
export function LayoutGrid({ heading, columns, gap, stackBelow, background }: GridContent) {
  const theme = useSafeTheme();
  const breakpoint = stackBelow ?? DEFAULT_STACK_BELOW;

  // SSR-safe responsive stacking: default to multi-column, hydrate to stacked if narrow
  const [isStacked, setIsStacked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsStacked(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsStacked(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  // Build grid-template-columns from width ratios (default 1 each → equal width)
  const templateColumns = isStacked ? '1fr' : columns.map((col) => `${col.width ?? 1}fr`).join(' ');

  const headingColor = heading?.textColor
    ? resolveColor(heading.textColor, theme.colors)
    : theme.colors.primary;

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: background || 'transparent',
      }}
    >
      {heading?.text && (
        <h3
          style={{
            color: headingColor,
            marginBottom: theme.spacing.xl,
            textAlign: 'center',
          }}
        >
          {heading.text}
        </h3>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: templateColumns,
          gap: gap || theme.spacing.xl,
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {columns.map((column, colIndex) => (
          <div key={colIndex} style={{ minWidth: 0 }}>
            {filterNestedGrids(column.content_items).map(
              (contentItem: ContentItem, itemIndex: number) =>
                renderContent(contentItem, undefined, `grid-${colIndex}-item-${itemIndex}`)
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Filter out nested grid content items to prevent infinite recursion.
 * Grids inside grids are not supported — log a warning and skip them.
 */
function filterNestedGrids(items: ContentItem[]): ContentItem[] {
  return items.filter((item) => {
    if ('grid' in item && item.grid) {
      console.warn(
        '[Stackwright] Nested grids are not supported. Skipping grid inside grid column.'
      );
      return false;
    }
    return true;
  });
}
