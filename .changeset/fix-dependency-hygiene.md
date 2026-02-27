---
"@stackwright/nextjs": patch
"@stackwright/core": patch
"@stackwright/icons": patch
"@stackwright/themes": patch
"@stackwright/types": patch
"@stackwright/cli": patch
---

fix(deps): dependency hygiene pass — fix peer dep declarations and security floor

- **@stackwright/nextjs**: Remove `next`, `react`, `react-dom` from `dependencies` (they belong only in `peerDependencies` to avoid duplicate installs); bump Next.js peer dep floor from `>=15.2.3` to `>=16.1.6`, targeting the current stable release and closing all open GitHub security advisories (CVEs patched in 15.2.6–15.5.10); add `next`/`react`/`react-dom` to `devDependencies` for local builds
- **@stackwright/core**: Remove `react`, `react-dom`, `@mui/material`, `@mui/icons-material` from `dependencies` — these were duplicated in `peerDependencies`, risking duplicate React/MUI instances; move them to `devDependencies` for test builds; loosen `@mui` peer dep range from exact `7.3.8` to `^7.3.8`
- **@stackwright/icons**: Declare `@mui/icons-material`, `@mui/material`, `react` as `peerDependencies` (they were only in `dependencies`); move to `devDependencies` for local builds
- **@stackwright/themes**: Remove `react` from `dependencies`; add as `peerDependency` and `devDependency`
- **@stackwright/types**: Remove spurious `"@stackwright/types": "link:"` self-reference from `dependencies`
- **@stackwright/cli**: Align `@types/node` devDep to `^24.1` (matches root pnpm override; was incorrectly `^25.3`)
- **workspace root**: Fix stale `vitest` override (`^3.2.4` → `^4.0.18`; was fighting explicit package-level declarations and causing peer dep warnings); add `react`/`react-dom` overrides pinned to `19.2.4` to guarantee a single React instance across all workspace packages
