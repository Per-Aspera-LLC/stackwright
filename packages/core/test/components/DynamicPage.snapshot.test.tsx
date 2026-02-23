// packages/core/tests/components/DynamicPage.snapshot.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import  DynamicPage from '../../src/components/DynamicPage';
import { ButtonVariant, TypographyVariant } from '@stackwright/types';

describe('DynamicPage Snapshots', () => {
  it('matches the snapshot', () => {
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

    const { asFragment } = render(<DynamicPage pageContent={pageContent} />);
    expect(asFragment()).toMatchSnapshot();
  });
});