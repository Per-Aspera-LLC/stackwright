import { BrandProfile } from '../types/brief';
import { Theme } from '@stackwright/themes';

/**
 * Generates a custom theme from brand colors and profile
 */
export function generateCustomTheme(brand: BrandProfile): Theme {
  const colors = mapBrandColorsToTheme(brand.colors);
  
  return {
    id: `${brand.name.toLowerCase().replace(/\s+/g, '-')}-custom`,
    name: `${brand.name} Custom`,
    description: `Custom theme for ${brand.name}`,
    colors,
    typography: generateTypographyFromBrand(brand),
    spacing: generateSpacingFromVoice(brand.voice),
    components: generateComponentsFromColors(colors)
  };
}

/**
 * Maps brand colors to theme color structure
 */
function mapBrandColorsToTheme(brandColors: BrandProfile['colors']) {
  // Find colors by usage or name
  const primary = findColorByUsageOrName(brandColors, ['primary', 'main', 'brand']);
  const secondary = findColorByUsageOrName(brandColors, ['secondary', 'steel', 'neutral']);
  const accent = findColorByUsageOrName(brandColors, ['accent', 'gold', 'highlight', 'warm']);
  const background = findColorByUsageOrName(brandColors, ['background', 'light', 'white']);
  const text = findColorByUsageOrName(brandColors, ['text', 'gray', 'ash', 'foreground']);
  
  // Generate intelligent color scheme
  return {
    primary: primary?.hex || '#2563eb',
    secondary: secondary?.hex || adjustColor(primary?.hex || '#2563eb', { lightness: 20 }),
    accent: accent?.hex || adjustColor(primary?.hex || '#2563eb', { hue: 30 }),
    background: background?.hex || '#ffffff',
    surface: background?.hex || adjustColor('#ffffff', { lightness: -3 }),
    text: text?.hex || '#1f2937',
    textSecondary: text?.hex || adjustColor('#1f2937', { lightness: 20 })
  };
}

/**
 * Finds color by usage type or name patterns
 */
function findColorByUsageOrName(
  colors: BrandProfile['colors'], 
  patterns: string[]
): { hex: string } | undefined {
  for (const pattern of patterns) {
    // Check usage first
    const byUsage = colors.find(color => 
      color.usage?.toLowerCase().includes(pattern)
    );
    if (byUsage) return byUsage;
    
    // Check name second
    const byName = colors.find(color => 
      color.name?.toLowerCase().includes(pattern)
    );
    if (byName) return byName;
  }
  
  return undefined;
}

/**
 * Generates typography based on brand fonts and voice
 */
function generateTypographyFromBrand(brand: BrandProfile) {
  const primaryFont = brand.fonts?.find(f => f.usage === 'primary')?.name || 'Inter';
  const headingFont = brand.fonts?.find(f => f.usage === 'heading' || f.usage === 'titles')?.name || primaryFont;
  
  // Adjust scale based on voice
  const isElegant = brand.voice?.toLowerCase().includes('elegant') || 
                   brand.voice?.toLowerCase().includes('sophisticated');
  const isBold = brand.voice?.toLowerCase().includes('bold') || 
                brand.voice?.toLowerCase().includes('strong');
  
  return {
    fontFamily: {
      primary: primaryFont,
      secondary: headingFont
    },
    scale: {
      xs: isElegant ? '0.8rem' : '0.75rem',
      sm: isElegant ? '0.9rem' : '0.875rem', 
      base: '1rem',
      lg: isElegant ? '1.15rem' : '1.125rem',
      xl: isElegant ? '1.3rem' : '1.25rem',
      '2xl': isBold ? '1.6rem' : '1.5rem',
      '3xl': isBold ? '2rem' : '1.875rem'
    }
  };
}

/**
 * Generates spacing based on brand voice
 */
function generateSpacingFromVoice(voice?: string) {
  const isMinimal = voice?.toLowerCase().includes('minimal') || 
                   voice?.toLowerCase().includes('clean');
  const isLuxury = voice?.toLowerCase().includes('luxury') || 
                  voice?.toLowerCase().includes('premium');
  
  if (isMinimal) {
    return {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    };
  }
  
  if (isLuxury) {
    return {
      xs: '0.75rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2.5rem',
      xl: '4rem',
      '2xl': '6rem'
    };
  }
  
  // Default spacing
  return {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  };
}

/**
 * Generates component styles based on colors
 */
function generateComponentsFromColors(colors: any) {
  return {
    button: {
      base: 'px-4 py-2 rounded-md font-medium transition-colors',
      primary: `bg-[${colors.primary}] text-white hover:opacity-90`,
      secondary: `border border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`,
      outline: `border border-[${colors.primary}] text-[${colors.primary}] bg-transparent hover:bg-[${colors.primary}] hover:text-white`
    },
    card: {
      base: 'rounded-lg shadow-sm',
      primary: `bg-[${colors.surface}] border border-gray-200`,
      secondary: `bg-white border border-[${colors.primary}]`
    },
    header: {
      background: colors.background,
      text: colors.text,
      border: `border-b border-[${colors.primary}]`
    },
    footer: {
      background: colors.surface,
      text: colors.textSecondary
    }
  };
}

/**
 * Adjusts a hex color by HSL properties
 */
function adjustColor(hex: string, adjustments: { hue?: number, saturation?: number, lightness?: number }): string {
  const hsl = hexToHsl(hex);
  
  if (adjustments.hue !== undefined) {
    hsl.h = (hsl.h + adjustments.hue) % 360;
  }
  if (adjustments.saturation !== undefined) {
    hsl.s = Math.max(0, Math.min(100, hsl.s + adjustments.saturation));
  }
  if (adjustments.lightness !== undefined) {
    hsl.l = Math.max(0, Math.min(100, hsl.l + adjustments.lightness));
  }
  
  return hslToHex(hsl);
}

/**
 * Converts hex color to HSL
 */
function hexToHsl(hex: string): {h: number, s: number, l: number} {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  const l = (max + min) / 2;
  
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }
  
  let h = 0;
  if (diff !== 0) {
    switch (max) {
      case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / diff + 2) / 6; break;
      case b: h = ((r - g) / diff + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Converts HSL color to hex
 */
function hslToHex({h, s, l}: {h: number, s: number, l: number}): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Checks if brand has sufficient colors for custom theme
 */
export function shouldUseCustomTheme(brand: BrandProfile): boolean {
  return !!(brand.colors && brand.colors.length >= 2);
}

/**
 * Explains why custom theme was created
 */
export function explainCustomTheme(brand: BrandProfile): string {
  const colorCount = brand.colors?.length || 0;
  const colorNames = brand.colors?.map(c => `${c.name} (${c.hex})`).join(', ') || 'none';
  
  return [
    `Brand provided ${colorCount} custom colors: ${colorNames}`,
    `Generated custom theme using brand's exact color palette`,
    `Theme name: "${brand.name} Custom"`,
    `Primary color: ${brand.colors?.[0]?.hex || 'default'}`
  ].join('\n  ');
}
