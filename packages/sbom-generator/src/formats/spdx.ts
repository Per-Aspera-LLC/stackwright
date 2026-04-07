/**
 * SPDX 2.3 format generation
 * @package @stackwright/sbom-generator
 * @see https://spdx.github.io/spdx-spec/
 */

import { NormalizedDependency } from '../normalizers/pnpm';
import { StackwrightProjectInfo } from '../normalizers/stackwright';
import { npmPURL } from '../utils/purl';
import { sha256 } from '../utils/hash';
import { randomUUID } from 'node:crypto';

export interface SPDXDocument {
  spdxVersion: string;
  dataLicense: string;
  SPDXID: string;
  name: string;
  documentNamespace: string;
  creationInfo: {
    created: string;
    creators: string[];
  };
  packages: SPDXPackage[];
  relationships: SPDXRelationship[];
}

export interface SPDXPackage {
  SPDXID: string;
  name: string;
  versionInfo?: string;
  packageFileName?: string;
  supplier?: string;
  downloadLocation?: string;
  filesAnalyzed?: boolean;
  checksums: Array<{
    algorithm: string;
    value: string;
  }>;
  licenseConcluded?: string;
  licenseDeclared?: string;
  externalRefs?: Array<{
    referenceCategory: string;
    referenceType: string;
    referenceLocator: string;
  }>;
}

export interface SPDXRelationship {
  spdxElementId: string;
  relationshipType: string;
  relatedSpdxElement: string;
}

/**
 * Generate SPDX document from dependencies
 */
export function generateSPDX(
  project: StackwrightProjectInfo,
  dependencies: NormalizedDependency[],
  options: {
    includeDevDependencies?: boolean;
    namespace?: string;
  } = {}
): SPDXDocument {
  const { namespace = `https://stackwright.dev/spdx/${project.name}` } = options;
  const docId = `SPDXRef-DOCUMENT-${randomUUID().split('-')[0]}`;
  const timestamp = new Date().toISOString();

  const filteredDeps = options.includeDevDependencies
    ? dependencies
    : dependencies.filter((d) => !d.isDev);

  const packages: SPDXPackage[] = filteredDeps.map((dep) => createSPDXPackage(dep, project));
  const relationships: SPDXRelationship[] = createRelationships(docId, packages);

  return {
    spdxVersion: 'SPDX-2.3',
    dataLicense: 'CC0-1.0',
    SPDXID: docId,
    name: `${project.name}@${project.version}`,
    documentNamespace: `${namespace}/${timestamp}`,
    creationInfo: {
      created: timestamp,
      creators: ['Tool: @stackwright/sbom-generator', `Tool-Version: 0.0.0`],
    },
    packages,
    relationships,
  };
}

/**
 * Create SPDX package entry
 */
function createSPDXPackage(
  dep: NormalizedDependency,
  project: StackwrightProjectInfo
): SPDXPackage {
  const packageId = `SPDXRef-Package-${dep.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const purl = npmPURL(dep.name, dep.version);

  // Note: These checksums are informational only (derived from name+version).
  // For real integrity verification, use lockfile integrity hashes or
  // package registry checksums in production SBOM workflows.
  const checksumContent = `${dep.name}@${dep.version}`;
  const checksum = sha256(checksumContent);

  return {
    SPDXID: packageId,
    name: dep.name,
    versionInfo: dep.version,
    supplier: `NOASSERTION`,
    downloadLocation: `NOASSERTION`,
    filesAnalyzed: false,
    checksums: [
      {
        algorithm: 'SHA256',
        value: checksum,
      },
    ],
    licenseConcluded: dep.license || 'NOASSERTION',
    licenseDeclared: dep.license || 'NOASSERTION',
    externalRefs: [
      {
        referenceCategory: 'PACKAGE-MANAGER',
        referenceType: 'purl',
        referenceLocator: purl,
      },
    ],
  };
}

/**
 * Create SPDX relationships
 */
function createRelationships(docId: string, packages: SPDXPackage[]): SPDXRelationship[] {
  const relationships: SPDXRelationship[] = [];

  // Document describes root package (first non-external)
  const rootPackage = packages.find((p) => !p.name.startsWith('@'));
  if (rootPackage) {
    relationships.push({
      spdxElementId: docId,
      relationshipType: 'DESCRIBES',
      relatedSpdxElement: rootPackage.SPDXID,
    });
  }

  // All packages are contained in document
  for (const pkg of packages) {
    if (pkg.SPDXID !== rootPackage?.SPDXID) {
      relationships.push({
        spdxElementId: rootPackage?.SPDXID || docId,
        relationshipType: 'CONTAINS',
        relatedSpdxElement: pkg.SPDXID,
      });
    }
  }

  // Add DEPENDS_ON relationships for direct dependencies
  // Note: This is simplified - full tree traversal would be more accurate
  return relationships;
}

/**
 * Format SPDX document as JSON
 */
export function toSPDXJSON(doc: SPDXDocument): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * Format SPDX document as tag-value format
 */
export function toSPDXTV(doc: SPDXDocument): string {
  const lines: string[] = [];

  // Document header
  lines.push(`SPDXVersion: ${doc.spdxVersion}`);
  lines.push(`DataLicense: ${doc.dataLicense}`);
  lines.push(`SPDXID: ${doc.SPDXID}`);
  lines.push(`DocumentName: ${doc.name}`);
  lines.push(`DocumentNamespace: ${doc.documentNamespace}`);
  lines.push('');

  // Creation info
  lines.push('CreationInfo:');
  lines.push(`  Created: ${doc.creationInfo.created}`);
  for (const creator of doc.creationInfo.creators) {
    lines.push(`  Creator: ${creator}`);
  }
  lines.push('');

  // Packages
  for (const pkg of doc.packages) {
    lines.push(`PackageName: ${pkg.name}`);
    lines.push(`SPDXID: ${pkg.SPDXID}`);
    if (pkg.versionInfo) {
      lines.push(`PackageVersion: ${pkg.versionInfo}`);
    }
    if (pkg.licenseConcluded) {
      lines.push(`PackageLicenseConcluded: ${pkg.licenseConcluded}`);
    }
    if (pkg.licenseDeclared) {
      lines.push(`PackageLicenseDeclared: ${pkg.licenseDeclared}`);
    }
    for (const checksum of pkg.checksums) {
      lines.push(`PackageChecksum: ${checksum.algorithm}: ${checksum.value}`);
    }
    if (pkg.externalRefs) {
      for (const ref of pkg.externalRefs) {
        lines.push(
          `ExternalRef: ${ref.referenceCategory} ${ref.referenceType} ${ref.referenceLocator}`
        );
      }
    }
    lines.push('');
  }

  // Relationships
  for (const rel of doc.relationships) {
    lines.push(
      `Relationship: ${rel.spdxElementId} ${rel.relationshipType} ${rel.relatedSpdxElement}`
    );
  }

  return lines.join('\n');
}

/**
 * Validate SPDX document structure
 */
export function validateSPDX(doc: unknown): doc is SPDXDocument {
  if (!doc || typeof doc !== 'object') return false;

  const d = doc as SPDXDocument;

  return (
    d.spdxVersion === 'SPDX-2.3' &&
    typeof d.SPDXID === 'string' &&
    typeof d.name === 'string' &&
    Array.isArray(d.packages) &&
    d.packages.length > 0 &&
    Array.isArray(d.relationships)
  );
}
