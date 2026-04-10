const { createStackwrightNextConfig } = require("@stackwright/nextjs");

module.exports = createStackwrightNextConfig({
    transpilePackages: [
        "@stackwright/core",
        "@stackwright/nextjs",
        "@stackwright/themes",
        "@stackwright/types",
    ],
    // Enable static export for R2/CDN hosting
    output: 'export',
    // Images must be unoptimized for static export
    images: {
        unoptimized: true,
    },
    // Add trailing slash so URLs work without requiring explicit trailing slashes on R2/CDN hosting
    trailingSlash: true,
});
