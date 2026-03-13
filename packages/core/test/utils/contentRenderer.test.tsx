import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderContent } from '../../src/utils/contentRenderer';
import { registerComponent } from '../../src/utils/componentRegistry';
import { stackwrightRegistry } from '../../src/utils/stackwrightComponentRegistry';
import { ComponentType } from 'react';

// ---------------------------------------------------------------------------
// Stub components
// ---------------------------------------------------------------------------

const TestMain = ({ heading }: { heading?: { text: string } }) => (
  <div data-testid="test-main">{heading?.text ?? 'no heading'}</div>
);

const TestCarousel = ({ heading }: { heading?: string }) => (
  <div data-testid="test-carousel">{heading ?? 'carousel'}</div>
);

// Helper: wrap renderContent output in a React fragment and render it
function renderOutput(content: any) {
  const result = renderContent(content);
  if (result === null) return render(<></>);
  if (Array.isArray(result)) return render(<>{result}</>);
  return render(<>{result}</>);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  stackwrightRegistry.clear();
  // Override 'main' with our test stub for deterministic rendering
  registerComponent('main', TestMain as ComponentType<any>);
  registerComponent('carousel', TestCarousel as ComponentType<any>);
});

// ---------------------------------------------------------------------------
// Null / empty inputs
// ---------------------------------------------------------------------------

describe('renderContent — null / empty', () => {
  it('returns null for null input', () => {
    expect(renderContent(null as any)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(renderContent(undefined as any)).toBeNull();
  });

  it('returns null for a ContentItem missing the type field and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = renderContent({} as any);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing required "type" field'));
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// Single ContentItem
// ---------------------------------------------------------------------------

describe('renderContent — single ContentItem', () => {
  it('renders a known content type (main)', () => {
    const item = { type: 'main', heading: { text: 'Hello World' } };
    renderOutput(item);
    expect(screen.getByTestId('test-main')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('renders a second known content type (carousel)', () => {
    const item = { type: 'carousel', heading: 'My Carousel', label: 'c1', items: [] };
    renderOutput(item);
    expect(screen.getByTestId('test-carousel')).toBeInTheDocument();
  });

  it('renders an UnknownContentType warning for an unknown content type', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const item = { type: '__unknown_type__', label: 'x' };
    renderOutput(item);
    expect(screen.getByText(/Unknown content type/)).toBeInTheDocument();
    expect(screen.getByText(/"__unknown_type__"/)).toBeInTheDocument();
    warnSpy.mockRestore();
  });

  it('logs console.warn for unknown content types', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const item = { type: '__unknown_type__', label: 'x' };
    renderOutput(item);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown content type: "__unknown_type__"')
    );
    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// PageContent (full page structure)
// ---------------------------------------------------------------------------

describe('renderContent — PageContent', () => {
  it('renders content_items from a PageContent object', () => {
    const pageContent = {
      content: {
        content_items: [{ type: 'main', heading: { text: 'Page Heading' } }],
      },
    };
    renderOutput(pageContent);
    expect(screen.getByTestId('test-main')).toBeInTheDocument();
    expect(screen.getByText('Page Heading')).toBeInTheDocument();
  });

  it('renders multiple content items in order', () => {
    const pageContent = {
      content: {
        content_items: [
          { type: 'main', heading: { text: 'First' } },
          { type: 'carousel', heading: 'Second', label: 'c2', items: [] },
        ],
      },
    };
    renderOutput(pageContent);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByTestId('test-carousel')).toBeInTheDocument();
  });

  it('handles empty content_items gracefully', () => {
    const pageContent = {
      content: {
        content_items: [],
      },
    };
    const result = renderContent(pageContent);
    // Returns an array (possibly empty of content items), not null
    expect(Array.isArray(result)).toBe(true);
  });

  it('renders warning for unknown types and continues rendering known types', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pageContent = {
      content: {
        content_items: [
          { type: '__totally_unknown__', label: 'x' },
          { type: 'main', heading: { text: 'Still Renders' } },
        ],
      },
    };
    renderOutput(pageContent);
    expect(screen.getByText(/Unknown content type/)).toBeInTheDocument();
    expect(screen.getByText('Still Renders')).toBeInTheDocument();
    warnSpy.mockRestore();
  });
});
