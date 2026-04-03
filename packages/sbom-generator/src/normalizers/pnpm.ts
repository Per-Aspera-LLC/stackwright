/**
 * PNPM lockfile parsing and normalization
 * @package @stackwright/sbom-generator
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

export interface LockfilePackage {
  /** Resolved version */
  version: string;
  /** Optional resolved version string */
  resolvedVersion?: string;
  /** Dependencies with version specifiers as keys */
  dependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Optional integrity hash */
  integrity?: string;
}

export interface NormalizedDependency {
  /** Package name (including scope for scoped packages) */
  name: string;
  /** Resolved semver version */
  version: string;
  /** Package URL for PURL generation */
  resolved?: string;
  /** Integrity hash */
  integrity?: string;
  /** Direct dependencies of this package */
  dependencies: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Whether this is a dev dependency */
  isDev: boolean;
  /** Whether this is a peer dependency of something */
  isPeer: boolean;
  /** Depth in the dependency tree (0 = direct) */
  depth: number;
  /** Optional license */
  license?: string;
}

/**
 * Parse semver version to extract clean version string
 */
export function normalizeVersion(versionSpec: string): string {
  return versionSpec.replace(/^[\^~>=<]+/, '').split(' ')[0];
}

/**
 * Read and parse pnpm-lock.yaml
 */
export async function readPnpmLockfile(projectRoot: string): Promise<{
  lockfile: Record<string, unknown>;
  version: string;
} | null> {
  try {
    const lockfilePath = resolve(projectRoot, 'pnpm-lock.yaml');
    const content = await readFile(lockfilePath, 'utf-8');
    const lockfile = yaml.load(content) as Record<string, unknown>;

    // Extract lockfile version
    const version = (lockfile.lockfileVersion as number)?.toString() || 'unknown';

    return { lockfile, version };
  } catch {
    return null;
  }
}

/**
 * Parse lockfile packages section to extract dependencies
 */
export function parseLockfilePackages(
  packages: Record<string, LockfilePackage>,
  _projectRoot: string
): NormalizedDependency[] {
  const result: NormalizedDependency[] = [];

  for (const [path, pkg] of Object.entries(packages)) {
    // Skip if not a node_modules path
    if (!path.includes('node_modules/')) continue;

    // Extract package name from path
    const name = extractPackageName(path);
    if (!name) continue;

    if (!pkg.version) continue;

    const normalizedVersion = normalizeVersion(pkg.version);

    result.push({
      name,
      version: normalizedVersion,
      resolved: pkg.resolvedVersion,
      integrity: pkg.integrity,
      dependencies: pkg.dependencies || {},
      peerDependencies: pkg.peerDependencies,
      isDev: false,
      isPeer: false,
      depth: calculateDepth(path),
      license: undefined,
    });
  }

  return result;
}

/**
 * Extract package name from lockfile path
 */
function extractPackageName(path: string): string | null {
  const nodeModulesIndex = path.indexOf('node_modules/');
  if (nodeModulesIndex === -1) return null;

  const afterModules = path.slice(nodeModulesIndex + 'node_modules/'.length);
  const segments = afterModules.split('/');

  if (segments[0].startsWith('@')) {
    return `${segments[0]}/${segments[1]}`;
  }

  return segments[0];
}

/**
 * Calculate dependency depth from path
 */
function calculateDepth(path: string): number {
  const matches = path.match(/node_modules/g);
  if (!matches) return 0;
  return Math.max(0, matches.length - 1);
}

/**
 * Read package.json directly
 */
export async function readPackageJson(projectRoot: string): Promise<{
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
} | null> {
  try {
    const packageJsonPath = resolve(projectRoot, 'package.json');
    const content = await readFile(packageJsonPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Extract direct dependencies from package.json
 */
export async function getDirectDependencies(projectRoot: string): Promise<{
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
} | null> {
  const manifest = await readPackageJson(projectRoot);

  if (!manifest) return null;

  return {
    dependencies: manifest.dependencies || {},
    devDependencies: manifest.devDependencies || {},
    peerDependencies: manifest.peerDependencies || {},
  };
}

/**
 * Build a map of dependency types (direct, dev, peer)
 */
export function categorizeDependencies(
  dependencies: NormalizedDependency[],
  directDeps: Record<string, string>,
  devDeps: Record<string, string>,
  peerDeps: Record<string, string>
): NormalizedDependency[] {
  return dependencies.map((dep) => {
    const name = dep.name;

    if (name in directDeps) {
      return { ...dep, isDev: false, isPeer: false };
    }

    if (name in devDeps) {
      return { ...dep, isDev: true, isPeer: false };
    }

    if (name in peerDeps) {
      return { ...dep, isDev: false, isPeer: true };
    }

    return { ...dep, isDev: false, isPeer: false };
  });
}
