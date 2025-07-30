/** @type {import('next').NextConfig} */
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
}

module.exports = nextConfig