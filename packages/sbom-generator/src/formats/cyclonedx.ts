/**
 * CycloneDX 1.5 format generation
 * @package @stackwright/sbom-generator
 * @see https://cyclonedx.org/docs/1.5/json/
 */

import { NormalizedDependency } from '../normalizers/pnpm';
import { StackwrightProjectInfo } from '../normalizers/stackwright';
import { npmPURL } from '../utils/purl';
import { sha256 } from '../utils/hash';

export interface CycloneDXDocument {
  bomFormat: string;
  specVersion: string;
  serialNumber?: string;
  version: number;
  metadata?: CycloneDXMetadata;
  components: CycloneDXComponent[];
  services?: CycloneDXService[];
  dependencies?: CycloneDXDependency[];
}

export interface CycloneDXMetadata {
  timestamp?: string;
  tools?: Array<{
    vendor?: string;
    name: string;
    version?: string;
  }>;
  component?: CycloneDXComponent;
  manufacture?: CycloneDXOrganizationalEntity;
  supplier?: CycloneDXOrganizationalEntity;
}

export interface CycloneDXComponent {
  type:
    | 'application'
    | 'framework'
    | 'library'
    | 'container'
    | 'operating-system'
    | 'device'
    | 'firmware'
    | 'file';
  'bom-ref'?: string;
  name: string;
  version?: string;
  purl?: string;
  pkgid?: string;
  group?: string;
  description?: string;
  scope?: 'required' | 'optional' | 'excluded';
  hashes?: Array<{
    alg: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5';
    content: string;
  }>;
  licenses?: Array<{
    license: CycloneDXLicense | { id: string; url?: string };
  }>;
  copyright?: string;
  cpe?: string;
  externalReferences?: Array<{
    type: string;
    url?: string;
    comment?: string;
  }>;
}

export interface CycloneDXLicense {
  id?: string;
  name?: string;
  url?: string;
}

export interface CycloneDXOrganizationalEntity {
  name: string;
  url?: string[];
  contact?: Array<{
    name?: string;
    email?: string;
    phone?: string;
  }>;
}

export interface CycloneDXService {
  'bom-ref'?: string;
  name: string;
  version?: string;
  description?: string;
  endpoints?: string[];
  data?: Array<{
    classification: string;
    name?: string;
  }>;
  externalReferences?: CycloneDXComponent['externalReferences'];
}

export interface CycloneDXDependency {
  ref: string;
  dependsOn?: string[];
  dependencyType?: string;
}

/**
 * Generate CycloneDX document from dependencies
 */
export function generateCycloneDX(
  project: StackwrightProjectInfo,
  dependencies: NormalizedDependency[],
  options: {
    includeDevDependencies?: boolean;
    includeServices?: boolean;
  } = {}
): CycloneDXDocument {
  const filteredDeps = options.includeDevDependencies
    ? dependencies
    : dependencies.filter((d) => !d.isDev);

  const components = filteredDeps.map((dep) => createCycloneDXComponent(dep));

  // Add project as main component if not already included
  const mainComponent: CycloneDXComponent = {
    type: 'application',
    name: project.name,
    version: project.version,
    purl: npmPURL(project.name, project.version),
    description: project.description,
    licenses: project.license ? [{ license: { id: project.license } }] : undefined,
  };

  // Build dependency graph
  const deps = buildDependencyGraph(filteredDeps, mainComponent);

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [
        {
          vendor: 'Stackwright',
          name: '@stackwright/sbom-generator',
          version: '0.0.0',
        },
      ],
      component: mainComponent,
    },
    components,
    dependencies: deps,
  };
}

/**
 * Create CycloneDX component from dependency
 */
function createCycloneDXComponent(dep: NormalizedDependency): CycloneDXComponent {
  const purl = npmPURL(dep.name, dep.version);

  // Determine component type
  let type: CycloneDXComponent['type'] = 'library';
  if (isBuildTool(dep.name)) {
    type = 'framework';
  } else if (isExecutable(dep.name)) {
    type = 'application';
  }

  // Note: These hashes are informational only (derived from name+version).
  // For real integrity verification, use lockfile integrity hashes or
  // package registry checksums in production SBOM workflows.
  const hashContent = `${dep.name}@${dep.version}`;
  const hash = sha256(hashContent);

  return {
    type,
    name: dep.name,
    version: dep.version,
    purl,
    scope: dep.isDev ? 'optional' : 'required',
    hashes: [
      {
        alg: 'SHA-256',
        content: hash,
      },
    ],
    licenses: dep.license ? [{ license: { id: dep.license } }] : undefined,
    externalReferences: [
      {
        type: 'package-manager',
        url: `https://www.npmjs.com/package/${dep.name}`,
      },
    ],
  };
}

/**
 * Build dependency graph for CycloneDX
 */
function buildDependencyGraph(
  dependencies: NormalizedDependency[],
  mainComponent: CycloneDXComponent
): CycloneDXDependency[] {
  const deps: CycloneDXDependency[] = [];

  // Root dependency
  const mainRef = mainComponent.purl || mainComponent.name;
  const directDeps = dependencies.filter((d) => d.depth === 0);

  deps.push({
    ref: mainRef,
    dependsOn: directDeps.map((d) => d.name),
    dependencyType: 'direct',
  });

  // Add transitive dependencies
  for (const dep of dependencies) {
    if (dep.depth > 0 && Object.keys(dep.dependencies).length > 0) {
      deps.push({
        ref: dep.name,
        dependsOn: Object.keys(dep.dependencies),
        dependencyType: 'transitive',
      });
    }
  }

  return deps;
}

/**
 * Check if package is a build tool
 */
function isBuildTool(name: string): boolean {
  const buildTools = [
    'typescript',
    'babel',
    'webpack',
    'vite',
    'esbuild',
    'rollup',
    'parcel',
    'tsup',
    'swc',
    'rome',
  ];
  return buildTools.some((tool) => name === tool || name.includes(`-${tool}`));
}

/**
 * Check if package is typically executable
 */
function isExecutable(name: string): boolean {
  const executables = ['cli', 'bin', 'command', 'runner'];
  return executables.some((exec) => name.includes(`-${exec}`));
}

/**
 * Format CycloneDX document as pretty JSON
 */
export function toCycloneDXJSON(doc: CycloneDXDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Validate CycloneDX document structure
 */
export function validateCycloneDX(doc: unknown): doc is CycloneDXDocument {
  if (!doc || typeof doc !== 'object') return false;

  const d = doc as CycloneDXDocument;

  return (
    d.bomFormat === 'CycloneDX' &&
    d.specVersion === '1.5' &&
    typeof d.version === 'number' &&
    Array.isArray(d.components) &&
    d.components.length > 0
  );
}
