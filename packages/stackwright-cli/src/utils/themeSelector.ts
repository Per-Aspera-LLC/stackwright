import { BrandProfile } from '../types/brief';

/**
 * Analyzes brand colors and voice to select the most appropriate  Stackwright theme
 */
export function selectThemeFromBrand(brand: BrandProfile): string {
  // If no colors provided, use voice-based selection
  if (!brand.colors || brand.colors.length === 0) {
    return selectThemeFromVoice(brand.voice);
  }

  const primaryColor = brand.colors[0]?.hex;
  if (!primaryColor) {
    return selectThemeFromVoice(brand.voice);
  }

  // Convert hex to HSL for better color analysis
  const hsl = hexToHsl(primaryColor);
  
  // Analyze color characteristics
  const colorProfile = analyzeColor(hsl, brand.voice);
  
  return selectThemeFromColorProfile(colorProfile);
}

/**
 * Selects theme based on brand voice when colors aren't available
 */
function selectThemeFromVoice(voice?: string): string {
  if (!voice) return 'corporate';
  
  const voiceLower = voice.toLowerCase();
  
  // Soft theme indicators
  const softIndicators = [
    'friendly', 'approachable', 'warm', 'caring', 'nurturing',
    'gentle', 'soft', 'creative', 'artistic', 'elegant',
    'sophisticated', 'lifestyle', 'wellness', 'beauty'
  ];
  
  // Corporate theme indicators  
  const corporateIndicators = [
    'professional', 'strategic', 'authoritative', 'confident',
    'reliable', 'trustworthy', 'expert', 'technical', 'business',
    'enterprise', 'consulting', 'financial', 'legal'
  ];
  
  for (const indicator of softIndicators) {
    if (voiceLower.includes(indicator)) {
      return 'soft';
    }
  }
  
  for (const indicator of corporateIndicators) {
    if (voiceLower.includes(indicator)) {
      return 'corporate';
    }
  }
  
  // Default to corporate for business contexts
  return 'corporate';
}

interface ColorProfile {
  warmth: 'warm' | 'cool' | 'neutral';
  energy: 'high' | 'medium' | 'low';
  formality: 'formal' | 'casual' | 'balanced';
}

/**
 * Analyzes color properties to determine theme fit
 */
function analyzeColor(hsl: {h: number, s: number, l: number}, voice?: string): ColorProfile {
  const { h: hue, s: saturation, l: lightness } = hsl;
  
  // Determine warmth based on hue
  let warmth: ColorProfile['warmth'];
  if (hue >= 0 && hue <= 60 || hue >= 300) {
    warmth = 'warm'; // Reds, oranges, yellows, magentas
  } else if (hue >= 180 && hue <= 240) {
    warmth = 'cool'; // Blues, cyans
  } else {
    warmth = 'neutral'; // Greens, purples
  }
  
  // Determine energy based on saturation and lightness
  let energy: ColorProfile['energy'];
  if (saturation > 70 && lightness > 30 && lightness < 70) {
    energy = 'high';
  } else if (saturation < 30 || lightness > 80 || lightness < 20) {
    energy = 'low';
  } else {
    energy = 'medium';
  }
  
  // Determine formality based on color properties and voice
  let formality: ColorProfile['formality'] = 'balanced';
  if (voice) {
    const voiceLower = voice.toLowerCase();
    if (voiceLower.includes('professional') || voiceLower.includes('corporate') || voiceLower.includes('formal')) {
      formality = 'formal';
    } else if (voiceLower.includes('casual') || voiceLower.includes('friendly') || voiceLower.includes('approachable')) {
      formality = 'casual';
    }
  }
  
  // Dark, muted colors tend to be more formal
  if (lightness < 40 && saturation < 50) {
    formality = 'formal';
  }
  
  // Bright, saturated colors tend to be more casual
  if (saturation > 60 && lightness > 50) {
    formality = 'casual';
  }
  
  return { warmth, energy, formality };
}

/**
 * Maps color profile to appropriate theme
 */
function selectThemeFromColorProfile(profile: ColorProfile): string {
  // Corporate theme: formal, professional contexts
  if (profile.formality === 'formal') {
    return 'corporate';
  }
  
  // Soft theme: warm, casual, or high-energy colors
  if (profile.warmth === 'warm' || profile.formality === 'casual') {
    return 'soft';
  }
  
  // For cool colors, consider energy level
  if (profile.warmth === 'cool') {
    return profile.energy === 'high' ? 'soft' : 'corporate';
  }
  
  // Default to corporate for neutral cases
  return 'corporate';
}

/**
 * Converts hex color to HSL
 */
function hexToHsl(hex: string): {h: number, s: number, l: number} {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  // Lightness
  const l = (max + min) / 2;
  
  // Saturation
  let s = 0;
  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
  }
  
  // Hue
  let h = 0;
  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Gets theme explanation for debugging/logging
 */
export function explainThemeSelection(brand: BrandProfile, selectedTheme: string): string {
  const reasons = [];
  
  if (brand.colors && brand.colors.length > 0) {
    const primaryColor = brand.colors[0].hex;
    const hsl = hexToHsl(primaryColor);
    const profile = analyzeColor(hsl, brand.voice);
    
    reasons.push(`Primary color ${primaryColor} analyzed as:`);
    reasons.push(`- Warmth: ${profile.warmth}`);
    reasons.push(`- Energy: ${profile.energy}`);
    reasons.push(`- Formality: ${profile.formality}`);
  }
  
  if (brand.voice) {
    reasons.push(`Brand voice: "${brand.voice}"`);
  }
  
  reasons.push(`Selected theme: ${selectedTheme}`);
  
  return reasons.join('\n  ');
}
