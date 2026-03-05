# @stackwright/cli

## 0.6.0-alpha.1

### Patch Changes

- 6820928: Move JSON schema output from `dist/schemas/` to `schemas/` (committed to git) so CI can detect drift. Update package exports and `files` field. Update scaffold `.vscode/settings.json` to reference the new schema path.
- Updated dependencies [6820928]
  - @stackwright/types@0.3.2-alpha.0
  - @stackwright/build-scripts@0.2.2-alpha.0

## 0.6.0-alpha.0

### Minor Changes

- 4efd19a: feat(cli): add `generate-agent-docs` command to auto-generate AGENTS.md content type reference tables from live Zod schemas (closes #83)

  - New `pnpm stackwright -- generate-agent-docs` command introspects Zod schemas at runtime and regenerates the content type reference tables in `/AGENTS.md` and `examples/hellostackwrightnext/AGENTS.md`
  - Tables are delimited by `<!-- stackwright:content-type-table:start/end -->` HTML comment markers; non-table content is preserved
  - Schema name registry maps Zod schema object references to human-readable type names (TextBlock, MediaItem, etc.) for readable output
  - Fixed `resolveSchema` to correctly handle `optional(lazy(...))` wrapper nesting (fixes `tabbed_content` showing empty fields)
  - CI job `check-agent-docs` runs the generator and fails with an actionable message if AGENTS.md is out of sync
  - `generateAgentDocs()` exported from `@stackwright/cli` for programmatic use

## 0.5.1

### Patch Changes

- Updated dependencies
  - @stackwright/themes@0.4.1
  - @stackwright/types@0.3.1
  - @stackwright/build-scripts@0.2.1

## 0.5.0

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- 750f84a: Patch bump for core package import fixes.
- 4a15246: refactor(cli): replace dynamic require() with static imports for sub-type schema introspection

  Sub-type schemas are now imported statically from @stackwright/types, making the
  dependency explicit and eliminating the silent-drop risk when a schema is renamed.

- Updated dependencies [750f84a]
- Updated dependencies [ce372ed]
- Updated dependencies [36dd46c]
- Updated dependencies [1c35939]
  - @stackwright/themes@0.4.0
  - @stackwright/types@0.3.0
  - @stackwright/build-scripts@0.2.0

## 0.5.0-alpha.2

### Patch Changes

- 4a15246: refactor(cli): replace dynamic require() with static imports for sub-type schema introspection

  Sub-type schemas are now imported statically from @stackwright/types, making the
  dependency explicit and eliminating the silent-drop risk when a schema is renamed.

- Updated dependencies [ce372ed]
  - @stackwright/types@0.3.0-alpha.2
  - @stackwright/build-scripts@0.2.0-alpha.1

## 0.5.0-alpha.1

### Minor Changes

- 1c35939: Migrate grammar to Zod as single source of truth

  Replace hand-written TypeScript interfaces and `typescript-json-schema` with Zod schemas across `@stackwright/types` and `@stackwright/themes`. TypeScript types are now inferred via `z.infer<>`. JSON schemas for IDE YAML validation are generated via `zod-to-json-schema` instead of `typescript-json-schema`. The CLI replaces AJV with Zod's `safeParse` for page and site validation. All Zod schemas are exported from their respective packages, enabling runtime grammar introspection for future MCP tooling and runtime validation.

### Patch Changes

- Updated dependencies [36dd46c]
- Updated dependencies [1c35939]
  - @stackwright/build-scripts@0.2.0-alpha.0
  - @stackwright/types@0.3.0-alpha.1
  - @stackwright/themes@0.4.0-alpha.1

## 0.4.3-alpha.0

### Patch Changes

- Patch bump for core package import fixes.
- Updated dependencies
  - @stackwright/themes@0.3.4-alpha.0
  - @stackwright/types@0.2.3-alpha.0

## 0.4.2

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor

  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

- Updated dependencies [076c9e7]
  - @stackwright/themes@0.3.3
  - @stackwright/types@0.2.2

## 0.4.2-alpha.0

### Patch Changes

- 076c9e7: fix(deps): dependency hygiene pass — fix peer dep declarations and security floor

  - **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
  - **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
  - **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
  - **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
  - **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
  - **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
  - **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages

- Updated dependencies [076c9e7]
  - @stackwright/themes@0.3.3-alpha.0
  - @stackwright/types@0.2.2-alpha.0

## 0.4.1

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

- Updated dependencies [386acb8]
  - @stackwright/types@0.2.1
  - @stackwright/themes@0.3.2
  - @stackwright/build-scripts@0.1.2

## 0.4.1-alpha.0

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

- Updated dependencies [386acb8]
  - @stackwright/types@0.2.1-alpha.0
  - @stackwright/themes@0.3.2-alpha.0
  - @stackwright/build-scripts@0.1.2-alpha.0

## 0.4.0

### Minor Changes

- 9e08684: Modernize scaffold template to match current project conventions.

  New projects created with `stackwright scaffold` now:

  - Include a `getting-started/` starter page alongside the root page, demonstrating the subdirectory-per-slug convention
  - Scaffold `stackwright.yml` with a full `customTheme` block (colors, typography, spacing) instead of a bare `themeName` reference
  - Include a CTA button on the root page linking to the getting-started page
  - Use the secure `[slug].tsx` template with slug allowlist validation (path traversal prevention)
  - Include `pnpm` engine spec (`>=10.0.0`) and `packageManager` field in `package.json`
  - Have an enriched `.env.local.example` with copy instructions and clearer comments
  - Have a WSL-annotated `.gitignore`

## 0.3.2

### Patch Changes

- Updated dependencies [4c964f1]
  - @stackwright/build-scripts@0.1.1

## 0.3.1

### Patch Changes

- dc2db25: Adding null checks to core
- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- 51dbbc9: Refactor types out of core into own package.
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- 46df7ac: Documentation updates
- e4fbf2f: Update all dependencies
- cc761ce: More version updates
- Updated dependencies [dc2db25]
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [51dbbc9]
- Updated dependencies [f195337]
- Updated dependencies [8910585]
- Updated dependencies [5ff20a6]
- Updated dependencies [46df7ac]
- Updated dependencies [e4fbf2f]
- Updated dependencies [ae26492]
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1
  - @stackwright/core@0.4.0

## 0.3.1-alpha.6

### Patch Changes

- Updated dependencies [8910585]
  - @stackwright/core@0.3.1-alpha.6

## 0.3.1-alpha.5

### Patch Changes

- dc2db25: Adding null checks to core
- Updated dependencies [dc2db25]
  - @stackwright/themes@0.3.1-alpha.5
  - @stackwright/core@0.3.1-alpha.5

## 0.3.1-alpha.4

### Patch Changes

- cc761ce: More version updates
- Updated dependencies [cc761ce]
  - @stackwright/themes@0.3.1-alpha.4
  - @stackwright/core@0.3.1-alpha.4

## 0.3.1-alpha.3

### Patch Changes

- e4fbf2f: Update all dependencies
- Updated dependencies [e4fbf2f]
  - @stackwright/themes@0.3.1-alpha.3
  - @stackwright/core@0.3.1-alpha.3

## 0.3.1-alpha.2

### Patch Changes

- 46df7ac: Documentation updates
- Updated dependencies [46df7ac]
  - @stackwright/themes@0.3.1-alpha.2
  - @stackwright/core@0.3.1-alpha.2

## 0.3.1-alpha.1

### Patch Changes

- 51dbbc9: Refactor types out of core into own package.
- Updated dependencies [51dbbc9]
  - @stackwright/themes@0.3.1-alpha.1
  - @stackwright/core@0.3.1-alpha.1

## 0.3.1-alpha.0

### Patch Changes

- bd7cd6e: Internal packagename refactor.
- ca71410: Core testing implemented
- f195337: Adding test dependencies to all packages.
- 5ff20a6: Fixing mixed compilation tooling (tsup/tsc) to only tsup
- Updated dependencies [bd7cd6e]
- Updated dependencies [ca71410]
- Updated dependencies [f195337]
- Updated dependencies [5ff20a6]
  - @stackwright/themes@0.3.1-alpha.0
  - @stackwright/core@0.3.1-alpha.0

## 0.2.2

### Patch Changes

- 78a02d1: "testing beta tagging"
- d66fda6: Bump to test github publish action
- Updated dependencies [78a02d1]
- Updated dependencies [d66fda6]
  - @stackwright/core@0.2.2
  - @stackwright/themes@0.2.1

## 0.2.1

### Patch Changes

- Updated dependencies [dcbbb62]
  - @stackwright/core@0.2.1
