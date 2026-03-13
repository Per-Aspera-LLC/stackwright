import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Mock next/document components — render as semantic divs for testing
vi.mock('next/document', () => ({
  Html: ({ children, ...props }: any) => (
    <div data-testid="html" {...props}>
      {children}
    </div>
  ),
  Head: ({ children }: any) => <div data-testid="head">{children}</div>,
  Main: () => <div data-testid="main" />,
  NextScript: () => <div data-testid="next-script" />,
}));

// Mock @stackwright/themes ColorModeScript
vi.mock('@stackwright/themes', () => ({
  ColorModeScript: () => <script data-testid="color-mode-script" />,
}));

// Import after mocks
import { StackwrightDocument } from '../src/components/StackwrightDocument';

describe('StackwrightDocument', () => {
  it('renders the full document structure', () => {
    const html = renderToStaticMarkup(<StackwrightDocument />);
    expect(html).toContain('data-testid="html"');
    expect(html).toContain('data-testid="head"');
    expect(html).toContain('data-testid="main"');
    expect(html).toContain('data-testid="next-script"');
  });

  it('includes ColorModeScript in head', () => {
    const html = renderToStaticMarkup(<StackwrightDocument />);
    expect(html).toContain('data-testid="color-mode-script"');
  });

  it('sets lang attribute on html element', () => {
    const html = renderToStaticMarkup(<StackwrightDocument lang="fr" />);
    expect(html).toContain('lang="fr"');
  });

  it('defaults lang to en', () => {
    const html = renderToStaticMarkup(<StackwrightDocument />);
    expect(html).toContain('lang="en"');
  });
});
