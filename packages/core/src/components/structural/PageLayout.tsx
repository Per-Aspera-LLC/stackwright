import React, { useRef, useState, useEffect } from 'react';
import TopAppBar from './TopAppBar';
import { PageContent, SiteConfig } from '@stackwright/types';
import BottomAppBar from './BottomAppBar';
import NavSidebar from './NavSidebar';
import { SearchModal } from './SearchModal';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { defaultSiteConfig } from '../../config/siteDefaults';
import { resolveSidebarConfig } from '../../utils/resolveSidebar';

interface PageLayoutProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
  /**
   * Optional navigation handler forwarded to SearchModal.
   * When omitted, SearchModal falls back to `window.location.href`.
   * Next.js apps should pass `router.push` here via `NextPageLayout`
   * from `@stackwright/nextjs`.
   */
  onNavigate?: (path: string) => void;
}

export default function PageLayout({ pageContent, siteConfig, onNavigate }: PageLayoutProps) {
  const theme = useSafeTheme();
  const config = siteConfig || defaultSiteConfig;
  const backgroundColor = theme.colors.background;

  const layoutRef = useRef<HTMLDivElement>(null);
  const [topBarHeight, setTopBarHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !layoutRef.current) return;
    const header = layoutRef.current.querySelector('header');
    if (!header) return;
    const ro = new ResizeObserver(([entry]) => {
      setTopBarHeight(entry.contentRect.height);
    });
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Resolve sidebar: page-level override > site-level default
  const resolvedSidebar = resolveSidebarConfig(pageContent.content.navSidebar, config.sidebar);

  return (
    <div
      ref={layoutRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor,
        color: theme.colors.text,
      }}
    >
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          zIndex: 9999,
        }}
        onFocus={(e) => {
          Object.assign(e.currentTarget.style, {
            left: '50%',
            transform: 'translateX(-50%)',
            top: '1rem',
            width: 'auto',
            height: 'auto',
            overflow: 'visible',
            padding: '0.5rem 1.25rem',
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          });
        }}
        onBlur={(e) => {
          Object.assign(e.currentTarget.style, {
            left: '-9999px',
            top: 'auto',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            transform: '',
            padding: '',
            backgroundColor: '',
            color: '',
            borderRadius: '',
            fontWeight: '',
            fontSize: '',
          });
        }}
      >
        Skip to main content
      </a>
      <TopAppBar
        title={config.appBar.titleText}
        logo={config.appBar.logo}
        menuItems={config.navigation}
        textcolor={config.appBar.textColor}
        backgroundcolor={config.appBar.backgroundColor}
        colorModeToggle={config.appBar.colorModeToggle}
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {resolvedSidebar && (
          <NavSidebar
            navigationItems={resolvedSidebar.navigation}
            collapsed={resolvedSidebar.collapsed}
            width={resolvedSidebar.width}
            mobileBreakpoint={resolvedSidebar.mobileBreakpoint}
            backgroundColor={resolvedSidebar.backgroundColor}
            textColor={resolvedSidebar.textColor}
            topOffset={topBarHeight}
          />
        )}

        {/* Content column: main grows to fill space, footer sits at the bottom */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <main id="main-content" style={{ flex: 1, backgroundColor }}>
            {renderContent(pageContent, { contentItemsOnly: true })}
          </main>

          <BottomAppBar footer={config.footer} />
        </div>
      </div>

      {/* Search Modal - Cmd+K to open */}
      {/* onNavigate: Next.js apps override this via StackwrightLayout in @stackwright/nextjs */}
      <SearchModal
        placeholder={config.search?.placeholder}
        shortcut={config.search?.shortcut}
        onNavigate={onNavigate}
      />
    </div>
  );
}
