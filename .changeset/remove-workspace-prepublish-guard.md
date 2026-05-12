---
"@stackwright/build-scripts": patch
"@stackwright/ui-shadcn": patch
"@stackwright/mcp": patch
"@stackwright/sbom-generator": patch
"@stackwright/core": patch
"@stackwright/nextjs": patch
"@stackwright/icons": patch
"@stackwright/hooks-registry": patch
"@stackwright/types": patch
"launch-stackwright": patch
"@stackwright/collections": patch
"@stackwright/maplibre": patch
"@stackwright/themes": patch
"@stackwright/scaffold-core": patch
"@stackwright/cli": patch
"@stackwright/otters": patch
---

Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
