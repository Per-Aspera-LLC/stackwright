# @stackwright/sbom-generator

## 0.2.2

### Patch Changes

- a931eb3: fix(sbom): write SBOM files to `.stackwright/sbom/` instead of project root; fix pnpm lockfile v9 parsing that produced 0 dependencies in all SBOMs

## 0.2.2-alpha.0

### Patch Changes

- 2eba549: fix(sbom): write SBOM files to `.stackwright/sbom/` instead of project root; fix pnpm lockfile v9 parsing that produced 0 dependencies in all SBOMs

## 0.2.1

### Patch Changes

- f1637a6: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.
- d4a06ff: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.2.1-alpha.1

### Patch Changes

- adb13ae: Remove `prepublishOnly` workspace: specifier guard that conflicted with `pnpm publish`'s automatic `workspace:*` → semver resolution. The guard checked the local `package.json` for `workspace:*` entries and rejected them, but `pnpm publish` rewrites those specifiers inside the tarball at publish time without modifying the local file — so the guard always produced false positives and blocked all publishes.

## 0.2.1-alpha.0

### Patch Changes

- c18b6a1: Add `prepublishOnly` workspace protocol guard to all publishable packages to prevent accidentally publishing with unresolved `workspace:*` specifiers.

  Also removes a stale `@stackwright/collections` dependency from `@stackwright/core` (never imported, caused `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` when installing the published package), and fixes `@stackwright/maplibre` peer dependency on `@stackwright/core` from `workspace:*` to `>=0.8.0`.

## 0.2.0

### Minor Changes

- 8f34fd6: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

- 8f34fd6: feat: Add pluggable hook system for SBOM extensibility

  Pro packages can now register hooks to extend SBOM generation:
  - `preGenerate` / `postAnalyze` / `preFormat` / `postFormat` / `preWrite` / `postWrite`

  Hook types:
  - `priority`: Controls execution order (lower = first)
  - `critical`: If true, failure fails entire SBOM generation

  Auto-registration pattern (consistent with registerNextJSComponents, etc.):

  ```typescript
  import '@stackwright-pro/sbom-enterprise'; // auto-registers hooks
  ```

## 0.1.0

### Minor Changes

- c1ca6ed: feat: Add SBOM generation for supply chain transparency

  Every Stackwright build now generates a Software Bill of Materials (SBOM) with:
  - SPDX 2.3 format (US Government compliance)
  - CycloneDX 1.5 format (OWASP tooling compatibility)
  - Stackwright build manifest (internal format)

  New CLI commands:
  - `stackwright sbom generate` - Regenerate SBOM
  - `stackwright sbom validate` - Validate SBOM schemas
  - `stackwright sbom diff` - Compare SBOMs between builds

  Use `--no-sbom` flag to skip generation if needed.

- c1ca6ed: feat: Add pluggable hook system for SBOM extensibility

  Pro packages can now register hooks to extend SBOM generation:
  - `preGenerate` / `postAnalyze` / `preFormat` / `postFormat` / `preWrite` / `postWrite`

  Hook types:
  - `priority`: Controls execution order (lower = first)
  - `critical`: If true, failure fails entire SBOM generation

  Auto-registration pattern (consistent with registerNextJSComponents, etc.):

  ```typescript
  import '@stackwright-pro/sbom-enterprise'; // auto-registers hooks
  ```

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
