# @stackwright/types

## 0.2.0

### Minor Changes

- ae26492: Add icon_grid content type, MediaItem type discriminator, and fix icon hydration

  **@stackwright/types**

  - `IconContent` gains required `type: "icon"` discriminator field
  - `ImageContent` gains required `type: "image"` discriminator field
  - `MediaItem` union is now properly discriminated for TypeScript narrowing

  **@stackwright/core**

  - New `IconGrid` component renders a responsive grid of registry-keyed icons with labels
  - `icon_grid` registered in `componentRegistry`; removed unreachable special-case in `contentRenderer`
  - `Media` now dispatches on `type` field first; string heuristics kept as fallback with deprecation warning
  - `MainContentGrid`: removed unsafe `as ImageContent` cast; spreads `content.media` directly
  - Removed `require('@mui/icons-material')` dynamic require from `Media` (caused SSR/client hydration mismatch)

  **@stackwright/icons**

  - New `muiIcons.ts` preset with 20 statically imported MUI icons, merged into `registerDefaultIcons()`
  - Fixes hydration mismatch: icons now resolve identically on server and client via registry
  - `AGENTS.md` rewritten with icon registration workflow, hydration constraint explanation, and full registered-icon reference table
  - Fixed self-referencing `@stackwright/icons: link:` in package.json

### Patch Changes

- dc2db25: Adding null checks to core
- 51dbbc9: Refactor types out of core into own package.
- 46df7ac: Documentation updates
- e4fbf2f: Update all dependencies
- cc761ce: More version updates
- Updated dependencies [dc2db25]
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [51dbbc9]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
- Updated dependencies [46df7ac]
- Updated dependencies [e4fbf2f]
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1

## 0.1.1-alpha.4

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/themes@0.3.1-alpha.5

## 0.1.1-alpha.3

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1-alpha.4

## 0.1.1-alpha.2

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/themes@0.3.1-alpha.3

## 0.1.1-alpha.1

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/themes@0.3.1-alpha.2

## 0.1.1-alpha.0

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/themes@0.3.1-alpha.1
