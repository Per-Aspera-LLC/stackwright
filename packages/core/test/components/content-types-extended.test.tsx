import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { IconGrid } from '../../src/components/base/IconGrid';
import { TextGrid } from '../../src/components/base/TextGrid';
import { TextBlockGrid } from '../../src/components/base/TextBlockGrid';
import { Timeline } from '../../src/components/narrative/Timeline';
import { UnknownContentType } from '../../src/components/base/UnknownContentType';
import { TabbedContentGrid } from '../../src/components/base/TabbedContentGrid';
import { registerComponent } from '../../src/utils/componentRegistry';

// ---------------------------------------------------------------------------
// Icon registry stub — mirrors the globalThis bridge used by @stackwright/icons
// ---------------------------------------------------------------------------
const iconMap = new Map<string, React.ComponentType<any>>();
const fakeIconRegistry = {
  get: (name: string) => iconMap.get(name),
  register: (name: string, component: React.ComponentType<any>) => iconMap.set(name, component),
  isRegistered: (name: string) => iconMap.has(name),
  getRegisteredIcons: () => Array.from(iconMap.keys()),
  clear: () => iconMap.clear(),
};
(globalThis as any).__stackwright_icon_registry__ = fakeIconRegistry;

// ---------------------------------------------------------------------------
// IconGrid
// ---------------------------------------------------------------------------

describe('IconGrid', () => {
  beforeEach(() => {
    fakeIconRegistry.clear();
  });

  it('renders heading and icon labels', () => {
    render(
      <IconGrid
        label="icons"
        heading={{ text: 'Our Tech Stack', textSize: 'h3' }}
        icons={[
          { src: 'react-logo', label: 'React' },
          { src: 'node-logo', label: 'Node.js' },
        ]}
      />
    );
    expect(screen.getByText('Our Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('renders without heading', () => {
    render(<IconGrid label="icons" icons={[{ src: 'logo', label: 'Logo' }]} />);
    expect(screen.getByText('Logo')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('falls back to text when icon is not in registry', () => {
    render(<IconGrid label="icons" icons={[{ src: 'unknown-icon', label: 'Mystery' }]} />);
    // When icon is not registered, it renders the src as text
    expect(screen.getByText('unknown-icon')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
  });

  it('renders registered icon component', () => {
    const TestIcon = ({ size, color }: { size?: number; color?: string }) => (
      <svg data-testid="test-svg" width={size} fill={color} />
    );
    fakeIconRegistry.register('custom-icon', TestIcon);

    render(<IconGrid label="icons" icons={[{ src: 'custom-icon', label: 'Custom' }]} />);
    expect(screen.getByTestId('test-svg')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('renders icons without labels', () => {
    render(<IconGrid label="icons" icons={[{ src: 'logo' }]} />);
    // Should render the src text fallback but no label span
    expect(screen.getByText('logo')).toBeInTheDocument();
  });

  it('uses auto-fill grid for responsive columns', () => {
    const { container } = render(<IconGrid label="icons" icons={[{ src: 'a', label: 'A' }]} />);
    const gridDiv = Array.from(container.querySelectorAll('div')).find((el) =>
      (el as HTMLElement).style.gridTemplateColumns?.includes('auto-fill')
    );
    expect(gridDiv).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// TextGrid
// ---------------------------------------------------------------------------

describe('TextGrid', () => {
  it('renders plain text blocks', () => {
    render(<TextGrid content={[{ text: 'Hello world' }, { text: 'Another paragraph' }]} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Another paragraph')).toBeInTheDocument();
  });

  it('renders bullet list items with default icon', () => {
    render(<TextGrid content={[{ text: '- First item' }]} />);
    // Should render bullet icon and item text
    expect(screen.getByText('•')).toBeInTheDocument();
    expect(screen.getByText('First item')).toBeInTheDocument();
  });

  it('renders numbered list items with # prefix', () => {
    render(<TextGrid content={[{ text: '# Step one' }, { text: '# Step two' }]} />);
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('Step one')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('Step two')).toBeInTheDocument();
  });

  it('renders %DIVIDER% as an hr element', () => {
    const { container } = render(<TextGrid content={[{ text: '%DIVIDER%' }]} />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('renders %SPACER% as an empty div', () => {
    const { container } = render(<TextGrid content={[{ text: '%SPACER%' }]} />);
    const spacer = Array.from(container.querySelectorAll('div')).find(
      (el) => (el as HTMLElement).style.height === '16px'
    );
    expect(spacer).toBeTruthy();
  });

  it('uses custom list_icon from config', () => {
    render(<TextGrid content={[{ text: '- Bullet item' }]} config={{ list_icon: '→' }} />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  it('handles multiline text blocks', () => {
    render(<TextGrid content={[{ text: 'Line one\nLine two' }]} />);
    expect(screen.getByText('Line one')).toBeInTheDocument();
    expect(screen.getByText('Line two')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

describe('Timeline', () => {
  it('renders heading and timeline items', () => {
    render(
      <Timeline
        label="timeline"
        heading={{ text: 'Our History', textSize: 'h3' }}
        items={[
          { year: '2020', event: 'Company founded' },
          { year: '2021', event: 'First product launch' },
          { year: '2023', event: 'Series A funding' },
        ]}
      />
    );
    expect(screen.getByText('Our History')).toBeInTheDocument();
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('Company founded')).toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
    expect(screen.getByText('First product launch')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('Series A funding')).toBeInTheDocument();
  });

  it('renders without heading', () => {
    render(<Timeline label="timeline" items={[{ year: '2024', event: 'New milestone' }]} />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('New milestone')).toBeInTheDocument();
  });

  it('renders timeline dots for each item', () => {
    const { container } = render(
      <Timeline
        label="timeline"
        items={[
          { year: '2020', event: 'Event A' },
          { year: '2021', event: 'Event B' },
        ]}
      />
    );
    // Each timeline item has a dot (circle) with borderRadius: 50%
    const dots = Array.from(container.querySelectorAll('div')).filter(
      (el) => (el as HTMLElement).style.borderRadius === '50%'
    );
    expect(dots).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// UnknownContentType
// ---------------------------------------------------------------------------

describe('UnknownContentType', () => {
  it('displays the unknown type name in the warning', () => {
    render(<UnknownContentType contentType="fancy_widget" />);
    expect(screen.getByText(/Unknown content type/)).toBeInTheDocument();
    expect(screen.getByText(/fancy_widget/)).toBeInTheDocument();
  });

  it('includes helpful guidance text', () => {
    render(<UnknownContentType contentType="chart" />);
    expect(screen.getByText(/not registered/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// TabbedContentGrid
// ---------------------------------------------------------------------------

describe('TabbedContentGrid', () => {
  // Register a simple test component for tab content
  beforeEach(() => {
    registerComponent('faq', ({ heading }: any) => (
      <div data-testid="faq-content">{heading?.text}</div>
    ));
  });

  it('renders heading and tab buttons', () => {
    render(
      <TabbedContentGrid
        label="tabs"
        heading={{ text: 'Learn More', textSize: 'h3' }}
        tabs={[
          {
            type: 'faq' as const,
            label: 'FAQ Tab',
            heading: { text: 'FAQ', textSize: 'h3' },
            items: [],
          },
        ]}
      />
    );
    expect(screen.getByText('Learn More')).toBeInTheDocument();
    expect(screen.getByRole('tab')).toHaveTextContent('FAQ Tab');
  });

  it('renders multiple tabs with correct ARIA attributes', () => {
    render(
      <TabbedContentGrid
        label="tabs"
        heading={{ text: 'Content', textSize: 'h3' }}
        tabs={[
          {
            type: 'faq' as const,
            label: 'Tab A',
            heading: { text: 'A', textSize: 'h3' },
            items: [],
          },
          {
            type: 'faq' as const,
            label: 'Tab B',
            heading: { text: 'B', textSize: 'h3' },
            items: [],
          },
        ]}
      />
    );
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches tab content on click', () => {
    render(
      <TabbedContentGrid
        label="tabs"
        heading={{ text: 'Tabs', textSize: 'h3' }}
        tabs={[
          {
            type: 'faq' as const,
            label: 'First',
            heading: { text: 'Content A', textSize: 'h3' },
            items: [],
          },
          {
            type: 'faq' as const,
            label: 'Second',
            heading: { text: 'Content B', textSize: 'h3' },
            items: [],
          },
        ]}
      />
    );

    // First tab is active by default
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    // Click second tab
    act(() => {
      tabs[1].click();
    });

    expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('has tablist, tab, and tabpanel roles', () => {
    render(
      <TabbedContentGrid
        label="tabs"
        heading={{ text: 'Tabs', textSize: 'h3' }}
        tabs={[
          {
            type: 'faq' as const,
            label: 'Only Tab',
            heading: { text: 'X', textSize: 'h3' },
            items: [],
          },
        ]}
      />
    );
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('uses label as tab text when no explicit label', () => {
    render(
      <TabbedContentGrid
        label="tabs"
        heading={{ text: 'Tabs', textSize: 'h3' }}
        tabs={[{ type: 'faq' as const, heading: { text: 'No Label', textSize: 'h3' }, items: [] }]}
      />
    );
    // Falls back to "Tab 1" when no label
    expect(screen.getByRole('tab')).toHaveTextContent('Tab 1');
  });
});

// ---------------------------------------------------------------------------
// TextBlockGrid
// ---------------------------------------------------------------------------

describe('TextBlockGrid', () => {
  it('renders heading and text blocks', () => {
    render(
      <TextBlockGrid
        label="text-section"
        heading={{ text: 'About Us', textSize: 'h2' }}
        textBlocks={[
          { text: 'We are a company.', textSize: 'body1' },
          { text: 'Founded in 2024.', textSize: 'body2' },
        ]}
      />
    );
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('We are a company.')).toBeInTheDocument();
    expect(screen.getByText('Founded in 2024.')).toBeInTheDocument();
  });

  it('renders without heading', () => {
    render(
      <TextBlockGrid
        label="text-section"
        textBlocks={[{ text: 'Just some text.', textSize: 'body1' }]}
      />
    );
    expect(screen.getByText('Just some text.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders buttons when provided', () => {
    render(
      <TextBlockGrid
        label="text-section"
        heading={{ text: 'Call to Action', textSize: 'h3' }}
        textBlocks={[{ text: 'Join us today!', textSize: 'body1' }]}
        buttons={[
          {
            text: 'Sign Up',
            textSize: 'button',
            variant: 'contained',
            href: '/signup',
          },
          {
            text: 'Learn More',
            textSize: 'button',
            variant: 'outlined',
            href: '/about',
          },
        ]}
      />
    );
    expect(screen.getByText('Call to Action')).toBeInTheDocument();
    expect(screen.getByText('Join us today!')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders multiple text blocks in order', () => {
    render(
      <TextBlockGrid
        label="text-section"
        textBlocks={[
          { text: 'First paragraph', textSize: 'body1' },
          { text: 'Second paragraph', textSize: 'body1' },
          { text: 'Third paragraph', textSize: 'body1' },
        ]}
      />
    );
    const paragraphs = screen.getAllByText(/paragraph/);
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toHaveTextContent('First paragraph');
    expect(paragraphs[1]).toHaveTextContent('Second paragraph');
    expect(paragraphs[2]).toHaveTextContent('Third paragraph');
  });

  it('applies background color when provided', () => {
    const { container } = render(
      <TextBlockGrid
        label="text-section"
        textBlocks={[{ text: 'Styled text', textSize: 'body1' }]}
        background="#f0f0f0"
      />
    );
    const section = container.querySelector('section');
    expect(section).toHaveStyle({ background: '#f0f0f0' });
  });
});
