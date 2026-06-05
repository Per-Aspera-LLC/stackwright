---
"@stackwright/build-scripts": patch
"@stackwright/sbom-generator": patch
---

fix(sbom): write SBOM files to `.stackwright/sbom/` instead of project root; fix pnpm lockfile v9 parsing that produced 0 dependencies in all SBOMs
