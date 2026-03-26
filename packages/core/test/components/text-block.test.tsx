import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock useSafeTheme before importing TextBlockGrid
const mockTheme = {
  colors: {
    primary: '#1976d2',
    accent: '#ff9800',
    text: '#333333',
    textSecondary: '#666666',
    background: '#ffffff',
  },
  typography: {
    h1: { fontSize: '2.5rem' },
    h2: { fontSize: '2rem' },
    h3: { fontSize: '1.75rem' },
    body1: { fontSize: '1rem' },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

vi.mock('../../src/hooks/useSafeTheme', () => ({
  useSafeTheme: () => mockTheme,
}));

// Mock Media component to simplify testing
vi.mock('../../src/components/media/Media', () => ({
  Media: ({ label }: { label: string }) => <div data-testid={`media-${label}`}>Media</div>,
}));

import { TextBlockGrid } from '../../src/components/base/TextBlockGrid';

describe('TextBlockGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with heading and textBlocks', () => {
    render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Welcome to Our Site', textSize: 'h2' }}
        textBlocks={[
          { text: 'This is the first paragraph.' },
          { text: 'This is the second paragraph.' },
        ]}
      />
    );

    expect(screen.getByText('Welcome to Our Site')).toBeInTheDocument();
    expect(screen.getByText('This is the first paragraph.')).toBeInTheDocument();
    expect(screen.getByText('This is the second paragraph.')).toBeInTheDocument();
  });

  it('renders without optional heading', () => {
    render(
      <TextBlockGrid
        label="content"
        textBlocks={[{ text: 'Just some text without a heading.' }]}
      />
    );

    expect(screen.getByText('Just some text without a heading.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders with optional buttons', () => {
    render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Call to Action', textSize: 'h2' }}
        textBlocks={[{ text: 'Ready to get started?' }]}
        buttons={[
          { text: 'Get Started', variant: 'contained', href: '/signup' },
          { text: 'Learn More', variant: 'outlined', href: '/docs' },
        ]}
      />
    );

    expect(screen.getByText('Call to Action')).toBeInTheDocument();
    expect(screen.getByText('Ready to get started?')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();

    // Verify buttons are rendered as links with correct hrefs
    const getStartedLink = screen.getByText('Get Started').closest('a');
    const learnMoreLink = screen.getByText('Learn More').closest('a');
    expect(getStartedLink?.getAttribute('href')).toBe('/signup');
    expect(learnMoreLink?.getAttribute('href')).toBe('/docs');
  });

  it('applies theme colors correctly to heading', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Themed Heading', textSize: 'h2' }}
        textBlocks={[{ text: 'Some content' }]}
      />
    );

    const heading = container.querySelector('h2');
    expect(heading).toBeTruthy();
    // Should use primary color from theme
    expect(heading?.style.color).toBe('rgb(25, 118, 210)'); // #1976d2 in rgb
  });

  it('handles empty textBlocks array (edge case)', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Heading Only', textSize: 'h2' }}
        textBlocks={[]}
      />
    );

    expect(screen.getByText('Heading Only')).toBeInTheDocument();
    // Should not render TextGrid at all when textBlocks is empty
    const section = container.querySelector('section');
    expect(section).toBeTruthy();
  });

  it('applies background color when provided', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Colored Background', textSize: 'h2' }}
        textBlocks={[{ text: 'Content with background' }]}
        background="#f5f5f5"
      />
    );

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    // Browser normalizes hex colors to rgb
    expect(section?.style.background).toBe('rgb(245, 245, 245)');
  });

  it('uses transparent background when not provided', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'No Background', textSize: 'h2' }}
        textBlocks={[{ text: 'Default background' }]}
      />
    );

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.style.background).toBe('transparent');
  });

  it('uses resolveColor for heading color with custom textColor', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Custom Color', textSize: 'h2', textColor: 'accent' }}
        textBlocks={[{ text: 'Some content' }]}
      />
    );

    const heading = container.querySelector('h2');
    expect(heading).toBeTruthy();
    // Should resolve 'accent' to the accent color from theme
    expect(heading?.style.color).toBe('rgb(255, 152, 0)'); // #ff9800 in rgb
  });

  it('renders TextGrid component with textBlocks', () => {
    render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'With Text Grid', textSize: 'h2' }}
        textBlocks={[
          { text: 'First block' },
          { text: '- Bullet item' },
          { text: '# Numbered item' },
        ]}
      />
    );

    expect(screen.getByText('First block')).toBeInTheDocument();
    expect(screen.getByText('Bullet item')).toBeInTheDocument();
    expect(screen.getByText('Numbered item')).toBeInTheDocument();
  });

  it('renders ThemedButton components correctly', () => {
    render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Buttons Test', textSize: 'h2' }}
        textBlocks={[{ text: 'Click below' }]}
        buttons={[
          {
            text: 'Primary Action',
            variant: 'contained',
            bgColor: 'primary',
            textColor: '#ffffff',
          },
          {
            text: 'Secondary Action',
            variant: 'text',
          },
        ]}
      />
    );

    expect(screen.getByText('Primary Action')).toBeInTheDocument();
    expect(screen.getByText('Secondary Action')).toBeInTheDocument();
  });

  it('centers the heading text', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Centered Heading', textSize: 'h2' }}
        textBlocks={[{ text: 'Content' }]}
      />
    );

    const heading = container.querySelector('h2');
    expect(heading).toBeTruthy();
    expect(heading?.style.textAlign).toBe('center');
  });

  it('applies maxWidth and margin to content wrapper', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Constrained Width', textSize: 'h2' }}
        textBlocks={[{ text: 'Content' }]}
      />
    );

    // Find the inner div that has maxWidth
    const innerDiv = container.querySelector('div[style*="max-width"]');
    expect(innerDiv).toBeTruthy();
    expect(innerDiv?.style.maxWidth).toBe('1200px');
    // Browser normalizes '0' to '0px' in margin shorthand
    expect(innerDiv?.style.margin).toBe('0px auto');
  });

  it('renders section with correct padding and spacing', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Spacing Test', textSize: 'h2' }}
        textBlocks={[{ text: 'Content' }]}
      />
    );

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    // Should use theme spacing.md for vertical padding and spacing.xl for margin
    expect(section?.style.padding).toContain(mockTheme.spacing.md);
    expect(section?.style.margin).toBe(mockTheme.spacing.xl);
  });

  it('handles multiple buttons with flex layout', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Multiple Buttons', textSize: 'h2' }}
        textBlocks={[{ text: 'Choose an option' }]}
        buttons={[
          { text: 'Option 1', variant: 'contained' },
          { text: 'Option 2', variant: 'outlined' },
          { text: 'Option 3', variant: 'text' },
        ]}
      />
    );

    // Find the buttons container
    const buttonsContainer = container.querySelector('div[style*="flex-wrap"]');
    expect(buttonsContainer).toBeTruthy();
    expect(buttonsContainer?.style.display).toBe('flex');
    expect(buttonsContainer?.style.flexWrap).toBe('wrap');
    expect(buttonsContainer?.style.justifyContent).toBe('center');

    // Verify all buttons are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('adds margin between textBlocks and buttons when both exist', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'With Both', textSize: 'h2' }}
        textBlocks={[{ text: 'Text content' }]}
        buttons={[{ text: 'Button', variant: 'contained' }]}
      />
    );

    // The div wrapping TextGrid should have marginBottom when buttons exist
    const textGridWrapper = Array.from(container.querySelectorAll('div')).find(
      (el) => (el as HTMLElement).style.marginBottom === mockTheme.spacing.md
    );
    expect(textGridWrapper).toBeTruthy();
  });

  it('does not add margin to textBlocks when no buttons', () => {
    const { container } = render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'No Buttons', textSize: 'h2' }}
        textBlocks={[{ text: 'Just text' }]}
      />
    );

    // The TextGrid wrapper should have marginBottom of 0
    const textGridWrapper = Array.from(container.querySelectorAll('div')).find((el) => {
      const style = (el as HTMLElement).style;
      return style.marginBottom === '0' || style.marginBottom === '0px';
    });
    expect(textGridWrapper).toBeTruthy();
  });

  it('renders with complex textBlocks containing special formatting', () => {
    render(
      <TextBlockGrid
        label="content"
        heading={{ text: 'Complex Content', textSize: 'h2' }}
        textBlocks={[
          { text: 'Regular paragraph' },
          { text: '- First bullet point' },
          { text: '- Second bullet point' },
          { text: '# Step one' },
          { text: '# Step two' },
          { text: '%DIVIDER%' },
          { text: 'After divider' },
        ]}
      />
    );

    expect(screen.getByText('Regular paragraph')).toBeInTheDocument();
    expect(screen.getByText('First bullet point')).toBeInTheDocument();
    expect(screen.getByText('Second bullet point')).toBeInTheDocument();
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('Step two')).toBeInTheDocument();
    expect(screen.getByText('After divider')).toBeInTheDocument();
  });
});
