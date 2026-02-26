// packages/core/tests/components/DynamicPage.snapshot.test.tsx
//
// NOTE: This test was previously a full HTML snapshot, which coupled it to
// MUI's generated CSS class names (e.g. css-1brzuf6). Those hashes change
// whenever render order or MUI version changes, making the test brittle.
//
// It now uses structural assertions: verify the key landmarks are present
// in the rendered output without depending on generated class names.
import React from 'react';
import { render, screen } from '@testing-library/react';
import DynamicPage from '../../src/components/DynamicPage';
import { ButtonVariant, TypographyVariant } from '@stackwright/types';

const pageContent = {
  content: {
    content_items: [
      {
        main: {
          label: 'Main Content',
          heading: {
            text: 'Welcome to Stackwright',
            size: 'h1' as TypographyVariant,
          },
          textBlocks: [
            {
              text: 'Your React stack development accelerator',
              size: 'body1' as TypographyVariant,
            },
          ],
          buttons: [
            {
              text: 'Get Started',
              variant: 'contained' as ButtonVariant,
              href: '/docs',
              label: 'getStartedButton',
              size: 'h4' as TypographyVariant,
            },
          ],
        },
      },
    ],
  },
};

describe('DynamicPage Snapshots', () => {
  it('renders heading text', () => {
    render(<DynamicPage pageContent={pageContent} />);
    expect(screen.getByText('Welcome to Stackwright')).toBeInTheDocument();
  });

  it('renders body text', () => {
    render(<DynamicPage pageContent={pageContent} />);
    expect(screen.getByText('Your React stack development accelerator')).toBeInTheDocument();
  });

  it('renders a button with correct href', () => {
    render(<DynamicPage pageContent={pageContent} />);
    const link = screen.getByRole('link', { name: /get started/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/docs');
  });
});
