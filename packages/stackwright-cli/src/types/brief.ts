import { Theme } from '@stackwright/themes';

export interface ContentBrief {
  brand: BrandProfile;
  content: ContentRequirements;
  assets: AssetInventory;
  imageSpecs: ImageRequirement[];
  themeName?: string;
  customTheme?: Theme;
}

export interface BrandProfile {
  name: string;
  tagline?: string;
  voice: string;
  colors: {name: string, hex: string, usage: string}[];
  fonts: {name: string, url: string, usage: string}[];
  values: string[];
  industry?: string;
  targetAudience?: string;
}

export interface ContentRequirements {
  pages: PageRequirement[];
  copy: string;
  tone: string;
  keyMessages: string[];
}

export interface PageRequirement {
  name: string;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AssetInventory {
  available: AvailableAsset[];
  missing: ImageRequirement[];
}

export interface AvailableAsset {
  filename: string;
  path: string;
  type: 'logo' | 'hero' | 'icon' | 'graphic' | 'photo';
  dimensions?: string;
}

export interface ImageRequirement {
  id: string;
  purpose: 'hero' | 'icon' | 'graphic' | 'logo' | 'photo';
  dimensions: string;
  description: string;
  fallback: string;
  context?: string; // For AI prompt generation
}