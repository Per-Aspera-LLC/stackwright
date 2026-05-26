import React from 'react';
import { PageContent } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import NavSidebar from './NavSidebar';
import { resolveSidebarConfig } from '../../utils/resolveSidebar';

/**
 * @deprecated Use {@link PageLayout} instead. DefaultPageLayout is a minimal wrapper
 * that does not include TopAppBar, BottomAppBar, or SearchModal. It will be removed
 * in a future major version.
 */
export default function DefaultPageLayout(pageContent: PageContent) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '[Stackwright] DefaultPageLayout is deprecated. Use PageLayout instead. ' +
        'See: https://github.com/Per-Aspera-LLC/stackwright'
    );
  }

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
