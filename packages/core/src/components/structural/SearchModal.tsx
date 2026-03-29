/**
 * SearchModal.tsx
 *
 * A Cmd+K triggered search modal that provides fuzzy search across all pages.
 * Uses Fuse.js for client-side fuzzy search with the search index generated
 * during prebuild.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Fuse from 'fuse.js';

// Lazy import for Next.js router (only available in Next.js context)
let useRouter: (() => { push: (path: string) => void }) | null = null;
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  try {
    const nextRouter = require('next/router');
    useRouter = () => nextRouter.useRouter();
  } catch {
    // next/router not available, will use window.location
  }
}

// Type for search index entries - matches build-searchIndex.ts
interface SearchEntry {
  path: string;
  title: string;
  description?: string;
  headings: string[];
  content: string[];
  type: 'page' | 'landing' | 'docs';
}

interface SearchModalProps {
  placeholder?: string;
  shortcut?: string;
}

export function SearchModal({ placeholder = 'Search...', shortcut = 'k' }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [fuse, setFuse] = useState<Fuse<SearchEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  // Get router instance (may be null if not in Next.js context)
  const router = useRouter ? useRouter() : null;

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Navigate to a path using Next.js router if available, otherwise window.location
  const navigateTo = useCallback(
    (path: string) => {
      if (router) {
        router.push(path);
      } else {
        window.location.href = path;
      }
    },
    [router]
  );

  // Debounce search query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Load search index with AbortController for cleanup
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch('/stackwright-content/search-index.json', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Search index not found');
        return res.json();
      })
      .then((data: SearchEntry[]) => {
        const fuseInstance = new Fuse(data, {
          keys: [
            { name: 'title', weight: 2 },
            { name: 'headings', weight: 1.5 },
            { name: 'content', weight: 1 },
            { name: 'description', weight: 0.5 },
          ],
          threshold: 0.3,
          includeMatches: true,
          minMatchCharLength: 2,
        });
        setFuse(fuseInstance);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Search index not available:', err);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcut.toLowerCase()) {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, shortcut]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search when debounced query changes
  useEffect(() => {
    if (!fuse || !debouncedQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults = fuse.search(debouncedQuery).slice(0, 8);
    setResults(searchResults.map((r) => r.item));
    setSelectedIndex(0);
  }, [debouncedQuery, fuse]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigateTo(results[selectedIndex].path);
        setIsOpen(false);
      }
    },
    [results, selectedIndex, navigateTo]
  );

  // Scroll selected into view
  useEffect(() => {
    if (resultsRef.current && resultsRef.current.children[selectedIndex]) {
      const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const isMac = useMemo(
    () => typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent),
    []
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={() => setIsOpen(false)}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 560,
          margin: '0 16px',
          backgroundColor: 'var(--sw-background, #fff)',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--sw-border, #e5e7eb)',
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            style={{ marginRight: 12, color: 'var(--sw-text-secondary, #6b7280)', flexShrink: 0 }}
          >
            <circle cx={11} cy={11} r={8} />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            aria-label="Search documentation"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              backgroundColor: 'transparent',
              color: 'var(--sw-text, #111827)',
            }}
          />

          <kbd
            style={{
              padding: '4px 8px',
              fontSize: 12,
              fontFamily: 'monospace',
              backgroundColor: 'var(--sw-surface, #f3f4f6)',
              borderRadius: 4,
              color: 'var(--sw-text-secondary, #6b7280)',
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results - Accessible listbox */}
        <div
          ref={resultsRef}
          role="listbox"
          aria-label="Search results"
          aria-activedescendant={
            results[selectedIndex] ? `search-result-${selectedIndex}` : undefined
          }
          style={{
            maxHeight: 400,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {loading && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--sw-text-secondary, #6b7280)',
              }}
            >
              Loading search index...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--sw-text-secondary, #6b7280)',
              }}
            >
              No results found for "{query}"
            </div>
          )}

          {!loading && !query && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--sw-text-secondary, #6b7280)',
              }}
            >
              Type to search...
            </div>
          )}

          {results.map((result, index) => (
            <a
              key={result.path}
              id={`search-result-${index}`}
              href={result.path}
              role="option"
              aria-selected={index === selectedIndex}
              tabIndex={-1}
              style={{
                display: 'block',
                padding: '12px 16px',
                borderRadius: 8,
                textDecoration: 'none',
                backgroundColor:
                  index === selectedIndex ? 'var(--sw-surface, #f3f4f6)' : 'transparent',
                color: 'var(--sw-text, #111827)',
                cursor: 'pointer',
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(result.path);
                setIsOpen(false);
              }}
            >
              <div
                style={{
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                {result.title}
              </div>

              {result.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--sw-text-secondary, #6b7280)',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.description}
                </div>
              )}

              <div
                style={{
                  fontSize: 12,
                  color: 'var(--sw-text-tertiary, #9ca3af)',
                  fontFamily: 'monospace',
                }}
              >
                {result.path}
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--sw-border, #e5e7eb)',
            display: 'flex',
            gap: 16,
            fontSize: 12,
            color: 'var(--sw-text-tertiary, #9ca3af)',
          }}
        >
          <span>
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--sw-surface, #f3f4f6)',
                borderRadius: 4,
                marginRight: 4,
              }}
            >
              ↑↓
            </kbd>
            navigate
          </span>
          <span>
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--sw-surface, #f3f4f6)',
                borderRadius: 4,
                marginRight: 4,
              }}
            >
              ↵
            </kbd>
            select
          </span>
          <span>
            <kbd
              style={{
                padding: '2px 6px',
                backgroundColor: 'var(--sw-surface, #f3f4f6)',
                borderRadius: 4,
                marginRight: 4,
              }}
            >
              esc
            </kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
