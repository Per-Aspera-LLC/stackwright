/**
 * PNPM lockfile parsing and normalization
 * @package @stackwright/sbom-generator
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

export interface LockfilePackage {
  /** Resolved version — present in older pnpm lockfile formats; embedded in key for v9+ */
  version?: string;
  /** pnpm v9+: resolution info including integrity hash */
  resolution?: { integrity?: string };
  /** Optional resolved version string */
  resolvedVersion?: string;
  /** Dependencies with version specifiers as keys */
  dependencies?: Record<string, string>;
  /** Peer dependencies */
  peerDependencies?: Record<string, string>;
  /** Optional integrity hash (older formats) */
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
 * Extract package name and version from a pnpm lockfile key.
 *
 * Handles multiple lockfile version formats:
 *   - v5/v6:  /react@18.0.0  or  /@scope/pkg@1.0.0
 *   - v9:     react@18.0.0   or  @scope/pkg@1.0.0
 *   - v9 with peer context: pkg@1.0.0(peer@2.0.0)
 */
function extractNameVersionFromKey(key: string): { name: string; version: string } | null {
  // Strip leading slash (v5/v6 format: /react@18.0.0)
  let clean = key.startsWith('/') ? key.slice(1) : key;

  // Strip peer context suffix: pkg@1.0.0(peerPkg@peerVer) → pkg@1.0.0
  // Handle nested parens: pkg@1.0.0(a@1(b@2)) — strip from first top-level '('
  const parenIdx = clean.indexOf('(');
  if (parenIdx !== -1) {
    clean = clean.slice(0, parenIdx);
  }

  // Split on the LAST '@' to separate name from version
  // (handles scoped packages like @scope/name@1.0.0 where there are two '@')
  const lastAt = clean.lastIndexOf('@');
  if (lastAt <= 0) return null; // No '@' found, or '@' only at position 0 (not a version)

  const name = clean.slice(0, lastAt);
  const version = clean.slice(lastAt + 1);

  if (!name || !version) return null;

  return { name, version };
}

/**
 * Parse lockfile packages section to extract dependencies.
 * Works with all pnpm lockfile versions (v5, v6, v9).
 */
export function parseLockfilePackages(
  packages: Record<string, LockfilePackage>,
  _projectRoot: string
): NormalizedDependency[] {
  const result: NormalizedDependency[] = [];

  for (const [key, pkg] of Object.entries(packages)) {
    if (!pkg || typeof pkg !== 'object') continue;

    // Extract name and version from the lockfile key (works for all pnpm lockfile versions)
    const extracted = extractNameVersionFromKey(key);
    if (!extracted) continue;

    const { name, version } = extracted;

    // Integrity: v9 stores it under resolution.integrity; older formats under pkg.integrity
    const integrity = pkg.resolution?.integrity ?? pkg.integrity;

    result.push({
      name,
      version,
      resolved: pkg.resolvedVersion,
      integrity,
      dependencies: pkg.dependencies || {},
      peerDependencies: pkg.peerDependencies,
      isDev: false,
      isPeer: false,
      depth: calculateDepth(key),
      license: undefined,
    });
  }

  return result;
}

/**
 * Calculate dependency depth from lockfile key.
 * Legacy formats encode nesting depth via repeated node_modules/ segments.
 * v9 format lists all packages flat, so depth is always 0.
 */
function calculateDepth(key: string): number {
  const matches = key.match(/node_modules/g);
  if (matches) return Math.max(0, matches.length - 1);
  // v6/v9 format: all packages listed flat at depth 0 in the packages section
  return 0;
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
