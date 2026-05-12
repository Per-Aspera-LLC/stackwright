---
"@stackwright/core": patch
"@stackwright/build-scripts": patch
"@stackwright/collections": patch
"@stackwright/hooks-registry": patch
"@stackwright/icons": patch
"launch-stackwright": patch
"@stackwright/maplibre": patch
"@stackwright/mcp": patch
"@stackwright/nextjs": patch
"@stackwright/otters": patch
"@stackwright/scaffold-core": patch
"@stackwright/sbom-generator": patch
"@stackwright/themes": patch
"@stackwright/types": patch
"@stackwright/ui-shadcn": patch
---

Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.
