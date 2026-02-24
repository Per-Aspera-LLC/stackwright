import { ButtonContent } from './base';
import { MediaItem } from './media';

export interface MenuContent extends ButtonContent {
    menu_items?: MenuContent[]
}

export interface MenuTheme {
    colors: {
        default: MenuColorSet
        contained: MenuColorSet
        outlined: MenuColorSet
    }
}

interface MenuColorSet {
    background: string
    text: string
    hover: string
    border?: string
}

export interface NavigationItem {
    label: string;
    href: string;
}

export interface AppBarContent {
  title: string;
  logo?: MediaItem;
  menuItems?: NavigationItem[];
  textcolor?: string;
  backgroundcolor?: string;
  height?: string | number;
}