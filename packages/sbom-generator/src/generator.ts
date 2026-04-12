/**
 * Main SBOM generation orchestrator
 * @package @stackwright/sbom-generator
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyzeDependencies } from './analyzer';
import { StackwrightProjectInfo, NormalizedDependency } from './types';
import { generateSPDX, toSPDXJSON, toSPDXTV, SPDXDocument } from './formats/spdx';
import { generateCycloneDX, toCycloneDXJSON, CycloneDXDocument } from './formats/cyclonedx';
import {
  generateBuildManifest,
  toBuildManifestJSON,
  BuildManifest,
} from './formats/build-manifest';
import { runSBOMHooks } from './registry';
import type { SBOMHookContext } from './types/hooks';

// Re-export types from normalizers
export type { StackwrightProjectInfo } from './normalizers/stackwright';
export type { NormalizedDependency } from './normalizers/pnpm';

// Re-export format types
export type { SPDXDocument } from './formats/spdx';
export type { CycloneDXDocument } from './formats/cyclonedx';
export type { BuildManifest } from './formats/build-manifest';

/**
 * Supported SBOM output formats
 */
export type SBOMFormat = 'spdx' | 'cyclonedx' | 'build-manifest';

/**
 * Options for SBOM generation
 */
export interface SBOMOptions {
  /** Root directory of the project to analyze */
  projectRoot: string;
  /** Output formats to generate */
  formats: SBOMFormat[];
  /** Include development dependencies */
  includeDevDependencies?: boolean;
  /** Include peer dependencies */
  includePeerDependencies?: boolean;
  /** Output directory for generated files (default: .stackwright/sbom/) */
  outputDir?: string;
}

/**
 * Generated SBOM with all requested formats
 */
export interface SBOM {
  /** Project information */
  project: StackwrightProjectInfo;
  /** Raw dependency list */
  dependencies: NormalizedDependency[];
  /** SPDX 2.3 document (if requested) */
  spdx?: SPDXDocument;
  /** CycloneDX 1.5 document (if requested) */
  cyclonedx?: CycloneDXDocument;
  /** Stackwright build manifest (if requested) */
  buildManifest?: BuildManifest;
  /** Write all generated formats to disk */
  writeTo(outputPath: string): Promise<void>;
  /** Get summary of generated SBOM */
  getSummary(): SBOMSummary;
}

/**
 * Summary of generated SBOM
 */
export interface SBOMSummary {
  projectName: string;
  projectVersion: string;
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  transitiveDependencies: number;
  formats: SBOMFormat[];
  outputFiles: string[];
}

/**
 * Debug logging utility
 */
export function debugLog(message: string, data?: any): void {
  if (process.env.NODE_ENV === 'development' && process.env.STACKWRIGHT_DEBUG === 'true') {
    console.log(`🐶 SBOM-Generator Debug: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

/**
 * Create an SBOM for a project
 */
export async function createSBOM(options: SBOMOptions): Promise<SBOM> {
  const {
    projectRoot,
    formats,
    includeDevDependencies = false,
    includePeerDependencies = true,
  } = options;

  debugLog('Creating SBOM', { projectRoot, formats, includeDevDependencies });

  // Build base context for hooks
  const baseContext: SBOMHookContext = {
    projectRoot,
    formats,
    outputDir: options.outputDir ?? resolve(projectRoot, '.stackwright', 'sbom'),
  };

  // Run preGenerate hooks
  await runSBOMHooks('preGenerate', baseContext);

  // Analyze dependencies
  const { project, dependencies } = await analyzeDependencies({
    projectRoot,
    includeDevDependencies,
    includePeerDependencies,
  });

  debugLog('Dependencies analyzed', {
    count: dependencies.length,
    project: project.name,
  });

  // Build context with analysis results
  const context: SBOMHookContext = {
    ...baseContext,
    project,
    dependencies,
  };

  // Run postAnalyze hooks
  await runSBOMHooks('postAnalyze', context);

  // Initialize SBOM object
  const sbom: SBOM = {
    project,
    dependencies,
    writeTo: async (outputPath: string) => {
      await writeSBOM(sbom, outputPath, formats, context);
    },
    getSummary: () => getSummary(sbom, formats),
  };

  // Generate each format with pre/post format hooks
  for (const format of formats) {
    await runSBOMHooks('preFormat', { ...context, sbom });

    if (format === 'spdx') {
      debugLog('Generating SPDX format');
      sbom.spdx = generateSPDX(project, dependencies, {
        includeDevDependencies,
      });
    } else if (format === 'cyclonedx') {
      debugLog('Generating CycloneDX format');
      sbom.cyclonedx = generateCycloneDX(project, dependencies, {
        includeDevDependencies,
      });
    } else if (format === 'build-manifest') {
      debugLog('Generating build manifest format');
      sbom.buildManifest = generateBuildManifest(project, dependencies, {
        includeDevDependencies,
        includeWorkspaceInfo: true,
      });
    }

    await runSBOMHooks('postFormat', { ...context, sbom });
  }

  debugLog('SBOM generation complete', { formats });

  return sbom;
}

/**
 * Write SBOM to disk
 */
async function writeSBOM(
  sbom: SBOM,
  outputPath: string,
  formats: SBOMFormat[],
  context: SBOMHookContext
): Promise<void> {
  const baseDir = resolve(outputPath);

  // Ensure directory exists
  await mkdir(baseDir, { recursive: true });

  // Run preWrite hooks
  await runSBOMHooks('preWrite', { ...context, sbom, outputDir: outputPath });

  const outputFiles: string[] = [];

  // Write SPDX
  if (sbom.spdx && formats.includes('spdx')) {
    const spdxPath = resolve(baseDir, 'spdx.json');
    await writeFile(spdxPath, toSPDXJSON(sbom.spdx));
    outputFiles.push(spdxPath);

    const spdxTVPath = resolve(baseDir, 'spdx.spdx');
    await writeFile(spdxTVPath, toSPDXTV(sbom.spdx));
    outputFiles.push(spdxTVPath);
  }

  // Write CycloneDX
  if (sbom.cyclonedx && formats.includes('cyclonedx')) {
    const cyclonedxPath = resolve(baseDir, 'cyclonedx.json');
    await writeFile(cyclonedxPath, toCycloneDXJSON(sbom.cyclonedx));
    outputFiles.push(cyclonedxPath);
  }

  // Write Build Manifest
  if (sbom.buildManifest && formats.includes('build-manifest')) {
    const manifestPath = resolve(baseDir, 'build-manifest.json');
    await writeFile(manifestPath, toBuildManifestJSON(sbom.buildManifest));
    outputFiles.push(manifestPath);
  }

  // Run postWrite hooks
  await runSBOMHooks('postWrite', { ...context, sbom, outputFiles });

  debugLog('SBOM written to disk', { outputFiles });
}

/**
 * Get summary of SBOM
 */
function getSummary(sbom: SBOM, formats: SBOMFormat[]): SBOMSummary {
  const directDeps = sbom.dependencies.filter((d) => d.depth === 0);
  const devDeps = sbom.dependencies.filter((d) => d.isDev);
  const transitiveDeps = sbom.dependencies.filter((d) => d.depth > 0);

  return {
    projectName: sbom.project.name,
    projectVersion: sbom.project.version,
    totalDependencies: sbom.dependencies.length,
    directDependencies: directDeps.length,
    devDependencies: devDeps.length,
    transitiveDependencies: transitiveDeps.length,
    formats,
    outputFiles: [], // Will be populated after writeTo
  };
}

/**
 * Generate SBOM with default options
 */
export async function generateDefaultSBOM(projectRoot: string, outputDir?: string): Promise<SBOM> {
  const defaultOutputDir = outputDir || resolve(projectRoot, '.stackwright', 'sbom');

  return createSBOM({
    projectRoot,
    formats: ['spdx', 'cyclonedx', 'build-manifest'],
    outputDir: defaultOutputDir,
  });
}

/**
 * Quick summary without generating full SBOM
 */
export async function quickSummary(projectRoot: string): Promise<{
  name: string;
  version: string;
  dependencyCount: number;
}> {
  const { project, dependencies } = await analyzeDependencies({
    projectRoot,
  });

  return {
    name: project.name,
    version: project.version,
    dependencyCount: dependencies.length,
  };
}
