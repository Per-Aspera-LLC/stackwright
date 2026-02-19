---
"@stackwright/build-scripts": minor
"@stackwright/nextjs": patch
"@stackwright/core": patch
---

Next.js 16 / Turbopack compatibility and prebuild pipeline

**New package: `@stackwright/build-scripts`**
- Introduces `stackwright-prebuild` CLI binary for build-time YAML processing
- Scans `pages/` for `content.yml` files, copies co-located images to `public/images/`, and writes processed JSON to `public/stackwright-content/`
- Eliminates all `fs`/`path` usage from `@stackwright/nextjs`, resolving Turbopack browser-bundle conflicts
- Add `"prebuild": "stackwright-prebuild"` and `"predev": "stackwright-prebuild"` to your `package.json` scripts; `getStaticProps` then reads from `public/stackwright-content/*.json`

**`@stackwright/nextjs`**
- `NextStackwrightStaticGeneration` removed — static generation is now handled by the prebuild pipeline above
- `createStackwrightNextConfig` adds `turbopack: {}` for Next.js 16+ (silences webpack-without-turbopack warning)
- Remove `shallow` prop from `StackwrightLinkProps` and `NextStackwrightLink` (removed from `next/link` in Next.js 13)
- Widen peer dependency to `next: ">=15"` to cover Next.js 16+

**`@stackwright/core`**
- Remove `shallow` from `StackwrightLinkProps` interface
- Pin workspace `csstype` to `^3.2.0` via pnpm override to resolve DTS build conflict
