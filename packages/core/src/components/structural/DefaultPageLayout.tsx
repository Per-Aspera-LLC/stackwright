import React from 'react';
import { PageContent, SiteConfig } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import NavSidebar from './NavSidebar';

// This is now a simple wrapper - consider deprecating in favor of PageLayout

/**
 * Reuses the same sidebar resolution logic as PageLayout so that
 * DefaultPageLayout consumers also get page-level navSidebar overrides.
 */
function resolveSidebarConfig(
  pageSidebar: PageContent['content']['navSidebar'],
  siteSidebar: SiteConfig['sidebar']
): SiteConfig['sidebar'] | undefined {
  if (pageSidebar === null) return undefined;
  if (pageSidebar === undefined) return siteSidebar;

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

export default function DefaultPageLayout(pageContent: PageContent) {
  const theme = useSafeTheme();
  const siteConfig = useSiteConfig();

  const resolvedSidebar = resolveSidebarConfig(
    pageContent?.content?.navSidebar,
    siteConfig?.sidebar
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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
      <main
        id="main-content"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing.lg,
          }}
        >
          <div>{renderContent(pageContent)}</div>
        </div>
      </main>
    </div>
  );
}
