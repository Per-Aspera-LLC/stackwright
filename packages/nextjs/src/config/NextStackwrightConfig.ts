import type { NextConfig } from 'next';
import {
  buildSecurityHeaders,
  createSecurityHeadersConfig,
  type SecurityHeader,
  type SecurityHeadersOptions,
} from './security';

/**
 * Creates a Next.js configuration with Stackwright optimizations.
 * Includes Turbopack compatibility for Next.js 16+.
 */
export interface StackwrightNextConfigOptions extends NextConfig {
  securityHeaders?: SecurityHeadersOptions;
}

export function createStackwrightNextConfig(
  userConfig: StackwrightNextConfigOptions = {}
): NextConfig {
  const { ...restConfig } = userConfig;

  return {
    ...restConfig,
    webpack: (config, context) => {
      const { dev } = context;

      // Apply user's webpack config first if it exists
      if (restConfig.webpack) {
        config = restConfig.webpack(config, context);
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
      ...restConfig.experimental,
    },

    // Required alongside webpack in Next.js 16+ to silence the
    // "webpack config with no turbopack config" error.
    turbopack: {
      ...restConfig.turbopack,
    },
  };
}

/**
 * Next.js headers configuration for security headers.
 * Can be exported directly from next.config.ts.
 */
export async function headers() {
  return createSecurityHeadersConfig();
}

// Re-export for convenience
export { createSecurityHeadersConfig };
