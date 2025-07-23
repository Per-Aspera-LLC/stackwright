import { BrandProfile } from '../types/brief';
// Change this line to reference the local theme types
import { ThemeConfig } from '@stackwright/themes';

export interface GeneratedTheme extends ThemeConfig {}

export function convertBrandToTheme(brand: BrandProfile): GeneratedTheme {
  console.log(`🎨 Converting brand "${brand.name}" to theme...`);
  
  const colors = extractColorPalette(brand.colors);
  const typography = extractTypography(brand.fonts, brand.voice);
  const spacing = generateSpacing(brand.voice);
  
  return {
    id: `${brand.name.toLowerCase().replace(/\s+/g, '-')}-theme`,
    name: `${brand.name} Theme`,
    description: `Custom theme for ${brand.name} - ${brand.tagline || brand.voice}`,
    colors,
    typography,
    spacing,
    components: generateComponents(colors, typography, brand.voice)
  };
}

function extractColorPalette(brandColors: BrandProfile['colors']): GeneratedTheme['colors'] {
  // Sort colors by usage priority
  const primary = brandColors.find(c => c.usage.includes('primary'))?.hex || brandColors[0]?.hex || '#2563eb';
  const secondary = brandColors.find(c => c.usage.includes('secondary'))?.hex || brandColors[1]?.hex || '#64748b';
  const accent = brandColors.find(c => c.usage.includes('accent'))?.hex || brandColors[2]?.hex || '#f59e0b';
  
  return {
    primary,
    secondary,
    accent,
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b'
  };
}

function extractTypography(brandFonts: BrandProfile['fonts'], voice: string): GeneratedTheme['typography'] {
  const primaryFont = brandFonts.find(f => f.usage.includes('primary'))?.name || 
                     brandFonts.find(f => f.usage.includes('heading'))?.name ||
                     getVoiceFont(voice, 'primary');
  
  const secondaryFont = brandFonts.find(f => f.usage.includes('secondary'))?.name ||
                       brandFonts.find(f => f.usage.includes('body'))?.name ||
                       getVoiceFont(voice, 'secondary');

  return {
    fontFamily: {
      primary: primaryFont,
      secondary: secondaryFont
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  };
}

function getVoiceFont(voice: string, type: 'primary' | 'secondary'): string {
  const voiceLower = voice.toLowerCase();
  
  if (voiceLower.includes('modern') || voiceLower.includes('tech')) {
    return type === 'primary' ? 'Inter, sans-serif' : 'system-ui, sans-serif';
  }
  
  if (voiceLower.includes('elegant') || voiceLower.includes('luxury')) {
    return type === 'primary' ? 'Playfair Display, serif' : 'Source Sans Pro, sans-serif';
  }
  
  if (voiceLower.includes('friendly') || voiceLower.includes('approachable')) {
    return type === 'primary' ? 'Nunito, sans-serif' : 'Open Sans, sans-serif';
  }
  
  // Default professional
  return type === 'primary' ? 'Inter, sans-serif' : 'system-ui, sans-serif';
}

function generateSpacing(voice: string): GeneratedTheme['spacing'] {
  const voiceLower = voice.toLowerCase();
  
  // Tighter spacing for modern/tech
  if (voiceLower.includes('modern') || voiceLower.includes('tech')) {
    return {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem'
    };
  }
  
  // Looser spacing for luxury/elegant
  if (voiceLower.includes('luxury') || voiceLower.includes('elegant')) {
    return {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2.5rem',
      xl: '4rem',
      '2xl': '6rem'
    };
  }
  
  // Default balanced spacing
  return {
    xs: '0.25rem',
    sm: '0.75rem',
    md: '1.25rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem'
  };
}

function generateComponents(colors: GeneratedTheme['colors'], typography: GeneratedTheme['typography'], voice: string): GeneratedTheme['components'] {
  const voiceLower = voice.toLowerCase();
  
  const buttonStyle = voiceLower.includes('modern') ? 'rounded-lg' : 
                     voiceLower.includes('elegant') ? 'rounded-none' : 'rounded-md';
  
  return {
    button: {
      base: `px-4 py-2 font-medium transition-colors ${buttonStyle}`,
      primary: `bg-[${colors.primary}] text-white hover:opacity-90`,
      secondary: `bg-[${colors.secondary}] text-white hover:opacity-90`,
      outline: `border-2 border-[${colors.primary}] text-[${colors.primary}] hover:bg-[${colors.primary}] hover:text-white`
    },
    card: {
      base: `bg-[${colors.surface}] border border-gray-200 ${buttonStyle} p-6`,
      shadow: 'shadow-sm hover:shadow-md transition-shadow'
    },
    header: {
      base: `bg-[${colors.background}] border-b border-gray-200`,
      nav: `text-[${colors.text}] hover:text-[${colors.primary}]`
    },
    footer: {
      base: `bg-[${colors.secondary}] text-white`,
      text: 'text-gray-300'
    }
  };
}