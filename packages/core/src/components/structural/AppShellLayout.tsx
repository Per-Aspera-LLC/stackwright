import React from 'react';
import { PageContent, SiteConfig } from '@stackwright/types';
import TopAppBar from './TopAppBar';
import BottomAppBar from './BottomAppBar';
import NavSidebar from './NavSidebar';
import { SearchModal } from './SearchModal';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { defaultSiteConfig } from '../../config/siteDefaults';
import { resolveSidebarConfig } from '../../utils/resolveSidebar';

export interface AppShellLayoutProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
  /**
   * Optional navigation handler forwarded to SearchModal.
   * When omitted, SearchModal falls back to `window.location.href`.
   */
  onNavigate?: (path: string) => void;
}

// ---------------------------------------------------------------------------
//  AppShellLayout Debug Logger
// ---------------------------------------------------------------------------

const DEBUG = false;
function shellLog(...args: unknown[]) {
  if (DEBUG) console.log(' AppShellLayout:', ...args);
}

/**
 * App-shell layout: fixed chrome (TopAppBar + NavSidebar), independently
 * scrolling content viewport. The entire page is locked to `100vh`; only
 * the main content column overflows vertically.
 *
 * Key CSS differences from PageLayout:
 * - Root: `height: 100vh, overflow: hidden` (no whole-page scroll)
 * - Body row: `overflow: hidden` so children own their own scroll axes
 * - Sidebar: lives below the header in a flex row — no topOffset needed
 * - Content column: `overflowY: auto, flex: 1, minWidth: 0`
 */
export default function AppShellLayout({
  pageContent,
  siteConfig,
  onNavigate,
}: AppShellLayoutProps) {
  const theme = useSafeTheme();
  const config = siteConfig || defaultSiteConfig;
  const backgroundColor = theme.colors.background;

  // Resolve sidebar: page-level override > site-level default
  const resolvedSidebar = resolveSidebarConfig(pageContent.content.navSidebar, config.sidebar);

  shellLog('Render', { hasSidebar: !!resolvedSidebar });

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor,
        color: theme.colors.text,
      }}
    >
      {/* Skip-to-content link — accessibility */}
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

      {/* TopAppBar: sticky chrome, flex-shrink: 0 */}
      <TopAppBar
        title={config.appBar.titleText}
        logo={config.appBar.logo}
        menuItems={config.navigation}
        textcolor={config.appBar.textColor}
        backgroundcolor={config.appBar.backgroundColor}
        colorModeToggle={config.appBar.colorModeToggle}
      />

      {/* Body row: fills remaining height; overflow hidden so children own scroll */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar: scrolls independently — no topOffset needed (lives below header) */}
        {resolvedSidebar && (
          <NavSidebar
            navigationItems={resolvedSidebar.navigation ?? []}
            collapsed={resolvedSidebar.collapsed}
            width={resolvedSidebar.width}
            mobileBreakpoint={resolvedSidebar.mobileBreakpoint}
            backgroundColor={resolvedSidebar.backgroundColor}
            textColor={resolvedSidebar.textColor}
          />
        )}

        {/* Content + footer column: this is the only scrolling region */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
          }}
        >
          <main id="main-content" tabIndex={-1} style={{ flex: 1, backgroundColor }}>
            {renderContent(pageContent, { contentItemsOnly: true })}
          </main>
          <BottomAppBar footer={config.footer} />
        </div>
      </div>

      {/* Search Modal — Cmd+K */}
      <SearchModal
        placeholder={config.search?.placeholder}
        shortcut={config.search?.shortcut}
        onNavigate={onNavigate}
      />
    </div>
  );
}
