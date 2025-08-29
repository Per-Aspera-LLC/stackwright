import { NavigationItem } from './navigation';
import { ButtonContent } from './base';
import { MediaItem } from './media';
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
  logo?: MediaItem,
  height?: string,
  menuItems?: NavigationItem[]
}


export interface BreakpointsConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface FooterConfig {
  backgroundColor?: string;
  textColor?: string;
  copyright?: string;
  itemsPerColumn?: number;
  links?: NavigationItem[];
  socialLinks?: ButtonContent[];
  socialText?: string;
}

