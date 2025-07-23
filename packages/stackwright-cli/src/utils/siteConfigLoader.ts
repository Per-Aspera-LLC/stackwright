import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { SiteConfig, defaultSiteConfig } from '@stackwright/core';
import { resolveColor } from '@stackwright/core/src/utils/colorUtils';

export async function loadSiteConfig(projectPath: string): Promise<SiteConfig> {
  const configPath = path.join(projectPath, 'stackwright.config.yaml');
  
  try {
    if (await fs.pathExists(configPath)) {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = yaml.load(configContent) as any;
      
      return {
        title: config.site?.title || config.title || 'Stackwright',
        appBar: config.site?.appBar, 
        navigation: config.site?.navigation || config.navigation || [
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Services", href: "/services" },
          { label: "Contact", href: "/contact" }
        ],
        footer: config.site?.footer || config.footer
      };
    }
  } catch (error) {
    console.warn('Could not load site config, using defaults:', error);
  }
  
  // Return default config
  return defaultSiteConfig;
}