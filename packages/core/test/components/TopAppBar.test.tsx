import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@stackwright/themes';
import type { Theme } from '@stackwright/themes';
import { getContrastRatio } from '../../src/utils/colorUtils';

// Mock useBreakpoints before importing TopAppBar
const mockBreakpoints = {
  isXs: false,
  isSm: false,
  isMd: false,
  isLg: false,
  isXl: false,
  isSmUp: false,
  isMdUp: false,
  isLgUp: false,
  isXlUp: false,
  isSmDown: false,
  isMdDown: false,
  isLgDown: false,
  breakpoints: {},
};

vi.mock('../../src/hooks/useBreakpoints', () => ({
  useBreakpoints: () => mockBreakpoints,
}));

import TopAppBar from '../../src/components/structural/TopAppBar';

describe('TopAppBar', () => {
  beforeEach(() => {
    // Reset to desktop defaults
    Object.assign(mockBreakpoints, {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: true,
      isXl: false,
      isSmUp: true,
      isMdUp: true,
      isLgUp: true,
      isXlUp: false,
      isSmDown: false,
      isMdDown: false,
      isLgDown: false,
    });
  });

  it('renders title', () => {
    render(<TopAppBar title="Test Site" />);
    expect(screen.getByText('Test Site')).toBeInTheDocument();
  });

  it('renders nav links on desktop', () => {
    render(
      <TopAppBar
        title="Test Site"
        menuItems={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
        ]}
      />
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders hamburger menu on mobile', () => {
    Object.assign(mockBreakpoints, {
      isXs: true,
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      isSmUp: false,
      isMdUp: false,
      isLgUp: false,
      isXlUp: false,
      isSmDown: true,
      isMdDown: true,
      isLgDown: true,
    });

    render(
      <TopAppBar
        title="Test Site"
        menuItems={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
        ]}
      />
    );
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('does not render hamburger on desktop', () => {
    render(<TopAppBar title="Test Site" menuItems={[{ label: 'Home', href: '/' }]} />);
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Regression: stackwright-819 / swp-rlih — R10 6b adjudication
//
// Fixture mirrors the theme + appBar block that shipped in R10's
// stackwright.yml: appBar.textColor: primary-foreground, on a theme whose
// colorsSchema (7-key, no foreground slot) used to silently strip that
// token, and whose resolveColor() fell through to emitting the literal,
// unparseable string "primary-foreground" as a CSS color. jsdom mirrors a
// real browser here: an invalid CSS color value is rejected by the style
// setter, so `header.style.color` stays '' pre-fix and only becomes a real
// `rgb(...)` string post-fix.
// ---------------------------------------------------------------------------

/** Convert jsdom's computed `rgb(r, g, b)` string back to a hex color. */
function rgbStringToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) throw new Error(`Not a parseable rgb() string: "${rgb}"`);
  const [, r, g, b] = match;
  const toHex = (n: string) => Number(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const r10Theme: Theme = {
  id: 'r10-baserow-fixture',
  name: 'R10 Baserow Fixture',
  description: 'Verbatim-shaped fixture from the R10 gate run stackwright.yml theme block',
  colors: {
    primary: '#1a365d',
    secondary: '#2c5282',
    accent: '#3182ce',
    background: '#ffffff',
    surface: '#f7fafc',
    text: '#1a1a1a',
    textSecondary: '#4a5568',
  },
  darkColors: {
    primary: '#90cdf4',
    secondary: '#63b3ed',
    accent: '#4299e1',
    background: '#1a202c',
    surface: '#2d3748',
    text: '#ffffff',
    textSecondary: '#cbd5e0',
  },
  typography: {
    fontFamily: { primary: 'sans-serif', secondary: 'sans-serif' },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  spacing: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem', '2xl': '3rem' },
};

describe('TopAppBar — stackwright-819 / swp-rlih regression (R10 fixture)', () => {
  beforeEach(() => {
    Object.assign(mockBreakpoints, {
      isXs: false,
      isSm: false,
      isMd: false,
      isLg: true,
      isXl: false,
      isSmUp: true,
      isMdUp: true,
      isLgUp: true,
      isXlUp: false,
      isSmDown: false,
      isMdDown: false,
      isLgDown: false,
    });
  });

  it('resolves appBar.textColor: primary-foreground to a real hex, not the raw token', () => {
    const { container } = render(
      <ThemeProvider theme={r10Theme} initialColorMode="light">
        <TopAppBar title="Baserow CRM" textcolor="primary-foreground" />
      </ThemeProvider>
    );
    const header = container.querySelector('header') as HTMLElement;
    expect(header).toBeTruthy();

    // Pre-fix this was '' — jsdom (like a real browser) refuses to set an
    // invalid CSS color value, so the raw token never reaches style.color.
    expect(header.style.color).not.toBe('');
    expect(header.style.color).not.toBe('primary-foreground');
    expect(header.style.color).toMatch(/^rgb\(/);

    const resolvedHex = rgbStringToHex(header.style.color);
    const ratio = getContrastRatio(resolvedHex, '#1a365d');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('resolves footer.textColor: primary-foreground to a real hex via BottomAppBar', async () => {
    const { default: BottomAppBar } = await import('../../src/components/structural/BottomAppBar');
    const { container } = render(
      <ThemeProvider theme={r10Theme} initialColorMode="light">
        <BottomAppBar footer={{ textColor: 'primary-foreground' }} />
      </ThemeProvider>
    );
    const footer = container.querySelector('footer') as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.style.color).not.toBe('');
    expect(footer.style.color).not.toBe('primary-foreground');

    const resolvedHex = rgbStringToHex(footer.style.color);
    const ratio = getContrastRatio(resolvedHex, '#1a365d');
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
