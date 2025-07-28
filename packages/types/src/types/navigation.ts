import { ButtonContent } from './base';

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

export interface AppBarLogo {
    image: string
    aspect_ratio: string
}

export interface AppBarContent {
    title: string;
    logo?: {
        image: string;
        width?: number;
        height?: number;
    };
    menuItems?: NavigationItem[]; 
    textcolor?: string
    backgroundcolor?: string
}