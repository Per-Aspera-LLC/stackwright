/**
 * @stackwright/sbom-generator
 *
 * SBOM generation for Stackwright projects
 * Supports SPDX 2.3, CycloneDX 1.5, and Stackwright-specific build manifest formats
 */

// Core generation API
export {
  createSBOM,
  generateDefaultSBOM,
  quickSummary,
  type SBOM,
  type SBOMOptions,
  type SBOMFormat,
  type SBOMSummary,
} from './generator';

// Re-export types for consumers
export type { StackwrightProjectInfo } from './normalizers/stackwright';
export type { NormalizedDependency } from './normalizers/pnpm';
export type { SPDXDocument } from './formats/spdx';
export type { CycloneDXDocument } from './formats/cyclonedx';
export type { BuildManifest } from './formats/build-manifest';

// Utility functions
export { sha256, sha256File, sha256SRI, verifySHA256 } from './utils/hash';

export { createPURL, npmPURL, githubPURL, parsePURL } from './utils/purl';

// Normalizer utilities
export {
  normalizeVersion,
  parseLockfilePackages,
  getDirectDependencies,
  categorizeDependencies,
} from './normalizers/pnpm';

export {
  isStackwrightPackage,
  getStackwrightPackageType,
  readPackageManifest,
  findWorkspacePackages,
  getPackageIdentifier,
} from './normalizers/stackwright';

// Format generators (for advanced use cases)
export { generateSPDX, toSPDXJSON, toSPDXTV, validateSPDX } from './formats/spdx';

export { generateCycloneDX, toCycloneDXJSON, validateCycloneDX } from './formats/cyclonedx';

export {
  generateBuildManifest,
  toBuildManifestJSON,
  validateBuildManifest,
  getManifestSummary,
  BuildManifestSchema,
} from './formats/build-manifest';

// Hook types and registry
export type { SBOMHook, SBOMHookType, SBOMHookContext, SBOMHookOptions } from './types/hooks';
export { registerSBOMHook, getSBOMHooks, clearSBOMHooks, runSBOMHooks } from './registry';
