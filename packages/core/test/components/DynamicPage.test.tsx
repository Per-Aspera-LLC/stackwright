// packages/core/tests/components/DynamicPage.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import DynamicPage from '../../src/components/DynamicPage';
import { ButtonVariant, TypographyVariant } from '@stackwright/types';

describe('DynamicPage', () => {
  it('should render the page based on YAML configuration', () => {
    const pageContent = {
      content: {
        content_items: [
          {
            type: 'main' as const,
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
        ],
      },
    };
    render(<DynamicPage pageContent={pageContent} />);
    expect(screen.getByText('Welcome to Stackwright')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});
