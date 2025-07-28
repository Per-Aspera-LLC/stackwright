
import { NavigationItem } from './navigation';
import { ButtonContent } from './base';
import { Theme } from '@stackwright/themes';

export interface SiteConfig {
  title: string;
  themeName?: string;
  customTheme?: Theme;
  navigation: NavigationItem[];
  appBar: AppBarConfig,
  footer?: FooterConfig;
  breakpoints?: BreakpointsConfig;
}

export interface AppBarConfig {
  titleText: string,
  backgroundColor?: string,
  textColor?: string,
  logo?: {
    image: string;
    width?: number;
    height?: number;
  };
}

export interface BreakpointsConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface FooterConfig {
  copyright?: string;
  links?: NavigationItem[];
  socialLinks?: ButtonContent[];
  socialText?: string;
}