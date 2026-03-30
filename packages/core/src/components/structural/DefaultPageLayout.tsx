import React from 'react';
import { PageContent } from '@stackwright/types';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import NavSidebar from './NavSidebar';

// This is now a simple wrapper - consider deprecating in favor of PageLayout
export default function DefaultPageLayout(pageContent: PageContent) {
  const theme = useSafeTheme();
  const siteConfig = useSiteConfig();
  const sidebarConfig = siteConfig?.sidebar;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarConfig && (
        <NavSidebar
          navigationItems={sidebarConfig.navigation}
          collapsed={sidebarConfig.collapsed}
          width={sidebarConfig.width}
          mobileBreakpoint={sidebarConfig.mobileBreakpoint}
          backgroundColor={sidebarConfig.backgroundColor}
          textColor={sidebarConfig.textColor}
        />
      )}
      <main
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
