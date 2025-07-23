import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { SiteConfig, defaultSiteConfig } from '@stackwright/core';

/**
 * Creates a defaults.yaml file for a Stackwright project
 */
export async function createDefaultsFile(projectPath: string, config: Partial<SiteConfig> = {}): Promise<void> {
  const defaultConfig = {
    site: {
      title: config.title || 'Your Site',
      themeName: config.themeName || 'corporate',
      description: 'Built with Stackwright',
      navigation: config.navigation || [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Contact", href: "/contact" }
      ],
      footer: config.footer || {
        copyright: `© ${new Date().getFullYear()} Your Site. All rights reserved.`
      },
      // Include custom theme if provided
      ...(config.customTheme && { customTheme: config.customTheme })
    },
    
    // Default page settings
    defaults: {
      layout: 'standard',
      showHeader: true,
      showFooter: true,
      containerMaxWidth: '1200px'
    },
    
    // SEO defaults
    seo: {
      titleTemplate: '%s | Your Site',
      description: 'Default site description',
      keywords: ['website', 'stackwright'],
      author: 'Stack Wright',
      ogImage: '/images/og-image.png'
    },
    
    // Development settings
    development: {
      showPageInfo: false,
      debugMode: false
    }
  };

  const defaultsPath = path.join(projectPath, 'defaults.yaml');
  await fs.writeFile(defaultsPath, yaml.dump(defaultConfig, { indent: 2 }));
  console.log('✅ Created defaults.yaml');
}

/**
 * Loads and merges site configuration from multiple sources
 */
export async function loadSiteConfiguration(projectPath: string): Promise<SiteConfig> {
  const defaultsPath = path.join(projectPath, 'defaults.yaml');
  const configPath = path.join(projectPath, 'stackwright.config.yaml');
  
  let config: any = {};
  
  // Load defaults first
  if (await fs.pathExists(defaultsPath)) {
    try {
      const defaultsContent = await fs.readFile(defaultsPath, 'utf8');
      const defaults = yaml.load(defaultsContent) as any;
      config = { ...defaults };
    } catch (error) {
      console.warn('Failed to load defaults.yaml:', error);
    }
  }
  
  // Override with stackwright.config.yaml
  if (await fs.pathExists(configPath)) {
    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const siteConfig = yaml.load(configContent) as any;
      config = mergeDeep(config, siteConfig);
    } catch (error) {
      console.warn('Failed to load stackwright.config.yaml:', error);
    }
  }
  
  return config.site || defaultSiteConfig;
}

/**
 * Deep merge two objects
 */
function mergeDeep(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

