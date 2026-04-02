/**
 * Shared types for SBOM generator
 * @package @stackwright/sbom-generator
 */

// Re-export from normalizers for convenience
export type { StackwrightProjectInfo } from './normalizers/stackwright';
export type { NormalizedDependency } from './normalizers/pnpm';

// Re-export from formats
export type { SPDXDocument, SPDXPackage, SPDXRelationship } from './formats/spdx';
export type { CycloneDXDocument, CycloneDXComponent } from './formats/cyclonedx';
export type { BuildManifest } from './formats/build-manifest';
