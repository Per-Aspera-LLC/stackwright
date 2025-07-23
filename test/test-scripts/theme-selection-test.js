/**
 * Test the intelligent theme selection functionality
 */

// Mock the theme selector (would import in real code)
const selectThemeFromBrand = (brand) => {
  // If no colors provided, use voice-based selection
  if (!brand.colors || brand.colors.length === 0) {
    return selectThemeFromVoice(brand.voice);
  }

  const primaryColor = brand.colors[0]?.hex;
  if (!primaryColor) {
    return selectThemeFromVoice(brand.voice);
  }

  // Convert hex to HSL for analysis
  const hsl = hexToHsl(primaryColor);
  const colorProfile = analyzeColor(hsl, brand.voice);
  
  return selectThemeFromColorProfile(colorProfile);
};

const selectThemeFromVoice = (voice) => {
  if (!voice) return 'corporate';
  
  const voiceLower = voice.toLowerCase();
  
  const softIndicators = ['friendly', 'approachable', 'warm', 'creative'];
  const corporateIndicators = ['professional', 'strategic', 'authoritative', 'business'];
  
  for (const indicator of softIndicators) {
    if (voiceLower.includes(indicator)) return 'soft';
  }
  
  for (const indicator of corporateIndicators) {
    if (voiceLower.includes(indicator)) return 'corporate';
  }
  
  return 'corporate';
};

const hexToHsl = (hex) => {
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
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const analyzeColor = (hsl, voice) => {
  const { h: hue, s: saturation, l: lightness } = hsl;
  
  let warmth = 'neutral';
  if (hue >= 0 && hue <= 60 || hue >= 300) warmth = 'warm';
  else if (hue >= 180 && hue <= 240) warmth = 'cool';
  
  let energy = 'medium';
  if (saturation > 70 && lightness > 30 && lightness < 70) energy = 'high';
  else if (saturation < 30 || lightness > 80 || lightness < 20) energy = 'low';
  
  let formality = 'balanced';
  if (voice && voice.toLowerCase().includes('professional')) formality = 'formal';
  if (lightness < 40 && saturation < 50) formality = 'formal';
  if (saturation > 60 && lightness > 50) formality = 'casual';
  
  return { warmth, energy, formality };
};

const selectThemeFromColorProfile = (profile) => {
  if (profile.formality === 'formal') return 'corporate';
  if (profile.warmth === 'warm' || profile.formality === 'casual') return 'soft';
  if (profile.warmth === 'cool') return profile.energy === 'high' ? 'soft' : 'corporate';
  return 'corporate';
};

// Test cases
console.log('🧪 Testing theme selection...');

// Test 1: Corporate brand with professional voice
const corporateBrand = {
  name: 'Acme Consulting',
  voice: 'professional and strategic',
  colors: [{ name: 'primary', hex: '#1e40af', usage: 'primary' }] // Deep blue
};
console.log(`Corporate brand → ${selectThemeFromBrand(corporateBrand)} (expected: corporate)`);

// Test 2: Creative brand with warm colors
const creativeBrand = {
  name: 'Sunshine Studios',
  voice: 'friendly and creative',
  colors: [{ name: 'primary', hex: '#f59e0b', usage: 'primary' }] // Warm orange
};
console.log(`Creative brand → ${selectThemeFromBrand(creativeBrand)} (expected: soft)`);

// Test 3: Brand with pink colors
const pinkBrand = {
  name: 'Beauty Co',
  voice: 'elegant and sophisticated',
  colors: [{ name: 'primary', hex: '#ec4899', usage: 'primary' }] // Pink
};
console.log(`Pink brand → ${selectThemeFromBrand(pinkBrand)} (expected: soft)`);

// Test 4: Voice-only selection
const voiceOnlyBrand = {
  name: 'Law Firm',
  voice: 'authoritative and trustworthy',
  colors: []
};
console.log(`Voice-only brand → ${selectThemeFromBrand(voiceOnlyBrand)} (expected: corporate)`);

// Test 5: Per Aspera colors (from the content.md)
const perAsperaBrand = {
  name: 'Per Aspera Sapientia',
  voice: 'strategic and empathetic leadership',
  colors: [
    { name: 'midnight', hex: '#0B1F3A', usage: 'primary' },
    { name: 'warm-gold', hex: '#D4AF37', usage: 'accent' }
  ]
};
console.log(`Per Aspera brand → ${selectThemeFromBrand(perAsperaBrand)} (expected: corporate - dark formal colors)`);

console.log('✅ Theme selection tests completed');
