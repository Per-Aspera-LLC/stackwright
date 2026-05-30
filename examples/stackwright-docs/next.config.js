const { createStackwrightNextConfig } = require("@stackwright/nextjs");

const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(createStackwrightNextConfig({
    // In App Router, workspace packages are typically bundled automatically.
    // Keeping transpilePackages for safety in a pnpm workspace monorepo.
    // TODO: test removing this — if the build still works, it can be dropped.
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
}));
