---
"@stackwright/sbom-generator": minor
"@stackwright/build-scripts": minor
"@stackwright/cli": minor
---

feat: Add SBOM generation for supply chain transparency

Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
- SPDX 2.3 format (US Government compliance)
- CycloneDX 1.5 format (OWASP tooling compatibility)
- Stackwright build manifest (internal format)

New CLI commands:
- `stackwright sbom generate` - Regenerate SBOM
- `stackwright sbom validate` - Validate SBOM schemas
- `stackwright sbom diff` - Compare SBOMs between builds

Use `--no-sbom` flag to skip generation if needed.
