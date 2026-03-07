import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

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
