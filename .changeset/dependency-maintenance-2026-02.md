---
"@stackwright/core": patch
"@stackwright/cli": patch
"@stackwright/icons": patch
"@stackwright/types": patch
"@stackwright/themes": patch
"@stackwright/nextjs": patch
"@stackwright/build-scripts": patch
---

chore(deps): batch dependency maintenance — February 2026

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
