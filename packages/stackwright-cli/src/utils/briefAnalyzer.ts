import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { OpenAI } from 'openai';
import { ContentBrief, BrandProfile, ContentRequirements, AssetInventory, ImageRequirement, AvailableAsset } from '../types/brief';
import { selectThemeFromBrand, explainThemeSelection } from './themeSelector';
import { generateCustomTheme, shouldUseCustomTheme, explainCustomTheme } from './customThemeGenerator';

export async function analyzeBrief(briefDir: string, apiKey?: string, outputDir?: string): Promise<ContentBrief> {
  console.log(`📁 Analyzing brief directory: ${briefDir}`);
  
  if (!await fs.pathExists(briefDir)) {
    throw new Error(`Brief directory not found: ${briefDir}`);
  }

  const brief: ContentBrief = {
    brand: await parseBrandProfile(briefDir, apiKey),
    content: await parseContentRequirements(briefDir, apiKey),
    assets: await analyzeAssets(briefDir),
    imageSpecs: []
  };

  // Generate image requirements based on content analysis
  brief.imageSpecs = generateImageRequirements(brief);

  // Generate theme from brand profile
  if (shouldUseCustomTheme(brief.brand)) {
    // Create custom theme from brand colors
    brief.customTheme = generateCustomTheme(brief.brand);
    brief.themeName = brief.customTheme.name;
    console.log(`🎨 Generated custom theme: ${brief.themeName}`);
    console.log(`📝 Custom theme details:\n  ${explainCustomTheme(brief.brand)}`);
  } else {
    // Select from existing themes
    brief.themeName = selectThemeFromBrand(brief.brand);
    console.log(`🎨 Selected theme: ${brief.themeName}`);
    console.log(`📝 Theme selection reasoning:\n  ${explainThemeSelection(brief.brand, brief.themeName)}`);
  }

  // TODO: Apply theme to output directory if provided
  // if (outputDir && brief.themeName) {
  //   await applyThemeToProject(brief.themeName, outputDir);
  // }

  return brief;
}

async function parseBrandProfile(briefDir: string, apiKey?: string): Promise<BrandProfile> {
  const brandPath = path.join(briefDir, 'brand.md');
  
  if (await fs.pathExists(brandPath)) {
    const content = await fs.readFile(brandPath, 'utf8');
    return extractBrandFromMarkdown(content, apiKey);
  }

  // Try brand.yaml as alternative
  const brandYamlPath = path.join(briefDir, 'brand.yaml');
  if (await fs.pathExists(brandYamlPath)) {
    const content = await fs.readFile(brandYamlPath, 'utf8');
    return yaml.load(content) as BrandProfile;
  }

  console.log('⚠️  No brand file found, using defaults');
  return getDefaultBrandProfile();
}

async function extractBrandFromMarkdown(content: string, apiKey?: string): Promise<BrandProfile> {
  if (apiKey) {
    console.log('🤖 Using AI to extract brand information...');
    return await extractBrandWithAI(content, apiKey);
  }
  
  console.log('📝 Using manual brand extraction...');
  return extractBrandManually(content);
}

async function extractBrandWithAI(content: string, apiKey: string): Promise<BrandProfile> {
  const openai = new OpenAI({ apiKey });
  
  const prompt = `Extract brand information from this content and return as JSON:

${content}

Extract and return JSON with this exact structure:
{
  "name": "company/brand name",
  "tagline": "main tagline or slogan", 
  "voice": "brand voice/tone description",
  "colors": [
    {"name": "primary", "hex": "#hex1", "usage": "primary"},
    {"name": "secondary", "hex": "#hex2", "usage": "secondary"},
    {"name": "accent", "hex": "#hex3", "usage": "accent"}
  ],
  "fonts": [
    {"name": "Font Name", "url": "font-url", "usage": "primary"},
    {"name": "Font Name", "url": "font-url", "usage": "secondary"}
  ],
  "values": ["value1", "value2", "value3"],
  "industry": "industry/sector",
  "targetAudience": "target audience description"
}

Focus on extracting the actual brand essence. For colors, convert any color mentions to hex codes. For fonts, suggest appropriate web fonts based on the brand voice.

Respond ONLY with valid JSON, no code block formatting.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are an expert branding analyst AI. Return only valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    });
    
    const result = response.choices[0].message.content;
    if (!result) throw new Error('No response from AI');
    
    const parsed = JSON.parse(result);
    
    // Ensure proper format with defaults
    return {
      name: parsed.name || 'Your Company',
      tagline: parsed.tagline,
      voice: parsed.voice || 'professional',
      colors: parsed.colors || [
        { name: 'primary', hex: '#2563eb', usage: 'primary' },
        { name: 'secondary', hex: '#1e40af', usage: 'secondary' }
      ],
      fonts: parsed.fonts || [
        { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', usage: 'primary' },
        { name: 'system-ui', url: '', usage: 'secondary' }
      ],
      values: parsed.values || ['quality', 'innovation', 'excellence'],
      industry: parsed.industry,
      targetAudience: parsed.targetAudience
    };
    
  } catch (error) {
    console.log('⚠️ AI brand extraction failed, using manual parsing');
    return extractBrandManually(content);
  }
}

function extractBrandManually(content: string): BrandProfile {
  const lines = content.split('\n');
  const brand: Partial<BrandProfile> = {};
  
  // Look for the main heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    brand.name = titleMatch[1].trim();
  }
  
  // Look for tagline in quotes
  const taglineMatch = content.match(/[""]([^""]+)[""]/) || content.match(/"([^"]+)"/);
  if (taglineMatch) {
    brand.tagline = taglineMatch[1].trim();
  }
  
  // Extract colors from hex codes and convert to proper format
  const colorHexes: string[] = [];
  const colorMatches = content.matchAll(/#[A-Fa-f0-9]{6}/g);
  for (const match of colorMatches) {
    if (!colorHexes.includes(match[0])) {
      colorHexes.push(match[0]);
    }
  }
  
  // Convert to BrandProfile color format
  const colors = colorHexes.map((hex, index) => ({
    name: index === 0 ? 'primary' : index === 1 ? 'secondary' : `color-${index + 1}`,
    hex,
    usage: index === 0 ? 'primary' : index === 1 ? 'secondary' : 'accent'
  }));
  
  // Extract values from bullet points with bold text
  const values: string[] = [];
  const valueMatches = content.matchAll(/[-*]\s*\*\*([^:*]+):\*\*/g);
  for (const match of valueMatches) {
    values.push(match[1].trim());
  }
  
  return {
    name: brand.name || 'Your Company',
    tagline: brand.tagline,
    voice: 'professional and strategic',
    colors: colors.length > 0 ? colors : [
      { name: 'primary', hex: '#2563eb', usage: 'primary' },
      { name: 'secondary', hex: '#1e40af', usage: 'secondary' }
    ],
    fonts: [
      { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', usage: 'primary' },
      { name: 'system-ui', url: '', usage: 'secondary' }
    ],
    values: values.length > 0 ? values : ['quality', 'innovation', 'excellence'],
    industry: 'Professional Services',
    targetAudience: 'Business professionals',
    ...brand
  };
}

function getDefaultBrandProfile(): BrandProfile {
  return {
    name: 'Your Company',
    voice: 'professional and approachable',
    colors: [
      { name: 'primary', hex: '#2563eb', usage: 'primary' },
      { name: 'secondary', hex: '#1e40af', usage: 'secondary' }
    ],
    fonts: [
      { name: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', usage: 'primary' },
      { name: 'system-ui', url: '', usage: 'secondary' }
    ],
    values: ['quality', 'innovation', 'customer-focused']
  };
}

async function parseContentRequirements(briefDir: string, apiKey?: string): Promise<ContentRequirements> {
  const contentPath = path.join(briefDir, 'content.md');
  let copy = '';
  let pages = [];

  if (await fs.pathExists(contentPath)) {
    copy = await fs.readFile(contentPath, 'utf8');
  }

  // Look for pages.yaml
  const pagesPath = path.join(briefDir, 'pages.yaml');
  if (await fs.pathExists(pagesPath)) {
    const pagesContent = await fs.readFile(pagesPath, 'utf8');
    const pagesData = yaml.load(pagesContent) as any;
    pages = pagesData.pages || [];
  } else {
    // Default pages
    pages = [
      { name: 'home', purpose: 'landing page', priority: 'high' },
      { name: 'about', purpose: 'company information', priority: 'high' },
      { name: 'services', purpose: 'service offerings', priority: 'medium' },
      { name: 'contact', purpose: 'contact information', priority: 'high' }
    ];
  }

  // TODO: Could also use AI to extract key messages and tone from content
  return {
    pages,
    copy,
    tone: 'professional',
    keyMessages: []
  };
}

async function analyzeAssets(briefDir: string): Promise<AssetInventory> {
  const assetsDir = path.join(briefDir, 'assets');
  const available: AvailableAsset[] = [];
  
  if (await fs.pathExists(assetsDir)) {
    const files = await fs.readdir(assetsDir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile() && isImageFile(file.name)) {
        available.push({
          filename: file.name,
          path: path.join(assetsDir, file.name),
          type: guessAssetType(file.name)
        });
      }
    }
  }

  return {
    available,
    missing: [] // Will be populated by generateImageRequirements
  };
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif'].includes(ext);
}

function guessAssetType(filename: string): AvailableAsset['type'] {
  const lower = filename.toLowerCase();
  
  if (lower.includes('logo')) return 'logo';
  if (lower.includes('hero') || lower.includes('banner')) return 'hero';
  if (lower.includes('icon')) return 'icon';
  if (lower.includes('team') || lower.includes('photo')) return 'photo';
  
  return 'graphic';
}

function generateImageRequirements(brief: ContentBrief): ImageRequirement[] {
  const requirements: ImageRequirement[] = [];
  
  // Always need a logo
  if (!brief.assets.available.some(asset => asset.type === 'logo')) {
    requirements.push({
      id: 'logo',
      purpose: 'logo',
      dimensions: '200x200',
      description: `${brief.brand.name} company logo`,
      fallback: '/placeholders/logo.svg',
      context: `Logo for ${brief.brand.name}, ${brief.brand.voice} style`
    });
  }

  // Generate requirements based on pages
  for (const page of brief.content.pages) {
    if (page.name === 'home' && !brief.assets.available.some(asset => asset.type === 'hero')) {
      requirements.push({
        id: 'hero',
        purpose: 'hero',
        dimensions: '1200x600',
        description: `Hero image for ${brief.brand.name} homepage`,
        fallback: '/placeholders/hero.svg',
        context: `Hero image for ${brief.brand.name}, ${brief.brand.industry || 'business'} industry, ${brief.brand.voice} style`
      });
    }
  }

  return requirements;
}