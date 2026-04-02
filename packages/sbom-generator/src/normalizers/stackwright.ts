/**
 * Stackwright-specific package metadata normalization
 * @package @stackwright/sbom-generator
 */

import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface StackwrightProjectInfo {
  name: string;
  version: string;
  root: string;
  description?: string;
  license?: string;
  repository?: string;
  workspacePackages?: WorkspacePackage[];
  isMonorepo: boolean;
}

export interface WorkspacePackage {
  name: string;
  version: string;
  relativePath: string;
  manifestPath: string;
}

const STACKWRIGHT_SCOPES = ['@stackwright', '@per-aspera'];

export function isStackwrightPackage(name: string): boolean {
  return STACKWRIGHT_SCOPES.some((scope) => name.startsWith(`${scope}/`));
}

export function getStackwrightPackageType(
  name: string
): 'core' | 'theme' | 'plugin' | 'tool' | 'external' | 'example' {
  if (!isStackwrightPackage(name)) {
    return 'external';
  }

  if (name.includes('core')) return 'core';
  if (name.includes('theme')) return 'theme';
  if (name.includes('plugin') || name.includes('mcp')) return 'plugin';
  if (name.includes('ui-')) return 'plugin';
  if (name.includes('example')) return 'example';

  return 'tool';
}

export async function readPackageManifest(
  projectRoot: string
): Promise<StackwrightProjectInfo | null> {
  try {
    const packageJsonPath = resolve(projectRoot, 'package.json');
    const content = await readFile(packageJsonPath, 'utf-8');
    const manifest = JSON.parse(content);

    // Check if it's a workspace (monorepo root)
    if (manifest.workspaces) {
      const workspacePackages = await findWorkspacePackages(projectRoot);

      return {
        name: manifest.name || 'stackwright-monorepo',
        version: manifest.version || '0.0.0',
        root: projectRoot,
        description: manifest.description,
        license: manifest.license,
        repository:
          typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url,
        isMonorepo: true,
        workspacePackages,
      };
    }

    return {
      name: manifest.name || 'unknown',
      version: manifest.version || '0.0.0',
      root: projectRoot,
      description: manifest.description,
      license: manifest.license,
      repository:
        typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url,
      isMonorepo: false,
    };
  } catch {
    return null;
  }
}

export async function findWorkspacePackages(workspaceRoot: string): Promise<WorkspacePackage[]> {
  const packages: WorkspacePackage[] = [];

  try {
    const packagesDir = resolve(workspaceRoot, 'packages');
    const entries = await readdir(packagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const manifestPath = resolve(packagesDir, entry.name, 'package.json');

      try {
        const content = await readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(content);

        if (manifest.name) {
          packages.push({
            name: manifest.name,
            version: manifest.version || '0.0.0',
            relativePath: `packages/${entry.name}`,
            manifestPath,
          });
        }
      } catch {
        // Skip packages without valid manifest
      }
    }
  } catch {
    // Packages directory doesn't exist
  }

  return packages;
}

export function getPackageIdentifier(name: string, version: string): string {
  const sanitizedName = name.replace(/[^a-zA-Z0-9.-]/g, '-');
  const sanitizedVersion = version.replace(/[^a-zA-Z0-9.-]/g, '-');
  return `SPDXRef-${sanitizedName}-${sanitizedVersion}`;
}

export function extractLicense(
  license: string | { type: string; url?: string } | undefined
): string | undefined {
  if (!license) return undefined;
  if (typeof license === 'string') return license;
  return license.type;
}

export function getPackagePriority(name: string): number {
  if (name === '@stackwright/core') return 100;
  if (name === '@stackwright/themes') return 90;
  if (name === '@stackwright/nextjs') return 85;
  if (isStackwrightPackage(name)) return 70;
  return 0;
}
