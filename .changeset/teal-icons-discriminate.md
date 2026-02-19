---
"@stackwright/types": minor
"@stackwright/core": minor
"@stackwright/icons": minor
---

Add icon_grid content type, MediaItem type discriminator, and fix icon hydration

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
