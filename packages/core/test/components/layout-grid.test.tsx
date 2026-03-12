import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { LayoutGrid } from '../../src/components/base/LayoutGrid';
import { registerComponent, componentRegistry } from '../../src/utils/componentRegistry';
import { renderContent } from '../../src/utils/contentRenderer';

// Simple stub component for testing nested content rendering
function StubMain({ heading }: { heading?: { text: string } }) {
  return <div data-testid="stub-main">{heading?.text}</div>;
}

function StubCodeBlock({ code }: { code: string }) {
  return <pre data-testid="stub-code">{code}</pre>;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let originalMain: any;
let originalCodeBlock: any;

beforeEach(() => {
  // Swap in stubs so we test LayoutGrid in isolation without pulling in real components
  originalMain = componentRegistry['main'];
  originalCodeBlock = componentRegistry['code_block'];
  componentRegistry['main'] = StubMain;
  componentRegistry['code_block'] = StubCodeBlock;
});

afterEach(() => {
  componentRegistry['main'] = originalMain;
  componentRegistry['code_block'] = originalCodeBlock;
});

// ---------------------------------------------------------------------------
// LayoutGrid
// ---------------------------------------------------------------------------

describe('LayoutGrid', () => {
  it('renders a two-column layout with content in each column', () => {
    render(
      <LayoutGrid
        label="two-col"
        columns={[
          {
            content_items: [
              { main: { label: 'Left', heading: { text: 'Left Heading', textSize: 'h2' }, textBlocks: [] } },
            ],
          },
          {
            content_items: [
              { code_block: { label: 'Right', code: 'console.log("hi")' } },
            ],
          },
        ]}
      />
    );
    expect(screen.getByText('Left Heading')).toBeInTheDocument();
    expect(screen.getByText('console.log("hi")')).toBeInTheDocument();
  });

  it('renders a three-column layout with width ratios', () => {
    const { container } = render(
      <LayoutGrid
        label="three-col"
        columns={[
          { width: 2, content_items: [{ main: { label: 'Wide', heading: { text: 'Wide Col', textSize: 'h2' }, textBlocks: [] } }] },
          { width: 1, content_items: [{ main: { label: 'Narrow1', heading: { text: 'Col 2', textSize: 'h2' }, textBlocks: [] } }] },
          { width: 1, content_items: [{ main: { label: 'Narrow2', heading: { text: 'Col 3', textSize: 'h2' }, textBlocks: [] } }] },
        ]}
      />
    );

    // Find the grid container (has display: grid)
    const gridDiv = container.querySelector('div[style*="grid"]') as HTMLElement;
    expect(gridDiv).toBeTruthy();
    expect(gridDiv.style.gridTemplateColumns).toBe('2fr 1fr 1fr');
  });

  it('defaults to equal widths when width is omitted', () => {
    const { container } = render(
      <LayoutGrid
        label="equal"
        columns={[
          { content_items: [{ main: { label: 'A', heading: { text: 'A', textSize: 'h2' }, textBlocks: [] } }] },
          { content_items: [{ main: { label: 'B', heading: { text: 'B', textSize: 'h2' }, textBlocks: [] } }] },
        ]}
      />
    );

    const gridDiv = container.querySelector('div[style*="grid"]') as HTMLElement;
    expect(gridDiv.style.gridTemplateColumns).toBe('1fr 1fr');
  });

  it('renders heading when provided', () => {
    render(
      <LayoutGrid
        label="with-heading"
        heading={{ text: 'Section Title', textSize: 'h3' }}
        columns={[
          { content_items: [{ main: { label: 'A', heading: { text: 'A', textSize: 'h2' }, textBlocks: [] } }] },
        ]}
      />
    );
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('renders without heading', () => {
    const { container } = render(
      <LayoutGrid
        label="no-heading"
        columns={[
          { content_items: [{ main: { label: 'A', heading: { text: 'Content', textSize: 'h2' }, textBlocks: [] } }] },
        ]}
      />
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(container.querySelector('h3')).toBeNull();
  });

  it('filters nested grid items and logs a warning', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <LayoutGrid
        label="nested-guard"
        columns={[
          {
            content_items: [
              { main: { label: 'OK', heading: { text: 'Allowed', textSize: 'h2' }, textBlocks: [] } },
              { grid: { label: 'Bad', columns: [{ content_items: [] }] } } as any,
            ],
          },
        ]}
      />
    );

    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Nested grids are not supported')
    );

    warnSpy.mockRestore();
  });

  it('handles empty columns without crashing', () => {
    const { container } = render(
      <LayoutGrid
        label="empty"
        columns={[{ content_items: [] }, { content_items: [] }]}
      />
    );
    expect(container.querySelector('section')).toBeTruthy();
  });

  it('renders single column gracefully', () => {
    render(
      <LayoutGrid
        label="single"
        columns={[
          { content_items: [{ main: { label: 'Solo', heading: { text: 'Solo Content', textSize: 'h2' }, textBlocks: [] } }] },
        ]}
      />
    );
    expect(screen.getByText('Solo Content')).toBeInTheDocument();
  });

  it('applies background color', () => {
    const { container } = render(
      <LayoutGrid
        label="bg"
        background="#f0f0f0"
        columns={[{ content_items: [] }]}
      />
    );
    const section = container.querySelector('section') as HTMLElement;
    // JSDOM normalizes hex to rgb()
    expect(section.style.background).toBe('rgb(240, 240, 240)');
  });

  it('applies custom gap', () => {
    const { container } = render(
      <LayoutGrid
        label="gap"
        gap="3rem"
        columns={[{ content_items: [] }, { content_items: [] }]}
      />
    );
    const gridDiv = container.querySelector('div[style*="grid"]') as HTMLElement;
    expect(gridDiv.style.gap).toBe('3rem');
  });

  it('renders multiple content items per column', () => {
    render(
      <LayoutGrid
        label="multi"
        columns={[
          {
            content_items: [
              { main: { label: 'First', heading: { text: 'First Item', textSize: 'h2' }, textBlocks: [] } },
              { code_block: { label: 'Second', code: 'x = 1' } },
            ],
          },
        ]}
      />
    );
    expect(screen.getByText('First Item')).toBeInTheDocument();
    expect(screen.getByText('x = 1')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Integration: LayoutGrid via contentRenderer pipeline
// ---------------------------------------------------------------------------

describe('LayoutGrid via contentRenderer', () => {
  it('renders grid content type through the content pipeline', () => {
    // Register our grid component is already done via componentRegistry import
    const contentItem = {
      grid: {
        label: 'pipeline-test',
        columns: [
          {
            content_items: [
              { main: { label: 'Pipeline', heading: { text: 'From Pipeline', textSize: 'h2' }, textBlocks: [] } },
            ],
          },
          {
            content_items: [
              { code_block: { label: 'Code', code: 'hello()' } },
            ],
          },
        ],
      },
    };

    const { container } = render(<>{renderContent(contentItem)}</>);
    expect(screen.getByText('From Pipeline')).toBeInTheDocument();
    expect(screen.getByText('hello()')).toBeInTheDocument();
  });
});
