import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollectionList } from '../../src/components/base/CollectionList';

const mockEntries = [
  {
    slug: 'hello-world',
    title: 'Hello World',
    excerpt: 'My first post about things.',
    date: '2026-01-15',
    tags: ['intro', 'meta'],
  },
  {
    slug: 'second-post',
    title: 'Second Post',
    excerpt: 'Another riveting article.',
    date: '2026-02-10',
    tags: ['advanced'],
  },
];

const defaultProps = {
  label: 'test-list',
  source: 'posts',
  card: { title: 'title', subtitle: 'excerpt', meta: 'date', tags: 'tags' },
  _entries: mockEntries,
};

describe('CollectionList', () => {
  it('renders entry titles', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.getByText('Second Post')).toBeInTheDocument();
  });

  it('renders subtitles when card.subtitle is set', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('My first post about things.')).toBeInTheDocument();
  });

  it('renders meta dates', () => {
    render(<CollectionList {...defaultProps} />);
    // Date formatting is locale-dependent in test environments.
    // Just verify the meta span exists and contains the year.
    const spans = document.querySelectorAll('span');
    const dateSpans = Array.from(spans).filter((s) => s.textContent?.includes('2026'));
    expect(dateSpans.length).toBeGreaterThan(0);
  });

  it('renders tags', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.getByText('intro')).toBeInTheDocument();
    expect(screen.getByText('meta')).toBeInTheDocument();
    expect(screen.getByText('advanced')).toBeInTheDocument();
  });

  it('renders heading when provided', () => {
    render(<CollectionList {...defaultProps} heading={{ text: 'Latest Posts', textSize: 'h4' }} />);
    expect(screen.getByText('Latest Posts')).toBeInTheDocument();
  });

  it('does not render heading when omitted', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.queryByText('Latest Posts')).not.toBeInTheDocument();
  });

  it('renders nothing when _entries is empty', () => {
    const { container } = render(<CollectionList {...defaultProps} _entries={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('respects limit', () => {
    render(<CollectionList {...defaultProps} limit={1} />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(screen.queryByText('Second Post')).not.toBeInTheDocument();
  });

  it('renders links when hrefPrefix is provided', () => {
    render(<CollectionList {...defaultProps} hrefPrefix="/blog/" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/blog/hello-world');
    expect(links[1]).toHaveAttribute('href', '/blog/second-post');
  });

  it('does not render links when hrefPrefix is omitted', () => {
    render(<CollectionList {...defaultProps} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders compact layout', () => {
    render(<CollectionList {...defaultProps} layout="compact" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    // Compact layout doesn't show subtitles
    expect(screen.queryByText('My first post about things.')).not.toBeInTheDocument();
  });

  it('works with minimal card mapping (title only)', () => {
    render(
      <CollectionList
        label="minimal"
        source="posts"
        card={{ title: 'title' }}
        _entries={mockEntries}
      />
    );
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    // No subtitle, meta, or tags rendered
    expect(screen.queryByText('My first post about things.')).not.toBeInTheDocument();
  });
});
