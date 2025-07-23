import {  Box } from '@mui/material';
import TopAppBar from './TopAppBar';
import { PageContent } from '../../types/content';
import { SiteConfig } from '../../types/siteConfig';
import BottomAppBar from './BottomAppBar';
import { renderContent } from '../../utils/contentRenderer';
import { useSafeTheme } from '../../hooks/useSafeTheme';
import { defaultSiteConfig } from '../../config/siteDefaults';
import { log } from 'console';

const styles = {
  contentContainer: {
    minHeight: 'calc(100vh - 200px)', // Ensure content takes up space
  },
  lastContentWrapper: {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -64,
      left: 0,
      right: 0,
      height: '200vh',
      backgroundColor: 'inherit',
      zIndex: 0,
    }
  }
};

interface PageLayoutProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
}

export default function PageLayout({ pageContent, siteConfig }: PageLayoutProps) {
    const theme = useSafeTheme();
    
    const config = siteConfig || defaultSiteConfig;
    
    // Check if background image is set - if so, use transparent backgrounds
    const hasBackgroundImage = siteConfig?.customTheme?.backgroundImage?.url;
    const backgroundColor = hasBackgroundImage ? 'transparent' : theme.colors.background;

    return (
        <Box sx={{ 
          position: 'relative',
          minHeight: '100vh',
          backgroundColor: backgroundColor,
          color: theme.colors.text
        }}>
          <TopAppBar 
            title={config.appBar.titleText}
            logo={config.appBar.logo}
            menuItems={config.navigation}
            textcolor={config.appBar.textColor}
            backgroundcolor={config.appBar.backgroundColor}
          />
          
          <Box component="main" sx={{ 
            ...styles.contentContainer, 
            backgroundColor: backgroundColor
          }}>
            {renderContent(pageContent)}
          </Box>
          
          <BottomAppBar footer={config.footer} />
        </Box>
    );
}