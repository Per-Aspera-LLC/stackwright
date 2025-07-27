export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  backgroundImage?: {
    url: string;
    repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';
    size?: 'auto' | 'cover' | 'contain' | string;
    position?: string;
    attachment?: 'scroll' | 'fixed' | 'local';
    scale?: number;
    animation?: 'drift' | 'float' | 'shimmer' | 'shimmer-float' | 'none';
    customAnimation?: string;
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
    };
    scale: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  components: {
    button: ComponentStyle;
    card: ComponentStyle;
    header: ComponentStyle;
    footer: ComponentStyle;
  };
}

export interface ComponentStyle {
  base?: string;
  primary?: string;
  secondary?: string;
  outline?: string;
  shadow?: string;
  nav?: string;
  text?: string;
  [key: string]: string | undefined;
}

export interface Theme extends ThemeConfig {}