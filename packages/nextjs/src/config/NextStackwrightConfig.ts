import type { NextConfig } from 'next';

/**
 * Creates a Next.js configuration with Stackwright optimizations.
 * Includes Turbopack compatibility for Next.js 16+.
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
          ignored:
            config.watchOptions?.ignored?.filter?.((ignore: any) => {
              const ignoreStr = ignore?.toString?.() || '';
              return !ignoreStr.includes('.yml') && !ignoreStr.includes('.yaml');
            }) || [],
        };

        config.resolve.extensions = [...config.resolve.extensions, '.yml', '.yaml'];
      }

      return config;
    },

    experimental: {
      ...userConfig.experimental,
    },

    // Required alongside webpack in Next.js 16+ to silence the
    // "webpack config with no turbopack config" error.
    turbopack: {
      ...userConfig.turbopack,
    },
  };
}
