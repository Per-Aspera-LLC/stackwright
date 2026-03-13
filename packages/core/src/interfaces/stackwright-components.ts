import { ComponentType, ReactNode } from 'react';

// Base interface for all stackwright components
export interface StackwrightComponentProps {
  key?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Stackwright Image Interface
export interface StackwrightImageProps extends StackwrightComponentProps {
  src: string;
  alt: string;
  aspect_ratio: number;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Stackwright Link Interface
export interface StackwrightLinkProps extends StackwrightComponentProps {
  href: string;
  children: ReactNode;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

// Stackwright Router Interface
export interface StackwrightRouterProps {
  children: ReactNode;
}

export interface StackwrightRouteProps extends StackwrightComponentProps {
  path: string;
  component: ComponentType<any>;
  exact?: boolean;
}

// Stackwright Static Generation Interface - framework agnostic
export interface StackwrightStaticGeneration {
  getStaticPaths: (...args: any[]) => any;
  getStaticProps: (...args: any[]) => any;
}

// Stackwright Head Interface (SEO metadata)
export interface StackwrightHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogSiteName?: string;
  canonical?: string;
  noindex?: boolean;
}

// Platform-specific component implementations
export interface StackwrightComponents {
  Image: ComponentType<StackwrightImageProps>;
  Link: ComponentType<StackwrightLinkProps>;
  Router: ComponentType<StackwrightRouterProps>;
  Route: ComponentType<StackwrightRouteProps>;
  Head?: ComponentType<StackwrightHeadProps>;
}

// Create separate interface for utilities
export interface StackwrightUtilities {
  StaticGeneration: {
    getStaticProps: (...args: any[]) => any;
    getStaticPaths: (...args: any[]) => any;
  };
}

// Registry for stackwright components
export interface StackwrightComponentRegistry {
  register(components: Partial<StackwrightComponents>): void;
  get<K extends keyof StackwrightComponents>(componentName: K): StackwrightComponents[K];
  getAll(): StackwrightComponents;
  isRegistered(componentName: keyof StackwrightComponents): boolean;
}
