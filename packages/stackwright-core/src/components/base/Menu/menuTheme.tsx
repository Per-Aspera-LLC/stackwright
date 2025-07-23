export interface MenuThemeConfig {
  colors: {
    default: MenuColorSet;
    contained: MenuColorSet;
    outlined: MenuColorSet;
  };
}

interface MenuColorSet {
  background: string;
  text: string;
  hover: string;
  border?: string;
}

const defaultMenuTheme: MenuThemeConfig = {
  colors: {
    default: {
      background: 'white',
      text: 'secondary.main',
      hover: 'whitesmoke'
    },
    contained: {
      background: 'primary.main',
      text: 'primary.contrastText',
      hover: 'primary.dark'
    },
    outlined: {
      background: 'white',
      text: 'primary.main',
      hover: 'primary.light',
      border: 'primary.main'
    }
  }
};
export const createMenuTheme = (contentTheme?: Partial<MenuThemeConfig>) => {
  if (!contentTheme) return defaultMenuTheme;

  return {
    colors: {
      default: { ...defaultMenuTheme.colors.default, ...contentTheme.colors?.default },
      contained: { ...defaultMenuTheme.colors.contained, ...contentTheme.colors?.contained },
      outlined: { ...defaultMenuTheme.colors.outlined, ...contentTheme.colors?.outlined }
    }
  };
};
