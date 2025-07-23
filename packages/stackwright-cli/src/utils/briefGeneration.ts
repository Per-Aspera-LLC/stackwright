import { ContentBrief } from '../types/brief';

export function generateContentFromBrief(brief: ContentBrief) {
  // Generate content based on the brief without AI
  const pages: any = {};
  
  // Extract key info from the brief
  const brandName = brief.brand.name || 'Your Company';
  const tagline = brief.brand.tagline || `Welcome to ${brandName}`;
  const industry = brief.brand.industry || 'business';
  const voice = brief.brand.voice || 'professional';
  
  // Use the copy content if available
  const copyLines = brief.content.copy ? brief.content.copy.split('\n').filter(line => line.trim()) : [];
  const firstParagraph = copyLines.find(line => line.length > 50) || `${brandName} delivers exceptional results.`;
  
  for (const page of brief.content.pages) {
    switch (page.name) {
      case 'home':
        pages.home = `content:
  content_items:
    - main:
        label: "hero"
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        heading:
          text: "${tagline}"
          size: "h1"
          color: "#ffffff"
        textBlocks:
          - text: "${firstParagraph}"
            size: "h5"
            color: "#ffffff"
          - text: "We specialize in ${industry} with a ${voice} approach."
            size: "body1"
            color: "#ffffff"
        buttons:
          - text: "Learn More"
            href: "/about"
            variant: "contained"
            color: "secondary"`;
        break;
        
      case 'about':
        pages.about = `content:
  content_items:
    - main:
        label: "about"
        background: "#f5f5f5"
        heading:
          text: "About ${brandName}"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "${brandName} is dedicated to excellence in ${industry}."
            size: "body1"
            color: "#333333"
          - text: "Our ${voice} approach sets us apart."
            size: "body1"
            color: "#333333"`;
        break;
        
      case 'services':
        pages.services = `content:
  content_items:
    - main:
        label: "services"
        background: "#ffffff"
        heading:
          text: "Our Services"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "${brandName} offers comprehensive solutions tailored to your needs."
            size: "body1"
            color: "#333333"
          - text: "We combine expertise with innovation to deliver measurable results."
            size: "body1"
            color: "#333333"`;
        break;
        
      case 'contact':
        pages.contact = `content:
  content_items:
    - main:
        label: "contact"
        background: "#f5f5f5"
        heading:
          text: "Get In Touch"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "Ready to work with ${brandName}? Let's discuss your project."
            size: "body1"
            color: "#333333"
        buttons:
          - text: "Contact Us"
            href: "mailto:hello@example.com"
            variant: "contained"
            color: "primary"`;
        break;
        
      default:
        pages[page.name] = `content:
  content_items:
    - main:
        label: "${page.name}"
        background: "#ffffff"
        heading:
          text: "${page.name.charAt(0).toUpperCase() + page.name.slice(1)}"
          size: "h1"
          color: "#333333"
        textBlocks:
          - text: "Learn more about our ${page.purpose || 'services'}."
            size: "body1"
            color: "#333333"`;
    }
  }
  
  console.log('Generated content structure:', Object.keys(pages));
  return pages;
}