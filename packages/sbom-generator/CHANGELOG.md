# @stackwright/sbom-generator

## 0.1.0-alpha.0

### Minor Changes

- 24fed0f: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

- 24fed0f: feat: Add pluggable hook system for SBOM extensibility

  Pro packages can now register hooks to extend SBOM generation:
  - `preGenerate` / `postAnalyze` / `preFormat` / `postFormat` / `preWrite` / `postWrite`

  Hook types:
  - `priority`: Controls execution order (lower = first)
  - `critical`: If true, failure fails entire SBOM generation

  Auto-registration pattern (consistent with registerNextJSComponents, etc.):

  ```typescript
  import '@stackwright-pro/sbom-enterprise'; // auto-registers hooks
  ```
