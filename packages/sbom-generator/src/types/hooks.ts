/**
 * SBOM Hook Types
 *
 * Hooks allow Pro packages to extend SBOM generation with:
 * - Vulnerability enrichment (OSV/NVD)
 * - SBOM signing (sigstore/cosign)
 * - SLSA provenance attestation
 * - Registry publishing
 */

import type { StackwrightProjectInfo, NormalizedDependency } from '../types';

/**
 * Hook types representing lifecycle points in SBOM generation
 */
export type SBOMHookType =
  | 'preGenerate' // Before any analysis begins
  | 'postAnalyze' // After dependency analysis, before format generation
  | 'preFormat' // Before each format generation (runs per format)
  | 'postFormat' // After each format generation (runs per format)
  | 'preWrite' // Before writing files to disk
  | 'postWrite'; // After all files written

/**
 * Forward declaration for SBOMFormat - actual type defined in generator.ts
 * Using string union for compatibility
 */
export type SBOMFormat = 'spdx' | 'cyclonedx' | 'build-manifest';

/**
 * A single SBOM hook
 */
export interface SBOMHook {
  /** Lifecycle point when hook runs */
  type: SBOMHookType;
  /** Unique name for the hook */
  name: string;
  /** Lower priority = runs first (default: 50) */
  priority?: number;
  /** If true, hook failure fails entire SBOM generation (default: false) */
  critical?: boolean;
  /** Hook handler function */
  handler: (context: SBOMHookContext) => Promise<void> | void;
}

/**
 * Hook registration options
 */
export interface SBOMHookOptions extends Partial<SBOMHook> {
  type: SBOMHookType;
  name: string;
}

/**
 * Context passed to all hooks
 */
export interface SBOMHookContext {
  /** Project root directory */
  projectRoot: string;
  /** Output formats being generated */
  formats: SBOMFormat[];
  /** Output directory path */
  outputDir: string;
  /** Project metadata (available after postAnalyze) */
  project?: StackwrightProjectInfo;
  /** Dependencies list (available after postAnalyze) */
  dependencies?: NormalizedDependency[];
  /** Generated SBOM documents */
  spdx?: any;
  cyclonedx?: any;
  buildManifest?: any;
  /** Full SBOM object (available during format generation and write) */
  sbom?: any;
  /** Output files written to disk (available after postWrite) */
  outputFiles?: string[];
  /** Additional properties hooks can add */
  [key: string]: any;
}
