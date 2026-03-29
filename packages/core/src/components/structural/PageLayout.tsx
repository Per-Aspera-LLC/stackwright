import React from 'react';
import TopAppBar from './TopAppBar';
import { PageContent } from '@stackwright/types';
import { SiteConfig } from '@stackwright/types';
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

export default function PageLayout({ pageContent, siteConfig }: PageLayoutProps) {
  const theme = useSafeTheme();

  const config = siteConfig || defaultSiteConfig;

  const backgroundColor = theme.colors.background;
  const hasSidebar = !!config.sidebar;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: backgroundColor,
        color: theme.colors.text,
      }}
    >
      <TopAppBar
        title={config.appBar.titleText}
        logo={config.appBar.logo}
        menuItems={config.navigation}
        textcolor={config.appBar.textColor}
        backgroundcolor={config.appBar.backgroundColor}
        colorModeToggle={config.appBar.colorModeToggle}
      />

      <div
        style={{
          display: 'flex',
          flex: 1,
        }}
      >
        {hasSidebar && (
          <NavSidebar
            navigationItems={config.sidebar!.navigation}
            collapsed={config.sidebar!.collapsed}
            width={config.sidebar!.width}
            mobileBreakpoint={config.sidebar!.mobileBreakpoint}
            backgroundColor={config.sidebar!.backgroundColor}
            textColor={config.sidebar!.textColor}
          />
        )}

        <main
          style={{
            flex: 1,
            backgroundColor: backgroundColor,
          }}
        >
          {renderContent(pageContent)}
        </main>
      </div>

      <BottomAppBar footer={config.footer} />

      {/* Search Modal - Cmd+K to open */}
      <SearchModal placeholder={config.search?.placeholder} shortcut={config.search?.shortcut} />
    </div>
  );
}
