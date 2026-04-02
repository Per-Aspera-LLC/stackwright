/**
 * Dependency analysis from lockfiles
 * @package @stackwright/sbom-generator
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import {
  NormalizedDependency,
  getDirectDependencies,
  categorizeDependencies,
  parseLockfilePackages,
  LockfilePackage,
} from './normalizers/pnpm';
import { StackwrightProjectInfo, readPackageManifest } from './normalizers/stackwright';
import { debugLog } from './generator';

export interface AnalyzerOptions {
  projectRoot: string;
  includeDevDependencies?: boolean;
  includePeerDependencies?: boolean;
}

/**
 * Analyze project dependencies from lockfile
 */
export async function analyzeDependencies(options: AnalyzerOptions): Promise<{
  project: StackwrightProjectInfo;
  dependencies: NormalizedDependency[];
}> {
  const { projectRoot, includeDevDependencies = false, includePeerDependencies = true } = options;

  debugLog('Starting dependency analysis', { projectRoot });

  // Read project manifest
  const project = await readPackageManifest(projectRoot);
  if (!project) {
    throw new Error(`Could not read package manifest from ${projectRoot}`);
  }

  debugLog('Project manifest loaded', { name: project.name, version: project.version });

  // Read direct dependencies from package.json
  const directDeps = await getDirectDependencies(projectRoot);

  if (!directDeps) {
    throw new Error(`Could not read dependencies from ${projectRoot}`);
  }

  debugLog('Direct dependencies loaded', {
    deps: Object.keys(directDeps.dependencies).length,
    devDeps: Object.keys(directDeps.devDependencies).length,
  });

  // Read pnpm-lock.yaml
  const lockfilePath = resolve(projectRoot, 'pnpm-lock.yaml');
  let dependencies: NormalizedDependency[] = [];

  try {
    const content = await readFile(lockfilePath, 'utf-8');
    const lockfile = yaml.load(content) as Record<string, unknown>;

    if (lockfile.packages) {
      debugLog('Lockfile packages found', {
        count: Object.keys(lockfile.packages as object).length,
      });

      dependencies = parseLockfilePackages(
        lockfile.packages as Record<string, LockfilePackage>,
        projectRoot
      );
    }
  } catch {
    debugLog('Could not read lockfile, using package.json dependencies only');
    // Fall back to package.json dependencies only
    dependencies = fallbackFromPackageJson(directDeps);
  }

  // Categorize dependencies
  dependencies = categorizeDependencies(
    dependencies,
    directDeps.dependencies,
    directDeps.devDependencies,
    directDeps.peerDependencies
  );

  // Filter based on options
  if (!includeDevDependencies) {
    dependencies = dependencies.filter((d) => !d.isDev);
  }

  if (!includePeerDependencies) {
    dependencies = dependencies.filter((d) => !d.isPeer);
  }

  debugLog('Analysis complete', {
    totalDeps: dependencies.length,
    direct: dependencies.filter((d) => d.depth === 0).length,
    dev: dependencies.filter((d) => d.isDev).length,
  });

  return { project, dependencies };
}

/**
 * Fallback when lockfile is not available
 */
function fallbackFromPackageJson(deps: {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}): NormalizedDependency[] {
  const result: NormalizedDependency[] = [];

  // Add regular dependencies
  for (const [name, version] of Object.entries(deps.dependencies)) {
    result.push({
      name,
      version: normalizeVersion(version),
      dependencies: {},
      isDev: false,
      isPeer: false,
      depth: 0,
    });
  }

  // Add dev dependencies
  for (const [name, version] of Object.entries(deps.devDependencies)) {
    result.push({
      name,
      version: normalizeVersion(version),
      dependencies: {},
      isDev: true,
      isPeer: false,
      depth: 0,
    });
  }

  // Add peer dependencies
  for (const [name, version] of Object.entries(deps.peerDependencies)) {
    result.push({
      name,
      version: normalizeVersion(version),
      dependencies: {},
      isDev: false,
      isPeer: true,
      depth: 0,
    });
  }

  return result;
}

/**
 * Normalize version string to semver
 */
function normalizeVersion(versionSpec: string): string {
  return versionSpec.replace(/^[\^~>=<]+/, '').replace(/\s+.*$/, '');
}
