const { createStackwrightNextConfig } = require('@stackwright/nextjs');

module.exports = createStackwrightNextConfig({
  transpilePackages: [
    '@stackwright/core',
    '@stackwright/nextjs',
    '@stackwright/themes',
    '@stackwright/types',
  ],
});
