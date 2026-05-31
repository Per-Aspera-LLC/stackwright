const { createStackwrightNextConfig } = require("@stackwright/nextjs");

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(createStackwrightNextConfig({
    // Enable static export for R2/CDN hosting
    output: 'export',
    // Images must be unoptimized for static export
    images: {
        unoptimized: true,
    },
    // Add trailing slash so URLs work without requiring explicit trailing slashes on R2/CDN hosting
    trailingSlash: true,
}));
