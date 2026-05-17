import React from 'react';
import TopAppBar from './TopAppBar';
import { PageContent, SiteConfig, PageSidebar } from '@stackwright/types';
import BottomAppBar from './BottomAppBar';
import NavSidebar from './NavSidebar';
import { SearchModal } from './SearchModal';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { defaultSiteConfig } from '../../config/siteDefaults';

interface PageLayoutProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
}

/**
 * Resolves the effective sidebar config for a page.
 *
 * Resolution order (highest wins):
 *  1. Page-level `navSidebar` in content.yml (explicit override)
 *  2. Site-level `sidebar` in stackwright.yml (default)
 *  3. undefined (no sidebar)
 *
 * Special case: `navSidebar: null` in page content always hides the sidebar,
 * even when the site config has a sidebar. This lets dashboard / full-bleed
 * pages opt out without removing the sidebar from the theme.
 */
function resolveSidebarConfig(
  pageSidebar: PageSidebar,
  siteSidebar: SiteConfig['sidebar']
): SiteConfig['sidebar'] | undefined {
  // null means "hide sidebar on this page" — explicit override wins
  if (pageSidebar === null) {
    return undefined;
  }

  // undefined means "use site config" (no override)
  if (pageSidebar === undefined) {
    return siteSidebar;
  }

  // Partial override — merge page values over site defaults
  if (siteSidebar) {
    return {
      navigation: pageSidebar.navigation ?? siteSidebar.navigation,
      collapsed: pageSidebar.collapsed ?? siteSidebar.collapsed,
      width: pageSidebar.width ?? siteSidebar.width,
      mobileBreakpoint: pageSidebar.mobileBreakpoint ?? siteSidebar.mobileBreakpoint,
      backgroundColor: pageSidebar.backgroundColor ?? siteSidebar.backgroundColor,
      textColor: pageSidebar.textColor ?? siteSidebar.textColor,
    };
  }

  // Site has no sidebar, but page provides values — build a sidebar from page config
  if (pageSidebar.navigation) {
    return {
      navigation: pageSidebar.navigation,
      collapsed: pageSidebar.collapsed ?? false,
      width: pageSidebar.width ?? 240,
      mobileBreakpoint: pageSidebar.mobileBreakpoint ?? 768,
      backgroundColor: pageSidebar.backgroundColor,
      textColor: pageSidebar.textColor,
    };
  }

  return undefined;
}

export default function PageLayout({ pageContent, siteConfig }: PageLayoutProps) {
  const theme = useSafeTheme();
  const config = siteConfig || defaultSiteConfig;
  const backgroundColor = theme.colors.background;

  // Resolve sidebar: page-level override > site-level default
  const resolvedSidebar = resolveSidebarConfig(pageContent.content.navSidebar, config.sidebar);

  return (
    <div
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
          />
        )}

        <main id="main-content" style={{ flex: 1, minWidth: 0, backgroundColor }}>
          {renderContent(pageContent, { contentItemsOnly: true })}
        </main>
      </div>

      <BottomAppBar footer={config.footer} />

      {/* Search Modal - Cmd+K to open */}
      <SearchModal placeholder={config.search?.placeholder} shortcut={config.search?.shortcut} />
    </div>
  );
}
