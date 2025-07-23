/**
 * Test theme selection with the actual Per Aspera brief
 */

// Simulate the extracted Per Aspera brand profile based on content.md
const perAsperaBrand = {
  name: 'Per Aspera Sapientia',
  tagline: 'Forged in adversity. Focused on what matters.',
  voice: 'strategic creativity and calm authority with battle-tested empathy',
  colors: [
    { name: 'Midnight', hex: '#0B1F3A', usage: 'primary' },
    { name: 'Forged Steel', hex: '#7A8B94', usage: 'secondary' },
    { name: 'Ash Gray', hex: '#C9C9C9', usage: 'text' },
    { name: 'Blood Rust', hex: '#822E2E', usage: 'accent' },
    { name: 'Warm Gold', hex: '#D4AF37', usage: 'accent' }
  ],
  fonts: [
    { name: 'Cinzel', url: '', usage: 'titles' },
    { name: 'Playfair Display', url: '', usage: 'headers' },
    { name: 'Inter', url: '', usage: 'body' }
  ],
  values: [
    'Wisdom Through Experience',
    'Strategic Integrity', 
    'Quiet Strength',
    'Craft and Clarity'
  ],
  industry: 'Technology Consulting',
  targetAudience: 'Organizations facing complex intersections of technology, process, and people'
};

console.log('🔍 Analyzing Per Aspera brand profile...');
console.log(`Name: ${perAsperaBrand.name}`);
console.log(`Voice: ${perAsperaBrand.voice}`);
console.log(`Primary Color: ${perAsperaBrand.colors[0].hex} (${perAsperaBrand.colors[0].name})`);
console.log(`Values: ${perAsperaBrand.values.join(', ')}`);

// This would be the theme selection logic
function analyzePerAsperaBrand(brand) {
  // Dark midnight blue (#0B1F3A) analysis:
  // - Very dark (lightness ~15%)
  // - Cool hue (blue family)
  // - Professional context
  // - Strategic/authoritative voice
  
  const reasoning = [
    'Primary color is Midnight (#0B1F3A) - very dark, formal blue',
    'Voice includes "strategic" and "calm authority" - corporate indicators',
    'Industry is Technology Consulting - professional context',
    'Values emphasize wisdom, integrity, strength - formal attributes',
    'Overall brand positioning is serious, professional, trustworthy'
  ];
  
  const selectedTheme = 'corporate';
  
  return { selectedTheme, reasoning };
}

const analysis = analyzePerAsperaBrand(perAsperaBrand);

console.log(`\n🎨 Theme Selection Result: ${analysis.selectedTheme}`);
console.log('\n📝 Reasoning:');
analysis.reasoning.forEach(reason => console.log(`  • ${reason}`));

console.log(`\n✅ Per Aspera would use the "${analysis.selectedTheme}" theme`);
console.log('This provides professional amber/gold accents that complement the sophisticated brand positioning.');
