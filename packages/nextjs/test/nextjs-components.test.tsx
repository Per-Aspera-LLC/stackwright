import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// ---------------------------------------------------------------------------
// Module-level mocks for Next.js primitives
//
// These are intentionally thin — they pass through all props so we can verify
// what our adapter components actually computed and forwarded.
// ---------------------------------------------------------------------------

vi.mock('next/image', () => ({
  default: (props: any) => <img data-testid="next-image" {...props} />,
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => (
    <a data-testid="next-link" {...props}>
      {children}
    </a>
  ),
}));

let mockPathname = '/';
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: mockPathname,
    query: {},
    asPath: mockPathname,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextStackwrightImage } from '../src/components/NextStackwrightImage';
import { NextStackwrightLink } from '../src/components/NextStackwrightLink';
import {
  NextStackwrightRouter,
  NextStackwrightRoute,
} from '../src/components/NextStackwrightRouter';
import { createStackwrightNextConfig } from '../src/config/NextStackwrightConfig';
import { registerNextJSComponents } from '../src/index';
import { stackwrightRegistry } from '@stackwright/core';

// ---------------------------------------------------------------------------
// NextStackwrightImage
// ---------------------------------------------------------------------------

describe('NextStackwrightImage', () => {
  it('renders an image with src and alt', () => {
    render(<NextStackwrightImage src="/hero.png" alt="Hero image" aspect_ratio={16 / 9} />);
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('src', '/hero.png');
    expect(img).toHaveAttribute('alt', 'Hero image');
  });

  it('passes numeric width and height through', () => {
    render(
      <NextStackwrightImage
        src="/photo.jpg"
        alt="Photo"
        aspect_ratio={1}
        width={800}
        height={600}
      />
    );
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('width', '800');
    expect(img).toHaveAttribute('height', '600');
  });

  it('coerces string width/height to numbers', () => {
    render(
      <NextStackwrightImage
        src="/photo.jpg"
        alt="Photo"
        aspect_ratio={1}
        width={'400' as any}
        height={'300' as any}
      />
    );
    const img = screen.getByTestId('next-image');
    // parseInt("400") = 400
    expect(img).toHaveAttribute('width', '400');
    expect(img).toHaveAttribute('height', '300');
  });

  it('omits width and height when fill is true', () => {
    render(
      <NextStackwrightImage
        src="/bg.png"
        alt="Background"
        aspect_ratio={1}
        fill={true}
        width={800}
        height={600}
      />
    );
    const img = screen.getByTestId('next-image');
    // When fill=true, width and height should not be set
    expect(img.getAttribute('width')).toBeNull();
    expect(img.getAttribute('height')).toBeNull();
  });

  it('passes priority and quality props', () => {
    render(
      <NextStackwrightImage
        src="/hero.png"
        alt="Hero"
        aspect_ratio={1}
        priority={true}
        quality={90}
      />
    );
    const img = screen.getByTestId('next-image');
    expect(img).toHaveAttribute('quality', '90');
  });

  it('does not leak aspect_ratio to the DOM', () => {
    render(<NextStackwrightImage src="/x.png" alt="X" aspect_ratio={1.5} />);
    const img = screen.getByTestId('next-image');
    expect(img.getAttribute('aspect_ratio')).toBeNull();
  });

  it('passes className and style through', () => {
    render(
      <NextStackwrightImage
        src="/x.png"
        alt="X"
        aspect_ratio={1}
        className="hero-img"
        style={{ objectFit: 'cover' }}
      />
    );
    const img = screen.getByTestId('next-image');
    expect(img).toHaveClass('hero-img');
    expect(img).toHaveStyle({ objectFit: 'cover' });
  });
});

// ---------------------------------------------------------------------------
// NextStackwrightLink
// ---------------------------------------------------------------------------

describe('NextStackwrightLink', () => {
  it('renders internal links via Next.js Link', () => {
    render(<NextStackwrightLink href="/about">About Us</NextStackwrightLink>);
    const link = screen.getByTestId('next-link');
    expect(link).toHaveAttribute('href', '/about');
    expect(link).toHaveTextContent('About Us');
  });

  it('renders external http links as plain <a> tags', () => {
    render(<NextStackwrightLink href="https://example.com">External</NextStackwrightLink>);
    // Should NOT be a next-link, should be a plain <a>
    expect(screen.queryByTestId('next-link')).not.toBeInTheDocument();
    const link = screen.getByText('External');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('treats protocol-relative URLs as external', () => {
    render(<NextStackwrightLink href="//cdn.example.com/asset">CDN Link</NextStackwrightLink>);
    expect(screen.queryByTestId('next-link')).not.toBeInTheDocument();
    const link = screen.getByText('CDN Link');
    expect(link).toHaveAttribute('href', '//cdn.example.com/asset');
  });

  it('passes target and rel to external links', () => {
    render(
      <NextStackwrightLink href="https://example.com" target="_blank" rel="noopener noreferrer">
        Open
      </NextStackwrightLink>
    );
    const link = screen.getByText('Open');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('passes className and style to internal links', () => {
    render(
      <NextStackwrightLink href="/contact" className="nav-link" style={{ color: 'red' }}>
        Contact
      </NextStackwrightLink>
    );
    const link = screen.getByTestId('next-link');
    expect(link).toHaveClass('nav-link');
    expect(link).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('passes className and style to external links', () => {
    render(
      <NextStackwrightLink
        href="https://example.com"
        className="ext"
        style={{ fontWeight: 'bold' }}
      >
        Ext
      </NextStackwrightLink>
    );
    const link = screen.getByText('Ext');
    expect(link).toHaveClass('ext');
    expect(link).toHaveStyle({ fontWeight: 'bold' });
  });

  it('fires onClick on external links', () => {
    const handleClick = vi.fn();
    render(
      <NextStackwrightLink href="https://example.com" onClick={handleClick}>
        Click
      </NextStackwrightLink>
    );
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// NextStackwrightRouter & NextStackwrightRoute
// ---------------------------------------------------------------------------

describe('NextStackwrightRouter', () => {
  it('renders children directly (Next.js handles routing)', () => {
    render(
      <NextStackwrightRouter>
        <div data-testid="child">Routed content</div>
      </NextStackwrightRouter>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Routed content');
  });
});

describe('NextStackwrightRoute', () => {
  const TestComponent = () => <div data-testid="route-content">Matched</div>;

  it('renders component when pathname matches exactly (exact=true)', () => {
    mockPathname = '/dashboard';
    render(<NextStackwrightRoute path="/dashboard" component={TestComponent} exact={true} />);
    expect(screen.getByTestId('route-content')).toBeInTheDocument();
  });

  it('does not render when pathname does not match (exact=true)', () => {
    mockPathname = '/dashboard/settings';
    render(<NextStackwrightRoute path="/dashboard" component={TestComponent} exact={true} />);
    expect(screen.queryByTestId('route-content')).not.toBeInTheDocument();
  });

  it('renders when pathname starts with path (exact=false, default)', () => {
    mockPathname = '/dashboard/settings';
    render(<NextStackwrightRoute path="/dashboard" component={TestComponent} />);
    expect(screen.getByTestId('route-content')).toBeInTheDocument();
  });

  it('does not render when pathname does not start with path', () => {
    mockPathname = '/settings';
    render(<NextStackwrightRoute path="/dashboard" component={TestComponent} />);
    expect(screen.queryByTestId('route-content')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// createStackwrightNextConfig
// ---------------------------------------------------------------------------

describe('createStackwrightNextConfig', () => {
  it('returns a config object with webpack function', () => {
    const config = createStackwrightNextConfig();
    expect(config.webpack).toBeTypeOf('function');
  });

  it('includes turbopack key for Next.js 16+ compatibility', () => {
    const config = createStackwrightNextConfig();
    expect(config).toHaveProperty('turbopack');
  });

  it('preserves user config properties', () => {
    const config = createStackwrightNextConfig({
      reactStrictMode: true,
      poweredByHeader: false,
    });
    expect(config.reactStrictMode).toBe(true);
    expect(config.poweredByHeader).toBe(false);
  });

  it('merges user experimental config', () => {
    const config = createStackwrightNextConfig({
      experimental: { serverActions: { bodySizeLimit: '2mb' } } as any,
    });
    expect((config.experimental as any)?.serverActions?.bodySizeLimit).toBe('2mb');
  });

  it('merges user turbopack config', () => {
    const config = createStackwrightNextConfig({
      turbopack: { moduleIdStrategy: 'deterministic' } as any,
    });
    expect((config.turbopack as any)?.moduleIdStrategy).toBe('deterministic');
  });

  it('webpack function adds .yml and .yaml extensions in dev mode', () => {
    const config = createStackwrightNextConfig();
    const mockWebpackConfig = {
      watchOptions: { ignored: [] },
      resolve: { extensions: ['.js', '.ts', '.tsx'] },
    };
    const result = config.webpack!(mockWebpackConfig as any, { dev: true } as any);
    expect(result.resolve.extensions).toContain('.yml');
    expect(result.resolve.extensions).toContain('.yaml');
  });

  it('webpack function does not add extensions in production mode', () => {
    const config = createStackwrightNextConfig();
    const mockWebpackConfig = {
      watchOptions: { ignored: [] },
      resolve: { extensions: ['.js', '.ts', '.tsx'] },
    };
    const result = config.webpack!(mockWebpackConfig as any, { dev: false } as any);
    expect(result.resolve.extensions).not.toContain('.yml');
  });

  it('calls user webpack config first', () => {
    const callOrder: string[] = [];
    const userWebpack = (config: any, _context: any) => {
      callOrder.push('user');
      config.userModified = true;
      return config;
    };
    const config = createStackwrightNextConfig({ webpack: userWebpack });
    const mockWebpackConfig = {
      watchOptions: { ignored: [] },
      resolve: { extensions: ['.js'] },
    };
    const result = config.webpack!(mockWebpackConfig as any, { dev: true } as any);
    expect(result.userModified).toBe(true);
    expect(result.resolve.extensions).toContain('.yml');
  });
});

// ---------------------------------------------------------------------------
// registerNextJSComponents — real registration into real registry
// ---------------------------------------------------------------------------

describe('registerNextJSComponents', () => {
  beforeEach(() => {
    stackwrightRegistry.clear();
  });

  it('registers all four framework components', () => {
    registerNextJSComponents();

    expect(stackwrightRegistry.isRegistered('Image')).toBe(true);
    expect(stackwrightRegistry.isRegistered('Link')).toBe(true);
    expect(stackwrightRegistry.isRegistered('Router')).toBe(true);
    expect(stackwrightRegistry.isRegistered('Route')).toBe(true);
  });

  it('registered Image is the NextStackwrightImage component', () => {
    registerNextJSComponents();

    const RegisteredImage = stackwrightRegistry.get('Image');
    expect(RegisteredImage).toBe(NextStackwrightImage);
  });

  it('registered Link is the NextStackwrightLink component', () => {
    registerNextJSComponents();

    const RegisteredLink = stackwrightRegistry.get('Link');
    expect(RegisteredLink).toBe(NextStackwrightLink);
  });

  it('getAll returns all components after registration', () => {
    registerNextJSComponents();

    const all = stackwrightRegistry.getAll();
    expect(all.Image).toBe(NextStackwrightImage);
    expect(all.Link).toBe(NextStackwrightLink);
    expect(all.Router).toBe(NextStackwrightRouter);
    expect(all.Route).toBe(NextStackwrightRoute);
  });
});
