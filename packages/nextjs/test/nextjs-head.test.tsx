import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Mock next/head -- renders children directly. React 19 hoists <title>, <meta>,
// and <link> into document.head automatically, so we query document.head in tests.
// ---------------------------------------------------------------------------

vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import after mock
import { NextStackwrightHead } from '../src/components/NextStackwrightHead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  // Clean up any elements React 19 hoisted into document.head
  document.head.querySelectorAll('title, meta, link').forEach((el) => el.remove());
});

function queryHead(selector: string): Element | null {
  return document.head.querySelector(selector);
}

function queryAllHead(selector: string): NodeListOf<Element> {
  return document.head.querySelectorAll(selector);
}

// ---------------------------------------------------------------------------
// NextStackwrightHead
// ---------------------------------------------------------------------------

describe('NextStackwrightHead', () => {
  it('renders a <title> tag when title is provided', () => {
    render(<NextStackwrightHead title="About Us" />);
    const title = queryHead('title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe('About Us');
  });

  it('renders meta description when provided', () => {
    render(<NextStackwrightHead description="Learn about Acme Corp." />);
    const meta = queryHead('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute('content')).toBe('Learn about Acme Corp.');
  });

  it('renders og:title and og:description from title and description', () => {
    render(<NextStackwrightHead title="About" description="About page" />);
    const ogTitle = queryHead('meta[property="og:title"]');
    const ogDesc = queryHead('meta[property="og:description"]');
    expect(ogTitle!.getAttribute('content')).toBe('About');
    expect(ogDesc!.getAttribute('content')).toBe('About page');
  });

  it('renders og:image when provided', () => {
    render(<NextStackwrightHead ogImage="https://acme.com/images/hero.jpg" />);
    const ogImage = queryHead('meta[property="og:image"]');
    expect(ogImage!.getAttribute('content')).toBe('https://acme.com/images/hero.jpg');
  });

  it('renders og:site_name when provided', () => {
    render(<NextStackwrightHead ogSiteName="Acme Corp" />);
    const ogSiteName = queryHead('meta[property="og:site_name"]');
    expect(ogSiteName!.getAttribute('content')).toBe('Acme Corp');
  });

  it('always renders og:type as website', () => {
    render(<NextStackwrightHead />);
    const ogType = queryHead('meta[property="og:type"]');
    expect(ogType).not.toBeNull();
    expect(ogType!.getAttribute('content')).toBe('website');
  });

  it('renders canonical link when provided', () => {
    render(<NextStackwrightHead canonical="https://acme.com/about" />);
    const link = queryHead('link[rel="canonical"]');
    expect(link!.getAttribute('href')).toBe('https://acme.com/about');
  });

  it('renders noindex robots meta when noindex is true', () => {
    render(<NextStackwrightHead noindex={true} />);
    const robots = queryHead('meta[name="robots"]');
    expect(robots).not.toBeNull();
    expect(robots!.getAttribute('content')).toBe('noindex,nofollow');
  });

  it('omits robots meta when noindex is false or undefined', () => {
    render(<NextStackwrightHead noindex={false} />);
    const robots = queryHead('meta[name="robots"]');
    expect(robots).toBeNull();
  });

  it('omits empty fields -- no empty meta tags', () => {
    render(<NextStackwrightHead />);
    // Only og:type should be present (always rendered)
    const swMeta = queryAllHead(
      'meta[property^="og:"], meta[name="description"], meta[name="robots"]'
    );
    expect(swMeta).toHaveLength(1);
    expect(swMeta[0].getAttribute('property')).toBe('og:type');

    // No title, no canonical
    expect(queryHead('title')).toBeNull();
    expect(queryHead('link[rel="canonical"]')).toBeNull();
  });

  it('renders all fields together correctly', () => {
    render(
      <NextStackwrightHead
        title="About Us | Acme Corp"
        description="Learn about our mission."
        ogImage="https://acme.com/og.jpg"
        ogSiteName="Acme Corp"
        canonical="https://acme.com/about"
        noindex={false}
      />
    );

    expect(queryHead('title')!.textContent).toBe('About Us | Acme Corp');
    expect(queryHead('meta[name="description"]')!.getAttribute('content')).toBe(
      'Learn about our mission.'
    );
    expect(queryHead('meta[property="og:title"]')!.getAttribute('content')).toBe(
      'About Us | Acme Corp'
    );
    expect(queryHead('meta[property="og:image"]')!.getAttribute('content')).toBe(
      'https://acme.com/og.jpg'
    );
    expect(queryHead('link[rel="canonical"]')!.getAttribute('href')).toBe('https://acme.com/about');
    // noindex=false should NOT render robots meta
    expect(queryHead('meta[name="robots"]')).toBeNull();
  });
});
