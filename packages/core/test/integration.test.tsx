// packages/core/tests/integration.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import  SlugPage  from '../src/pages/SlugPage';
import { describe, expect, it } from 'vitest';
import { ButtonVariant, TypographyVariant } from 'index';

describe('Integration Tests', () => {
  it('should render SlugPage with DynamicPage content', () => {
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

    const siteConfig = {
      title: 'Stackwright',
      navigation: [
          { label: 'Home', href: '/' },
          { label: 'Docs', href: 'docs' },
        ],
      appBar: {
        titleText: 'Stackwright',
        menuItems: [
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
        ],
        textcolor: '#ffffff',
        backgroundcolor: '#000000',
      },
      footer: {
        copyright: 'Â© 2023 Stackwright',
        buttons: [
          { text: 'GitHub', href: 'https://github.com/stackwright' },
        ],
      },
    };
    render(<SlugPage pageContent={pageContent} siteConfig={siteConfig} />);

    expect(screen.getByText('Welcome to Stackwright')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });
});