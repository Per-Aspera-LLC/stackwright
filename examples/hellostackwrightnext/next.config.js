/** @type {import('next').NextConfig} */

// TODO: Replace this with createStackwrightNextConfig() from @stackwright/nextjs
// when ES module/CommonJS issues are resolved
const nextConfig = {
  experimental: {
    esmExternals: true,
  },
  transpilePackages: [
    '@stackwright/core',
    '@stackwright/nextjs',
    '@stackwright/themes',
    '@stackwright/types'
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      // Enable watching of YAML files for hot reloading
      config.watchOptions = {
        ...config.watchOptions,
        // Remove YAML files from ignored patterns
        ignored: config.watchOptions?.ignored?.filter?.(ignore => {
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
};

module.exports = nextConfig;