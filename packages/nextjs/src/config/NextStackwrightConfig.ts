import type { NextConfig } from 'next';

/**
 * Creates a Next.js configuration with Stackwright optimizations
 * including hot reloading for YAML files
 */
export function createStackwrightNextConfig(userConfig: NextConfig = {}): NextConfig {
  return {
    ...userConfig,
    webpack: (config, context) => {
      const { dev } = context;
      
      // Apply user's webpack config first if it exists
      if (userConfig.webpack) {
        config = userConfig.webpack(config, context);
      }
      
      if (dev) {
        // Enable watching of YAML files for hot reloading
        config.watchOptions = {
          ...config.watchOptions,
          // Remove YAML files from ignored patterns
          ignored: config.watchOptions?.ignored?.filter?.((ignore: any) => {
            const ignoreStr = ignore?.toString?.() || '';
            return !ignoreStr.includes('.yml') && !ignoreStr.includes('.yaml');
          }) || [],
        };
        
        // Add YAML extensions to resolve
        config.resolve.extensions = [
          ...config.resolve.extensions,
          '.yml', 
          '.yaml'
        ];
      }
      
      return config;
    },
    
    // Merge experimental options
    experimental: {
      ...userConfig.experimental,
      esmExternals: true,
    },
  };
}