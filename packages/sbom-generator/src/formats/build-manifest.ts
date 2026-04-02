/**
 * Stackwright-specific build manifest format
 * @package @stackwright/sbom-generator
 */

import { z } from 'zod';
import { NormalizedDependency } from '../normalizers/pnpm';
import { StackwrightProjectInfo, getStackwrightPackageType } from '../normalizers/stackwright';
import { npmPURL } from '../utils/purl';
import { sha256 } from '../utils/hash';

// Schema for build manifest
export const BuildManifestSchema = z.object({
  format: z.literal('stackwright-build-manifest'),
  version: z.string(),
  generated: z.string(),
  project: z.object({
    name: z.string(),
    version: z.string(),
    root: z.string(),
    description: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().optional(),
    isMonorepo: z.boolean(),
  }),
  dependencies: z.array(
    z.object({
      name: z.string(),
      version: z.string(),
      type: z.enum(['direct', 'dev', 'peer', 'transitive']),
      category: z.enum(['core', 'theme', 'plugin', 'tool', 'example', 'external']),
      purl: z.string(),
      integrity: z.string(),
      depth: z.number(),
    })
  ),
  metadata: z.object({
    totalDependencies: z.number(),
    directDependencies: z.number(),
    devDependencies: z.number(),
    peerDependencies: z.number(),
    transitiveDependencies: z.number(),
    stackwrightInternal: z.number(),
    external: z.number(),
  }),
  workspace: z
    .object({
      isWorkspace: z.boolean(),
      packages: z
        .array(
          z.object({
            name: z.string(),
            version: z.string(),
            path: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
});

export type BuildManifest = z.infer<typeof BuildManifestSchema>;

export interface BuildManifestOptions {
  includeDevDependencies?: boolean;
  includeWorkspaceInfo?: boolean;
}

/**
 * Generate Stackwright build manifest
 */
export function generateBuildManifest(
  project: StackwrightProjectInfo,
  dependencies: NormalizedDependency[],
  options: BuildManifestOptions = {}
): BuildManifest {
  const { includeDevDependencies = false, includeWorkspaceInfo = false } = options;

  // Filter dependencies
  const filteredDeps = includeDevDependencies ? dependencies : dependencies.filter((d) => !d.isDev);

  // Categorize dependencies
  const categorizedDeps = filteredDeps.map((dep) => {
    const category = getStackwrightPackageType(dep.name);
    return {
      name: dep.name,
      version: dep.version,
      type: categorizeType(dep),
      category,
      purl: npmPURL(dep.name, dep.version),
      integrity: sha256(`${dep.name}@${dep.version}`),
      depth: dep.depth,
    };
  });

  // Compute metadata
  const metadata = {
    totalDependencies: categorizedDeps.length,
    directDependencies: categorizedDeps.filter((d) => d.type === 'direct').length,
    devDependencies: categorizedDeps.filter((d) => d.type === 'dev').length,
    peerDependencies: categorizedDeps.filter((d) => d.type === 'peer').length,
    transitiveDependencies: categorizedDeps.filter((d) => d.type === 'transitive').length,
    stackwrightInternal: categorizedDeps.filter((d) => d.category !== 'external').length,
    external: categorizedDeps.filter((d) => d.category === 'external').length,
  };

  const manifest: BuildManifest = {
    format: 'stackwright-build-manifest',
    version: '1.0.0',
    generated: new Date().toISOString(),
    project: {
      name: project.name,
      version: project.version,
      root: project.root,
      description: project.description,
      license: project.license,
      repository: project.repository,
      isMonorepo: project.isMonorepo,
    },
    dependencies: categorizedDeps,
    metadata,
  };

  // Add workspace info if applicable
  if (includeWorkspaceInfo && project.workspacePackages) {
    manifest.workspace = {
      isWorkspace: true,
      packages: project.workspacePackages.map((pkg) => ({
        name: pkg.name,
        version: pkg.version,
        path: pkg.relativePath,
      })),
    };
  }

  return manifest;
}

/**
 * Categorize dependency type
 */
function categorizeType(dep: NormalizedDependency): 'direct' | 'dev' | 'peer' | 'transitive' {
  if (dep.isPeer) return 'peer';
  if (dep.isDev) return 'dev';
  if (dep.depth === 0) return 'direct';
  return 'transitive';
}

/**
 * Format build manifest as pretty JSON
 */
export function toBuildManifestJSON(manifest: BuildManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Validate build manifest against schema
 */
export function validateBuildManifest(data: unknown): data is BuildManifest {
  try {
    BuildManifestSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get summary of build manifest
 */
export function getManifestSummary(manifest: BuildManifest): {
  totalPackages: number;
  stackwrightPackages: string[];
  externalPackages: string[];
  byCategory: Record<string, number>;
} {
  const stackwrightPackages = manifest.dependencies
    .filter((d) => d.category !== 'external')
    .map((d) => d.name);

  const externalPackages = manifest.dependencies
    .filter((d) => d.category === 'external')
    .map((d) => d.name);

  const byCategory: Record<string, number> = {};
  for (const dep of manifest.dependencies) {
    byCategory[dep.category] = (byCategory[dep.category] || 0) + 1;
  }

  return {
    totalPackages: manifest.dependencies.length,
    stackwrightPackages,
    externalPackages,
    byCategory,
  };
}

/**
 * Get dependency tree structure for build manifest
 */
export function getDependencyTree(manifest: BuildManifest): Record<string, string[]> {
  const tree: Record<string, string[]> = {};

  for (const dep of manifest.dependencies) {
    if (dep.depth === 0) {
      tree[dep.name] = [];
    } else if (dep.depth === 1) {
      // Direct dependencies of the root
      if (!tree[manifest.project.name]) {
        tree[manifest.project.name] = [];
      }
      tree[manifest.project.name].push(dep.name);
    }
  }

  return tree;
}
