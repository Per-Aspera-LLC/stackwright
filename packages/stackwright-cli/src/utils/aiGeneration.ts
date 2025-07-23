import { OpenAI } from 'openai';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { ContentBrief } from '../types/brief';
import contentReference from '../generated/contentTypeReference.json';
import { formatExamplesForPrompt } from '../generated/contentTypeExamples';

export async function generateAIContentFromBrief(
  brief: ContentBrief, 
  apiKey: string, 
  pagesYamlText?: string,
  exampleComponentMap?: string
) {
  const openai = new OpenAI({ apiKey });
  
  // Step 1: Generate content AND get list of needed images
  const contentAndImages = await generateContentWithImageList(brief, apiKey, openai, pagesYamlText, exampleComponentMap);
  
  // Step 2: Return both content and images list
  return contentAndImages;
}

async function generateContentWithImageList(
  brief: ContentBrief, 
  apiKey: string, 
  openai: OpenAI, 
  pagesYamlText?: string,
  exampleComponentMap?: string
) {
  const exampleSection = formatExamplesForPrompt();
  
  // Use provided parameters or fallback to defaults
  const componentMap = exampleComponentMap || JSON.stringify(contentReference, null, 2);
  const pagesText = pagesYamlText || 'No specific pages defined';
  
const prompt = `
You are a structured content generator for the Stackwright framework.

---

BRAND PROFILE:
- Name: ${brief.brand.name}
- Voice: ${brief.brand.voice}
- Industry: ${brief.brand.industry}
- Tagline: ${brief.brand.tagline}
- Values: ${brief.brand.values.join(", ")}
- Audience: ${brief.brand.targetAudience}
- Colors: ${brief.brand.colors.map(c => c.hex).join(", ")}
- Fonts: ${brief.brand.fonts.join(", ")}

---

AVAILABLE COMPONENT TYPES:
${componentMap}

---

TARGET PAGES:
${pagesText}

---

TASK:
Generate content and image references for the specified pages using the provided components only.

Output format:
{
  "pages": {
    "...": { "content": { "app_bar": {...}, "content_items": [...] }, "footer": {...} },
    "...": { "content": { "app_bar": {...}, "content_items": [...] }, "footer": {...} },
    ...
  },
  "images_needed": [
    {
      "filename": "...",
      "description": "...",
      "dimensions": "..."
    },
    ...
  ]
}

RULES:
- Include topappbar navigation and footers.
- Include each target page and any linked pages that add value to the brand message.
- Use only the provided components and their fields.
- Every page should include multiple components to ensure visual variety.
- List every image you reference in the correct format.
- Use headings, textBlocks, and buttons where appropriate.
- Preserve indentation and spacing.
- Don't wrap output in markdown fences — return pure JSON only.
`;



  let result: string | null = null;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [{ 
          role: "system",
          content: "You are a JSON-generating assistant for the Stackwright framework. Use only provided components. Return only valid JSON with no extra text."
        }, { 
          role: "user", 
          content: prompt 
        }],
      temperature: 0.3,  // Lower temperature for more consistent JSON
      max_tokens: 4096
    });
    
    result = response.choices[0].message.content;
    if (!result) throw new Error('No content generated');
    
    // Right after getting the AI response:
    console.log(chalk.blue('🔍 RAW AI RESPONSE:'));
    console.log(result?.substring(0, 500));
    
    // Replace the aggressive cleaning with minimal cleanup
    const cleanedResult = result
      .replace(/^\s*/i, '')  // Remove opening json if present
      .replace(/\s*$/, '')       // Remove closing  if present
      .trim();
    
    // After cleaning:
    console.log(chalk.blue('🔍 CLEANED RESPONSE:'));
    console.log(cleanedResult.substring(0, 500));
    
    // After parsing the JSON:
    const parsedResponse = JSON.parse(cleanedResult);

    // Extract just the pages, not the whole response:
    let yamlContent;
    if (parsedResponse.pages) {
      // If the response has a "pages" wrapper, extract it
      yamlContent = parsedResponse.pages;
    } else {
      // If it's already the pages object
      yamlContent = parsedResponse;
    }

    // Convert each page to YAML string:
    const convertedContent: Record<string, string> = {};
    for (const [pageName, pageContent] of Object.entries(yamlContent)) {
      convertedContent[pageName] = yaml.dump(pageContent);
    }

    console.log(chalk.green('✅ AI sophisticated layout generation successful'));
    
    // Return both content and images
    return {
      content: convertedContent,
      images_needed: parsedResponse.images_needed || []
    };
    
  } catch (error) {
    console.log(chalk.red('❌ AI content generation failed, using enhanced fallback'));
    console.log(chalk.gray(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray(`Raw response: ${result?.substring(0, 100)}...`));
    return {
      content: generateEnhancedFallbackContent(brief),
      images_needed: []
    };
  }
}

export async function generateAIImages(contentResult: any, apiKey: string, projectPath: string) {
  if (!contentResult.images_needed) {
    console.log(chalk.yellow('⚠️  No images specified by AI'));
    return;
  }
  
  const openai = new OpenAI({ apiKey });
  
  for (const imageSpec of contentResult.images_needed) {
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imageSpec.description,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });
      
      // Add null check for response.data
      if (!response.data || response.data.length === 0) {
        console.log(chalk.yellow(`⚠️  No image data returned for ${imageSpec.filename}`));
        continue;
      }
      
      const imageUrl = response.data[0].url;
      if (imageUrl) {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const imagePath = path.join(projectPath, 'public', 'images', imageSpec.filename);
        await fs.mkdirp(path.dirname(imagePath));
        await fs.writeFile(imagePath, Buffer.from(imageBuffer));
        console.log(chalk.green(`✅ Generated ${imageSpec.filename}`));
      } else {
        console.log(chalk.yellow(`⚠️  No image URL returned for ${imageSpec.filename}`));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️  Could not generate ${imageSpec.filename}: ${error}`));
    }
  }
}

function generateEnhancedFallbackContent(brief: ContentBrief) {
  const brandName = brief.brand.name || 'Your Company';
  const tagline = brief.brand.tagline || `Welcome to ${brandName}`;
  
  return {
    home: `content:
  content_items:
    - main:
        label: "hero_section"
        background: "linear-gradient(135deg, #0B1F3A 0%, #7A8B94 100%)"
        heading:
          text: "${tagline}"
          size: "h1"
          color: "#D4AF37"
        textBlocks:
          - text: "Strategic clarity forged through adversity. We guide organizations through complex challenges with systems thinking and calm authority."
            size: "h5"
            color: "#C9C9C9"
        buttons:
          - text: "Discover Our Approach"
            href: "/about"
            variant: "contained"
            color: "primary"
            
    - icon_grid:
        label: "capabilities"
        background: "#C9C9C9"
        heading:
          text: "Core Capabilities"
          size: "h2"
          color: "#0B1F3A"
        iconsPerRow: 3
        icons:
          - iconId: "/images/icons/strategy.svg"
            text:
              text: "Strategic Architecture"
              size: "h6"
          - iconId: "/images/icons/systems.svg"
            text:
              text: "Systems Thinking"
              size: "h6"
          - iconId: "/images/icons/leadership.svg"
            text:
              text: "Leadership Guidance"
              size: "h6"
              
    - main:
        label: "approach_section"
        background: "#7A8B94"
        heading:
          text: "Forged Through Experience"
          size: "h2"
          color: "#D4AF37"
        textBlocks:
          - text: "Every challenge is an opportunity to learn, refine, and evolve. We bring battle-tested wisdom to complex organizational challenges."
            size: "body1"
            color: "#C9C9C9"
        graphic:
          image: "/images/approach-graphic.svg"
          aspect_ratio: "16/9"
          max_size: 80
          min_size: 60
          graphic_position: "right"`,
        
    about: `content:
  content_items:
    - main:
        label: "story_section"
        background: "linear-gradient(135deg, #0B1F3A 0%, #822E2E 100%)"
        heading:
          text: "Per Aspera Sapientia"
          size: "h1"
          color: "#D4AF37"
        textBlocks:
          - text: "Through hardships, wisdom. Our story is one of navigating adversity and emerging with clarity, discipline, and strategic creativity."
            size: "h5"
            color: "#C9C9C9"
          - text: "We embody leadership born of experience, guiding organizations through complex challenges with systems thinking and calm authority."
            size: "body1"
            color: "#C9C9C9"
            
    - icon_grid:
        label: "values"
        background: "#C9C9C9"
        heading:
          text: "Our Values"
          size: "h2"
          color: "#0B1F3A"
        iconsPerRow: 2
        icons:
          - iconId: "/images/icons/wisdom.svg"
            text:
              text: "Wisdom Through Experience"
              size: "h6"
          - iconId: "/images/icons/integrity.svg"
            text:
              text: "Strategic Integrity"
              size: "h6"
          - iconId: "/images/icons/strength.svg"
            text:
              text: "Quiet Strength"
              size: "h6"
          - iconId: "/images/icons/craft.svg"
            text:
              text: "Craft and Clarity"
              size: "h6"`,
              
    services: `content:
  content_items:
    - main:
        label: "services_hero"
        background: "linear-gradient(135deg, #7A8B94 0%, #0B1F3A 100%)"
        heading:
          text: "Strategic Solutions"
          size: "h1"
          color: "#D4AF37"
        textBlocks:
          - text: "Fractional CTO leadership, systems architecture guidance, and technical strategy for complex organizational challenges."
            size: "h5"
            color: "#C9C9C9"
            
    - main:
        label: "fractional_cto"
        background: "#C9C9C9"
        heading:
          text: "Fractional CTO Leadership"
          size: "h2"
          color: "#0B1F3A"
        textBlocks:
          - text: "Strategic technology leadership without the full-time commitment. We provide executive-level guidance for your most critical technical decisions."
            size: "body1"
            color: "#0B1F3A"
        graphic:
          image: "/images/cto-leadership.svg"
          aspect_ratio: "4/3"
          max_size: 70
          min_size: 50
        graphic_position: "left"
        
    - main:
        label: "systems_architecture"
        background: "#7A8B94"
        heading:
          text: "Systems Architecture"
          size: "h2"
          color: "#D4AF37"
        textBlocks:
          - text: "Complex systems require thoughtful design. We architect solutions that scale, adapt, and endure through changing requirements."
            size: "body1"
            color: "#C9C9C9"
        graphic:
          image: "/images/systems-arch.svg"
          aspect_ratio: "16/9"
          max_size: 80
          min_size: 60
        graphic_position: "right"`,
        
    contact: `content:
  content_items:
    - main:
        label: "contact_hero"
        background: "linear-gradient(135deg, #0B1F3A 0%, #822E2E 100%)"
        heading:
          text: "Ready to Begin?"
          size: "h1"
          color: "#D4AF37"
        textBlocks:
          - text: "Let's discuss how strategic clarity can transform your organization's approach to complex challenges."
            size: "h5"
            color: "#C9C9C9"
        buttons:
          - text: "Start the Conversation"
            href: "mailto:hello@peraspera.com"
            variant: "contained"
            color: "primary"
            
    - icon_grid:
        label: "contact_methods"
        background: "#C9C9C9"
        heading:
          text: "Connect With Us"
          size: "h2"
          color: "#0B1F3A"
        iconsPerRow: 3
        icons:
          - iconId: "/images/icons/email.svg"
            text:
              text: "Strategic Consultation"
              size: "body1"
          - iconId: "/images/icons/calendar.svg"
            text:
              text: "Discovery Session"
              size: "body1"
          - iconId: "/images/icons/phone.svg"
            text:
              text: "Direct Discussion"
              size: "body1"`
  };
}

export function generateSiteConfig(brief: ContentBrief): string {
  const themeName = brief.themeName || 'corporate';
  
  return `site:
  title: "${brief.brand.name}"
  themeName: "${themeName}"
  logo:
    image: "/images/logo.svg"
    width: 120
    height: 60
  navigation:
    - label: "Home"
      href: "/"
    - label: "About"
      href: "/about"
    - label: "Services"
      href: "/services"
    - label: "Approach"
      href: "/approach"
    - label: "Contact"
      href: "/contact"
  footer:
    copyright: "© ${new Date().getFullYear()} ${brief.brand.name}. All rights reserved."
    links:
      - label: "Privacy Policy"
        href: "/privacy"
      - label: "Terms of Service"
        href: "/terms"
`;
}