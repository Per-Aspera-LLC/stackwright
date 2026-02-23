# @stackwright/nextjs

## 0.2.1-alpha.6

### Patch Changes

- 8910585: Next.js 16 / Turbopack compatibility and prebuild pipeline

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

- Updated dependencies [8910585]
  - @stackwright/core@0.3.1-alpha.6

## 0.2.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/core@0.3.1-alpha.5

## 0.2.1-alpha.4

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/core@0.3.1-alpha.4

## 0.2.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/core@0.3.1-alpha.3

## 0.2.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/core@0.3.1-alpha.2

## 0.2.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/core@0.3.1-alpha.1

## 0.2.1-alpha.0

### Patch Changes

- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
  - @stackwright/core@0.3.1-alpha.0

## 0.1.2

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
- Updated dependencies [78a02d1]
- Updated dependencies [d66fda6]
  - @stackwright/core@0.2.2

## 0.1.1

### Patch Changes

- Updated dependencies [dcbbb62]
  - @stackwright/core@0.2.1
