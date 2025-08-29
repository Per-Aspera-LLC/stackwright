import { GetStaticPaths, GetStaticProps } from 'next';
import { StackwrightStaticGeneration } from '@stackwright/core';
import { PageContent, SiteConfig } from '@stackwright/types';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Helper function to find content file with either .yml or .yaml extension
 */
function findContentFile(basePath: string): string | null {
  const fs = require('fs');
  const path = require('path');
  
  const yamlPath = path.join(basePath, 'content.yaml');
  const ymlPath = path.join(basePath, 'content.yml');
  
  if (fs.existsSync(yamlPath)) {
    return yamlPath;
  } else if (fs.existsSync(ymlPath)) {
    return ymlPath;
  }
  
  return null;
}

/**
 * Helper function to find config file with either .yml or .yaml extension
 */
function findConfigFile(): string | null {
  const fs = require('fs');
  const path = require('path');
  
  const yamlPath = path.join(process.cwd(), 'stackwright.yaml');
  const ymlPath = path.join(process.cwd(), 'stackwright.yml');
  
  if (fs.existsSync(yamlPath)) {
    return yamlPath;
  } else if (fs.existsSync(ymlPath)) {
    return ymlPath;
  }
  
  return null;
}

/**
 * Check if a file path appears to be an image
 */
function isImageFile(filePath: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const ext = path.extname(filePath.toLowerCase());
  return imageExtensions.includes(ext);
}

/**
 * Process images in site config, copying from root directory to public/images/config
 */
function processImagesInConfig(config: any): any {
  const fs = require('fs');
  const path = require('path');
  const rootDir = process.cwd();

  if (typeof config === 'string') {
    // Check if it's a relative image path or just a filename
    if ((config.startsWith('./') || (!config.includes('/') && !config.startsWith('http'))) && isImageFile(config)) {
      const sourcePath = path.resolve(rootDir, config.startsWith('./') ? config : `./${config}`);

      if (fs.existsSync(sourcePath)) {
        // Create destination path in public/images/config
        const fileName = path.basename(config);
        const destDir = path.join(rootDir, 'public', 'images', 'config');
        const destPath = path.join(destDir, fileName);

        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        // Copy image if it doesn't exist or source is newer
        if (!fs.existsSync(destPath) ||
            fs.statSync(sourcePath).mtime > fs.statSync(destPath).mtime) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`📸 Copied config image: ${sourcePath} -> ${destPath}`);
        }

        // Return public URL path
        return `/images/config/${fileName}`;
      } else {
        console.warn(`⚠️ Config image file not found: ${sourcePath}`);
        // Return original path as fallback - don't break the build
    return config;
  }
  }
  return config;
}

  if (Array.isArray(config)) {
    return config.map(item => processImagesInConfig(item));
  }

  if (config && typeof config === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(config)) {
      processed[key] = processImagesInConfig(value);
    }
    return processed;
  }

  return config;
}

/**
 * Process and copy images from content directory to public/images
 */
function processImagesInContent(content: any, contentDir: string): any {
    const fs = require('fs');
    const path = require('path');

  if (typeof content === 'string') {
    // Check if it's a relative image path
    if (content.startsWith('./') && isImageFile(content)) {
      const sourcePath = path.resolve(contentDir, content);

      if (fs.existsSync(sourcePath)) {
        // Create destination path maintaining directory structure
        const relativePath = path.relative(path.join(process.cwd(), 'pages'), contentDir);
        const fileName = path.basename(content);

        // For root pages directory, don't add extra path segment
        const destDir = relativePath
          ? path.join(process.cwd(), 'public', 'images', relativePath)
          : path.join(process.cwd(), 'public', 'images');
        const destPath = path.join(destDir, fileName);

        // Ensure destination directory exists
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }

        // Copy image if it doesn't exist or source is newer
        if (!fs.existsSync(destPath) ||
            fs.statSync(sourcePath).mtime > fs.statSync(destPath).mtime) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`📸 Copied content image: ${sourcePath} -> ${destPath}`);
        }

        // Return public URL path
        const publicPath = relativePath
          ? path.join('/images', relativePath, fileName).replace(/\\/g, '/')
          : `/images/${fileName}`;

        console.log(`📸 Processed content image: ${content} -> ${publicPath}`);
        return publicPath;
          } else {
        console.warn(`⚠️ Content image file not found: ${sourcePath}`);
        // Return original path as fallback
        return content;
          }
        }
    return content;
  }

  if (Array.isArray(content)) {
    return content.map(item => processImagesInContent(item, contentDir));
    }

  if (content && typeof content === 'object') {
    const processed: any = {};
    for (const [key, value] of Object.entries(content)) {
      processed[key] = processImagesInContent(value, contentDir);
    }
    return processed;
  }

  return content;
}
/**
 * Next.js implementation of Stackwright Static Generation
 * Provides Next.js-specific static generation functions for slug-based pages
 */
export const NextStackwrightStaticGeneration: StackwrightStaticGeneration = {
  /**
   * Next.js getStaticPaths implementation for dynamic slug pages
   * Scans the pages directory for content.yaml files to generate static paths
   */
  getStaticPaths: (async () => {
    const fs = require('fs');
    const path = require('path');

    console.log('Generating static paths...');
    console.log('Current working directory:', process.cwd());

    const pagesDir = path.join(process.cwd(), 'pages');
    const paths: { params: { slug: string } }[] = [];

    console.log('Scanning directory:', pagesDir);

    /**
     * Recursively scan directory for content.yaml files
     */
    function scanDirectory(dir: string, basePath: string = '') {
      if (!fs.existsSync(dir)) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subPath = basePath ? `${basePath}/${entry.name}` : entry.name;
          scanDirectory(path.join(dir, entry.name), subPath);
        } else if (entry.name === 'content.yml' || entry.name === 'content.yaml') {
          // Found a content.yaml file
          if (basePath) {
            // For subdirectories like pages/about/content.yaml -> slug: 'about'
            console.log('Found content yaml file at:', basePath);
            paths.push({ params: { slug: basePath } });
          } else {
            // For root pages/content.yaml -> slug: '/' (index route)
            paths.push({ params: { slug: '/' } });
            console.log('Found root content yaml');
          }
        }
      }
    }

    scanDirectory(pagesDir);
    return {
      paths,
      fallback: 'blocking' // Generate other pages on-demand
    };
  }) as GetStaticPaths,

  /**
   * Next.js getStaticProps implementation for dynamic slug pages
   * Loads YAML content based on the slug from the filesystem
   */
  getStaticProps: (async (context) => {
    console.log('getStaticProps called with context:', context);
    
    const fs = require('fs');
    const path = require('path');

    const { slug } = context.params!;
    const slugArray = Array.isArray(slug) ? slug : [slug];
    const slugPath = slugArray.join('/');
    
    console.log('Processing slug:', slug, 'as path:', slugPath);
    try {
      let contentPath: string | null;
      let contentDir: string;

      if (!slugArray.length || slugPath === '') {
        // Root route - load pages/content.yaml or pages/content.yml
        contentDir = path.join(process.cwd(), 'pages');
        contentPath = findContentFile(contentDir);
        console.log('Loading root content from pages directory');
      } else {
        // Slug route - load pages/{slug}/content.yaml or pages/{slug}/content.yml
        contentDir = path.join(process.cwd(), 'pages', slugPath);
        contentPath = findContentFile(contentDir);
        console.log('Loading content from:', contentDir);
      }

      // Check if the content file exists
      if (!contentPath) {
        console.warn(`Content file not found for slug: ${slugPath}`);
        return {
          notFound: true,
        };
      }

      // Read and parse the YAML content
      const yamlContent = fs.readFileSync(contentPath, 'utf8');
      
      // Parse YAML content into PageContent type
      let pageContent: PageContent;
      try {
        console.log('Parsing YAML content at path:', contentPath);
        const parsedYaml = yaml.load(yamlContent);
        
        // Validate that the parsed YAML matches PageContent structure
        if (!parsedYaml || typeof parsedYaml !== 'object') {
          throw new Error('Invalid YAML structure: expected object at root level');
        }
        
        // Process images before assigning to pageContent
        pageContent = processImagesInContent(parsedYaml, contentDir) as PageContent;
      } catch (yamlError) {
        console.error(`Error parsing YAML content in ${contentPath}:`, yamlError);
        throw new Error(`Failed to parse YAML content: ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`);
      }

      // Load site config
      const configPath = findConfigFile();
      if (!configPath) {
        console.warn('Stackwright config file not found');
      return {
        notFound: true,
      };
    }

      const stackwrightConfigContent = fs.readFileSync(configPath, 'utf8');

      let siteConfig: SiteConfig;
      try {
        const parsedConfigYaml = yaml.load(stackwrightConfigContent);

        if (!parsedConfigYaml || typeof parsedConfigYaml !== 'object') {
          throw new Error('Invalid YAML structure: expected object at root level');
        }

        // Process images in config before assigning to siteConfig
        siteConfig = processImagesInConfig(parsedConfigYaml) as SiteConfig;

      } catch (yamlError) {
        console.error(`Error parsing YAML content in ${configPath}:`, yamlError);
        throw new Error(`Failed to parse YAML content: ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`);
      }

      return {
        props: {
          pageContent,
          siteConfig,
        },
        revalidate: 3600,
      };
    } catch (error) {
      console.error(`Error loading content for slug "${slugPath}":`, error);
      
      return {
        notFound: true,
      };
    }
  }) as GetStaticProps,
};
