import React from 'react';
import { PageContent, SiteConfig } from '@stackwright/types';
import PageLayout from './structural/PageLayout';
import { ThemeProvider, ThemeLoader, ThemeStyleInjector } from '@stackwright/themes';
import { useDevContentReload } from '../hooks/useDevContentReload';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DynamicPageErrorBoundary extends React.Component<
  React.PropsWithChildren<{ pageName?: string }>,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Stackwright] DynamicPage render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '32px',
            margin: '16px',
            border: '1px solid #d32f2f',
            borderRadius: '4px',
            backgroundColor: '#fce4ec',
            color: '#b71c1c',
          }}
        >
          <strong style={{ display: 'block', marginBottom: '8px' }}>Page render error</strong>
          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {this.state.error?.message ?? 'Unknown error'}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// CSS keyframes for background animations — injected once via <style> tag
const ANIMATION_STYLES = `
@keyframes sf-shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}
@keyframes sf-drift {
  0% { background-position-y: 0px; }
  100% { background-position-y: 100px; }
}
@keyframes sf-float {
  0%, 100% { background-position-y: 0px; }
  50% { background-position-y: 20px; }
}
`;

interface DynamicPageProps {
  pageContent: PageContent;
  siteConfig?: SiteConfig;
  slug?: string;
}

export default function DynamicPage({ pageContent, siteConfig, slug }: DynamicPageProps) {
  useDevContentReload();

  const themeName = siteConfig?.themeName || 'corporate';
  let theme;

  try {
    if (siteConfig?.customTheme) {
      theme = ThemeLoader.loadCustomTheme(siteConfig.customTheme);
    } else {
      theme = ThemeLoader.loadThemeFromFile(themeName);
    }
  } catch (error) {
    console.warn(`Failed to load theme '${themeName}', falling back to corporate theme:`, error);
    theme = ThemeLoader.loadThemeFromFile('corporate');
  }

  // Build background image styles
  const backgroundImageStyles: React.CSSProperties = siteConfig?.customTheme?.backgroundImage
    ? {
        backgroundImage: `url(${siteConfig.customTheme.backgroundImage.url})`,
        backgroundRepeat: siteConfig.customTheme.backgroundImage.repeat || 'repeat',
        backgroundSize: siteConfig.customTheme.backgroundImage.scale
          ? `${siteConfig.customTheme.backgroundImage.scale * 100}%`
          : siteConfig.customTheme.backgroundImage.size || 'auto',
        backgroundPosition: siteConfig.customTheme.backgroundImage.position || 'top left',
        backgroundAttachment: siteConfig.customTheme.backgroundImage.attachment || 'scroll',
      }
    : {};

  const showShimmer =
    siteConfig?.customTheme?.backgroundImage?.animation === 'shimmer' ||
    siteConfig?.customTheme?.backgroundImage?.animation === 'shimmer-float';

  const getDriftFloatAnimation = (): string | undefined => {
    const bgImg = siteConfig?.customTheme?.backgroundImage;
    if (!bgImg?.animation || bgImg.animation === 'shimmer') return undefined;

    switch (bgImg.animation) {
      case 'drift':
        return 'sf-drift 60s linear infinite';
      case 'float':
      case 'shimmer-float':
        return 'sf-float 8s ease-in-out infinite';
      default:
        return undefined;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <ThemeStyleInjector theme={theme}>
        <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
        <div
          style={{
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: theme.typography?.fontFamily?.primary || 'sans-serif',
            ...backgroundImageStyles,
            animation: getDriftFloatAnimation(),
          }}
        >
          {showShimmer && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'sf-shimmer 2s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
          <DynamicPageErrorBoundary pageName={slug}>
            <PageLayout pageContent={pageContent} siteConfig={siteConfig} />
          </DynamicPageErrorBoundary>
        </div>
      </ThemeStyleInjector>
    </ThemeProvider>
  );
}
