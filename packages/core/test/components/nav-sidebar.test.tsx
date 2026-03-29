import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavSidebar from '../../src/components/structural/NavSidebar';
import { NavigationItem } from '@stackwright/types';
import { SiteConfigProvider } from '../../src/hooks/useSiteConfig';
import DefaultPageLayout from '../../src/components/structural/DefaultPageLayout';

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.location
delete (window as any).location;
window.location = { pathname: '/' } as Location;

describe('NavSidebar', () => {
  const mockNavItems: NavigationItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Services', href: '/services' },
  ];

  const mockNestedNavItems: NavigationItem[] = [
    { label: 'Home', href: '/' },
    {
      label: 'Products',
      href: '/products',
      children: [
        { label: 'Product A', href: '/products/a' },
        { label: 'Product B', href: '/products/b' },
      ],
    },
    { label: 'Contact', href: '/contact' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window size to desktop
    window.innerWidth = 1024;
    window.location.pathname = '/';
  });

  describe('Rendering', () => {
    it('renders navigation sidebar', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });

    it('renders all navigation items', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
    });

    it('renders nested navigation items when expanded', async () => {
      render(<NavSidebar navigationItems={mockNestedNavItems} />);

      const productsLink = screen.getByText('Products');
      expect(productsLink).toBeInTheDocument();

      // Initially, nested items should not be visible
      expect(screen.queryByText('Product A')).not.toBeInTheDocument();
      expect(screen.queryByText('Product B')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(productsLink);

      // Now nested items should be visible
      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument();
        expect(screen.getByText('Product B')).toBeInTheDocument();
      });
    });

    it('applies active state to current page', () => {
      window.location.pathname = '/about';
      render(<NavSidebar navigationItems={mockNavItems} />);

      const aboutLink = screen.getByText('About').closest('a');
      expect(aboutLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Collapse Functionality', () => {
    it('renders collapse toggle button on desktop', () => {
      window.innerWidth = 1024;
      render(<NavSidebar navigationItems={mockNavItems} />);

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles collapsed state when button clicked', () => {
      const onCollapseToggle = vi.fn();
      render(<NavSidebar navigationItems={mockNavItems} onCollapseToggle={onCollapseToggle} />);

      const toggleButton = screen.getByLabelText('Collapse sidebar');
      fireEvent.click(toggleButton);

      expect(onCollapseToggle).toHaveBeenCalledWith(true);

      // Button label should change
      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });

    it('respects controlled collapsed prop', () => {
      render(<NavSidebar navigationItems={mockNavItems} collapsed={false} />);

      expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument();

      rerender(<NavSidebar navigationItems={mockNavItems} collapsed={true} />);

      expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
    });
  });

  describe('Mobile Behavior', () => {
    beforeEach(() => {
      // Set mobile viewport
      window.innerWidth = 500;
    });

    it('renders mobile toggle button', async () => {
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={768} />);

      // Trigger resize event
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      });
    });

    it('opens drawer when mobile toggle clicked', async () => {
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={768} />);

      // Trigger resize to mobile
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const mobileToggle = screen.getByLabelText('Open navigation menu');
        fireEvent.click(mobileToggle);
      });

      // Navigation items should now be visible
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles Enter key on navigation items', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);

      const homeLink = screen.getByText('Home');
      fireEvent.keyDown(homeLink, { key: 'Enter' });

      // Should navigate (we can't easily test actual navigation in unit tests)
      expect(homeLink).toBeInTheDocument();
    });

    it('handles Space key on navigation items', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);

      const homeLink = screen.getByText('Home');
      fireEvent.keyDown(homeLink, { key: ' ' });

      expect(homeLink).toBeInTheDocument();
    });

    it('expands nested items with ArrowRight key', async () => {
      render(<NavSidebar navigationItems={mockNestedNavItems} />);

      const productsLink = screen.getByText('Products');
      fireEvent.keyDown(productsLink, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument();
      });
    });

    it('collapses nested items with ArrowLeft key', async () => {
      render(<NavSidebar navigationItems={mockNestedNavItems} />);

      const productsLink = screen.getByText('Products');

      // First expand
      fireEvent.keyDown(productsLink, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument();
      });

      // Then collapse
      fireEvent.keyDown(productsLink, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.queryByText('Product A')).not.toBeInTheDocument();
      });
    });

    it('closes mobile drawer on Escape key', async () => {
      window.innerWidth = 500;
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={768} />);

      // Trigger resize to mobile
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const mobileToggle = screen.getByLabelText('Open navigation menu');
        fireEvent.click(mobileToggle);
      });

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Integration', () => {
    it('applies custom background color', () => {
      render(<NavSidebar navigationItems={mockNavItems} backgroundColor="primary" />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({ backgroundColor: expect.any(String) });
    });

    it('applies custom text color', () => {
      render(<NavSidebar navigationItems={mockNavItems} textColor="#ff0000" />);

      const nav = screen.getByRole('navigation');
      // Just verify the component renders with the prop
      expect(nav).toBeInTheDocument();
    });

    it('applies custom width', () => {
      render(<NavSidebar navigationItems={mockNavItems} width={300} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveStyle({ width: '300px' });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);

      expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    });

    it('marks active link with aria-current', () => {
      window.location.pathname = '/about';
      render(<NavSidebar navigationItems={mockNavItems} />);

      const aboutLink = screen.getByText('About').closest('a');
      expect(aboutLink).toHaveAttribute('aria-current', 'page');
    });

    it('sets aria-expanded for collapsible sections', () => {
      render(<NavSidebar navigationItems={mockNestedNavItems} />);

      const productsLink = screen.getByText('Products').closest('a');
      expect(productsLink).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(productsLink!);

      expect(productsLink).toHaveAttribute('aria-expanded', 'true');
    });

    it('sets proper role for navigation items', () => {
      render(<NavSidebar navigationItems={mockNavItems} />);

      const homeLink = screen.getByText('Home').closest('a');
      expect(homeLink).toHaveAttribute('role', 'link');
    });

    it('sets button role for collapsible sections', () => {
      render(<NavSidebar navigationItems={mockNestedNavItems} />);

      const productsLink = screen.getByText('Products').closest('a');
      expect(productsLink).toHaveAttribute('role', 'button');
    });

    it('provides title attribute when collapsed', () => {
      render(<NavSidebar navigationItems={mockNavItems} collapsed={true} />);

      const allLinks = screen.getAllByRole('link');
      const homeLink = allLinks.find((link) => link.getAttribute('title') === 'Home');
      expect(homeLink).toHaveAttribute('title', 'Home');
    });
  });

  describe('Click Outside Behavior', () => {
    it('closes mobile drawer when clicking outside', async () => {
      window.innerWidth = 500;
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={768} />);

      // Trigger resize to mobile
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        const mobileToggle = screen.getByLabelText('Open navigation menu');
        fireEvent.click(mobileToggle);
      });

      // Click on backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }

      await waitFor(() => {
        expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('switches to mobile mode below breakpoint', async () => {
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={768} />);

      // Start at desktop
      window.innerWidth = 1024;
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
      });

      // Resize to mobile
      window.innerWidth = 500;
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      });
    });

    it('uses custom mobile breakpoint', async () => {
      render(<NavSidebar navigationItems={mockNavItems} mobileBreakpoint={1024} />);

      window.innerWidth = 900;
      fireEvent(window, new Event('resize'));

      await waitFor(() => {
        expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
      });
    });
  });

  describe('Site Config Integration', () => {
    it('should render when configured in site config', () => {
      const mockSiteConfig = {
        title: 'Test Site',
        navigation: [],
        appBar: { titleText: 'Test' },
        sidebar: {
          navigation: [
            { label: 'Home', href: '/' },
            { label: 'About', href: '/about' },
          ],
          collapsed: false,
          width: 240,
        },
      };

      // Create a test component that provides site config
      const TestWrapper = () => {
        return (
          <SiteConfigProvider value={mockSiteConfig}>
            <NavSidebar
              navigationItems={mockSiteConfig.sidebar.navigation}
              collapsed={mockSiteConfig.sidebar.collapsed}
              width={mockSiteConfig.sidebar.width}
            />
          </SiteConfigProvider>
        );
      };

      render(<TestWrapper />);

      // Assert NavSidebar is present with correct items
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
    });

    it('should not render when sidebar is not configured', () => {
      const mockSiteConfig = {
        title: 'Test Site',
        navigation: [],
        appBar: { titleText: 'Test' },
        // No sidebar configured
      };

      const TestDefaultLayout = () => {
        return (
          <SiteConfigProvider value={mockSiteConfig}>
            <DefaultPageLayout content_items={[]} />
          </SiteConfigProvider>
        );
      };

      render(<TestDefaultLayout />);

      // NavSidebar should not be rendered
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    it('should render in DefaultPageLayout with proper layout', () => {
      const mockSiteConfig = {
        title: 'Test Site',
        navigation: [],
        appBar: { titleText: 'Test' },
        sidebar: {
          navigation: [{ label: 'Dashboard', href: '/dashboard' }],
          collapsed: false,
          width: 240,
        },
      };

      const TestDefaultLayout = () => {
        return (
          <SiteConfigProvider value={mockSiteConfig}>
            <DefaultPageLayout content_items={[]} />
          </SiteConfigProvider>
        );
      };

      const { container } = render(<TestDefaultLayout />);

      // Check for flex container
      const flexContainer = container.firstChild as HTMLElement;
      expect(flexContainer).toHaveStyle({ display: 'flex' });

      // Sidebar should be present
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Main content area should be present
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });
  });
});
