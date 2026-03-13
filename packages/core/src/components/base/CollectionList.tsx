import React from 'react';
import type { CollectionListContent, CollectionCardMapping } from '@stackwright/types';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { resolveColor } from '../../utils/colorUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CollectionEntry {
  slug: string;
  [key: string]: unknown;
}

/**
 * Extended props — prebuild injects `_entries` at build time so the
 * component never needs async data fetching.
 */
interface CollectionListProps extends CollectionListContent {
  _entries?: CollectionEntry[];
}

// ---------------------------------------------------------------------------
// Card renderers
// ---------------------------------------------------------------------------

function formatMeta(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  // Attempt ISO date formatting
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    try {
      return new Date(str).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return str;
    }
  }
  return str;
}

function EntryCard({
  entry,
  card,
  href,
  theme,
}: {
  entry: CollectionEntry;
  card: CollectionCardMapping;
  href?: string;
  theme: ReturnType<typeof useSafeTheme>;
}) {
  const title = entry[card.title];
  const subtitle = card.subtitle ? entry[card.subtitle] : undefined;
  const meta = card.meta ? entry[card.meta] : undefined;
  const tags = card.tags ? (entry[card.tags] as string[] | undefined) : undefined;

  const inner = (
    <div
      style={{
        padding: theme.spacing.lg,
        border: `1px solid ${theme.colors.textSecondary}40`,
        borderRadius: '8px',
        backgroundColor: theme.colors.surface,
        transition: 'box-shadow 0.2s, border-color 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.xs,
      }}
    >
      {meta != null && (
        <span style={{ fontSize: '0.85rem', color: theme.colors.textSecondary }}>
          {formatMeta(meta)}
        </span>
      )}
      {title != null && (
        <h3 style={{ margin: 0, fontSize: '1.35rem', color: theme.colors.text }}>
          {String(title)}
        </h3>
      )}
      {subtitle != null && (
        <p
          style={{
            margin: 0,
            color: theme.colors.textSecondary,
            fontSize: '0.95rem',
            lineHeight: 1.5,
            flexGrow: 1,
          }}
        >
          {String(subtitle)}
        </p>
      )}
      {tags && tags.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: `${theme.colors.primary}30`,
                color: theme.colors.text,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {inner}
      </a>
    );
  }
  return inner;
}

function CompactEntry({
  entry,
  card,
  href,
  theme,
}: {
  entry: CollectionEntry;
  card: CollectionCardMapping;
  href?: string;
  theme: ReturnType<typeof useSafeTheme>;
}) {
  const title = entry[card.title];
  const meta = card.meta ? entry[card.meta] : undefined;

  const inner = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: `${theme.spacing.sm} 0`,
        borderBottom: `1px solid ${theme.colors.textSecondary}20`,
      }}
    >
      <span style={{ fontWeight: 500, color: theme.colors.text }}>{String(title ?? '')}</span>
      {meta != null && (
        <span style={{ fontSize: '0.85rem', color: theme.colors.textSecondary }}>
          {formatMeta(meta)}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        {inner}
      </a>
    );
  }
  return inner;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CollectionList({
  heading,
  source: _source,
  layout = 'cards',
  columns,
  limit,
  hrefPrefix,
  card,
  background,
  _entries = [],
}: CollectionListProps) {
  const theme = useSafeTheme();

  const bgColor = background ? resolveColor(background, theme.colors) : 'transparent';

  const headingColor = heading?.textColor
    ? resolveColor(heading.textColor, theme.colors)
    : theme.colors.primary;

  let entries = _entries;
  if (limit && limit > 0) {
    entries = entries.slice(0, limit);
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      style={{
        padding: `${theme.spacing['2xl']} ${theme.spacing.xl}`,
        background: bgColor,
      }}
    >
      {heading?.text && (
        <h3
          style={{
            color: headingColor,
            marginBottom: theme.spacing.xl,
            textAlign: layout === 'compact' ? 'left' : 'center',
          }}
        >
          {heading.text}
        </h3>
      )}

      {layout === 'cards' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: columns
              ? `repeat(${columns}, 1fr)`
              : 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: theme.spacing.lg,
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {entries.map((entry) => (
            <EntryCard
              key={entry.slug}
              entry={entry}
              card={card}
              href={hrefPrefix ? `${hrefPrefix}${entry.slug}` : undefined}
              theme={theme}
            />
          ))}
        </div>
      )}

      {layout === 'list' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.lg,
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {entries.map((entry) => (
            <EntryCard
              key={entry.slug}
              entry={entry}
              card={card}
              href={hrefPrefix ? `${hrefPrefix}${entry.slug}` : undefined}
              theme={theme}
            />
          ))}
        </div>
      )}

      {layout === 'compact' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {entries.map((entry) => (
            <CompactEntry
              key={entry.slug}
              entry={entry}
              card={card}
              href={hrefPrefix ? `${hrefPrefix}${entry.slug}` : undefined}
              theme={theme}
            />
          ))}
        </div>
      )}
    </section>
  );
}
