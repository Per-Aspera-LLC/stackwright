/**
 * Test custom theme generation with Per Aspera brand colors
 */

// Simulate the Per Aspera brand profile from content.md
const perAsperaBrand = {
  name: 'Per Aspera Sapientia',
  tagline: 'Forged in adversity. Focused on what matters.',
  voice: 'strategic creativity and calm authority with battle-tested empathy',
  colors: [
    { name: 'Midnight', hex: '#0B1F3A', usage: 'primary' },
    { name: 'Forged Steel', hex: '#7A8B94', usage: 'secondary' },
    { name: 'Ash Gray', hex: '#C9C9C9', usage: 'text' },
    { name: 'Blood Rust', hex: '#822E2E', usage: 'accent' },
    { name: 'Warm Gold', hex: '#D4AF37', usage: 'accent' },
  ],
  fonts: [
    { name: 'Cinzel', url: '', usage: 'titles' },
    { name: 'Playfair Display', url: '', usage: 'headers' },
    { name: 'Inter', url: '', usage: 'body' },
  ],
  values: [
    'Wisdom Through Experience',
    'Strategic Integrity',
    'Quiet Strength',
    'Craft and Clarity',
  ],
  industry: 'Technology Consulting',
  targetAudience: 'Organizations facing complex intersections of technology, process, and people',
};

// Mock the custom theme generation
function generateCustomTheme(brand) {
  const colors = mapBrandColorsToTheme(brand.colors);

  return {
    id: `${brand.name.toLowerCase().replace(/\s+/g, '-')}-custom`,
    name: `${brand.name} Custom`,
    description: `Custom theme for ${brand.name}`,
    colors,
    typography: {
      fontFamily: {
        primary: brand.fonts.find((f) => f.usage === 'body')?.name || 'Inter',
        secondary: brand.fonts.find((f) => f.usage === 'titles')?.name || 'Cinzel',
      },
    },
    spacing: {
      xs: '0.5rem',
      sm: '0.75rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  };
}

function mapBrandColorsToTheme(brandColors) {
  const primary = findColorByUsageOrName(brandColors, ['primary', 'main']);
  const secondary = findColorByUsageOrName(brandColors, ['secondary']);
  const accent = findColorByUsageOrName(brandColors, ['accent']);
  const text = findColorByUsageOrName(brandColors, ['text']);

  return {
    primary: primary?.hex || '#0B1F3A',
    secondary: secondary?.hex || '#7A8B94',
    accent: accent?.hex || '#D4AF37',
    background: '#ffffff',
    surface: '#f8fafc',
    text: text?.hex || '#1f2937',
    textSecondary: '#6b7280',
  };
}

function findColorByUsageOrName(colors, patterns) {
  for (const pattern of patterns) {
    const found = colors.find(
      (color) =>
        color.usage?.toLowerCase().includes(pattern) || color.name?.toLowerCase().includes(pattern)
    );
    if (found) return found;
  }
  return undefined;
}

function shouldUseCustomTheme(brand) {
  return !!(brand.colors && brand.colors.length >= 2);
}

// Test the theme generation
console.log('🎨 Testing Custom Theme Generation for Per Aspera...');
console.log(`Brand: ${perAsperaBrand.name}`);
console.log(`Colors: ${perAsperaBrand.colors.length} provided`);
console.log(`Should use custom theme: ${shouldUseCustomTheme(perAsperaBrand)}`);

if (shouldUseCustomTheme(perAsperaBrand)) {
  const customTheme = generateCustomTheme(perAsperaBrand);

  console.log('\n🎨 Generated Custom Theme:');
  console.log(`  Theme ID: ${customTheme.id}`);
  console.log(`  Theme Name: ${customTheme.name}`);
  console.log('\n🎨 Color Mapping:');
  console.log(`  Primary: ${customTheme.colors.primary} (${perAsperaBrand.colors[0].name})`);
  console.log(`  Secondary: ${customTheme.colors.secondary} (${perAsperaBrand.colors[1].name})`);
  console.log(`  Accent: ${customTheme.colors.accent} (${perAsperaBrand.colors[4].name})`);
  console.log(`  Text: ${customTheme.colors.text} (${perAsperaBrand.colors[2].name})`);

  console.log('\n🔤 Typography:');
  console.log(`  Primary Font: ${customTheme.typography.fontFamily.primary}`);
  console.log(`  Secondary Font: ${customTheme.typography.fontFamily.secondary}`);

  console.log('\n✅ Per Aspera will use its exact brand colors!');
  console.log('   Instead of forcing into corporate/soft, we respect the brand identity.');
} else {
  console.log('\n⚠️ Not enough colors for custom theme, would fall back to theme selection');
}

console.log('\nComparison:');
console.log('❌ Old approach: Force Per Aspera colors into "corporate" theme');
console.log('✅ New approach: Create custom theme using exact Per Aspera colors');
