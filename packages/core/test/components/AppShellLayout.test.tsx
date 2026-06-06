import React from 'react';
import { render, screen } from '@testing-library/react';
import AppShellLayout from '../../src/components/structural/AppShellLayout';
import { PageContent } from '@stackwright/types';

// useSafeTheme falls back gracefully when ThemeProvider is absent,
// so we can render AppShellLayout directly without a wrapper.

const baseContent: PageContent = {
  content: {
    content_items: [],
  },
};

describe('AppShellLayout — smoke tests', () => {
  it('renders without crashing with layoutMode: app-shell', () => {
    const pageContent: PageContent = { ...baseContent, layoutMode: 'app-shell' };
    render(<AppShellLayout pageContent={pageContent} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders without crashing with layoutMode: page (standard)', () => {
    const pageContent: PageContent = { ...baseContent, layoutMode: 'page' };
    render(<AppShellLayout pageContent={pageContent} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders without crashing with no layoutMode', () => {
    render(<AppShellLayout pageContent={baseContent} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
