# @stackwright/icons

## 0.2.1

### Patch Changes

- 386acb8: chore(deps): batch dependency maintenance — February 2026

  - `@mui/material` + `@mui/icons-material`: 7.2.0 → 7.3.8 (patch)
  - `@fontsource/montserrat-alternates`: 5.2.6 → 5.2.8 (patch)
  - `uuid`: ^11.1.0 → ^13.0.0 (major — API unchanged for v4/v7 usage)
  - `@inquirer/prompts`: ^7.0.0 → ^8.3.0 (major — updated call sites)
  - `jsdom`: ^26.1.0 → ^28.1.0 (major, devDep)
  - `vitest`: ^3.2.4 → ^4.0.18 across all packages (major, devDep)
  - `tsx`: ^4.0.0 → ^4.21.0 (patch, devDep)
  - `typescript-json-schema`: ^0.65.1 → ^0.67.1 (patch, devDep)
  - `@testing-library/jest-dom`: ^6.6 → ^6.9 (patch, devDep)
  - `chalk`: ^5.4.0 → ^5.6.2 (patch)
  - `@types/node`: ^24.1 → ^25.3 (major, devDep)

  Note: eslint held at ^9.39.2 in examples/hellostackwrightnext — eslint v10
  is not yet supported by eslint-config-next / eslint-plugin-import.

## 0.2.1-alpha.0

### Patch Changes

- 386acb8: chore(deps): batch dependency maintenance — February 2026

  - `@mui/material` + `@mui/icons-material`: 7.2.0 → 7.3.8 (patch)
  - `@fontsource/montserrat-alternates`: 5.2.6 → 5.2.8 (patch)
  - `uuid`: ^11.1.0 → ^13.0.0 (major — API unchanged for v4/v7 usage)
  - `@inquirer/prompts`: ^7.0.0 → ^8.3.0 (major — updated call sites)
  - `jsdom`: ^26.1.0 → ^28.1.0 (major, devDep)
  - `vitest`: ^3.2.4 → ^4.0.18 across all packages (major, devDep)
  - `tsx`: ^4.0.0 → ^4.21.0 (patch, devDep)
  - `typescript-json-schema`: ^0.65.1 → ^0.67.1 (patch, devDep)
  - `@testing-library/jest-dom`: ^6.6 → ^6.9 (patch, devDep)
  - `chalk`: ^5.4.0 → ^5.6.2 (patch)
  - `@types/node`: ^24.1 → ^25.3 (major, devDep)

  Note: eslint held at ^9.39.2 in examples/hellostackwrightnext — eslint v10
  is not yet supported by eslint-config-next / eslint-plugin-import.

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
