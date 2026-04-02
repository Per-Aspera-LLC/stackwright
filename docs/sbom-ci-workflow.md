# SBOM CI Integration Guide

## Overview

Stackwright automatically generates SBOM (Software Bill of Materials) for every build via `stackwright-prebuild`. This guide covers CI integration for artifact upload and validation.

## GitHub Actions Example

```yaml
name: Build and Generate SBOM

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main, dev]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build project
        run: pnpm build
        # SBOM is generated automatically during prebuild
        
      - name: Upload SBOM artifacts
        uses: actions/upload-artifact@v4
        with:
          name: sbom-artifacts
          path: |
            .stackwright/sbom/*.json
            .stackwright/sbom/*.xml
          retention-days: 30
          
      - name: Validate SBOM
        run: pnpm stackwright -- sbom validate
```

## SBOM Formats Generated

| Format | File | Use Case |
|--------|------|----------|
| SPDX JSON | `build-manifest.spdx.json` | US Government compliance (EO 14028) |
| CycloneDX JSON | `build-manifest.cyclonedx.json` | OWASP tooling, SCA tools |
| Build Manifest | `build-manifest.json` | Stackwright internal use |

## Output Location

SBOM files are written to `.stackwright/sbom/` in the project root.

## Validation

Run `pnpm stackwright -- sbom validate` to validate generated SBOMs against their schemas.

## Options

- `--no-sbom`: Skip SBOM generation (rarely needed)
- `pnpm stackwright -- sbom diff`: Compare SBOMs between builds

## Security Benefits

- **Supply chain transparency**: Every dependency is documented
- **Vulnerability tracking**: Known CVEs can be mapped to SBOM entries
- **Compliance**: Meets requirements for EO 14028, NIST SSDF, NDAA § 5722
- **Auditing**: Complete dependency audit trail for every build