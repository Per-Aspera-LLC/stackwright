/**
 * SPDX format tests
 * @package @stackwright/sbom-generator
 */

import { describe, it, expect } from 'vitest';
import { generateSPDX, toSPDXJSON, toSPDXTV, validateSPDX } from '../../src/formats/spdx';
import { StackwrightProjectInfo } from '../../src/normalizers/stackwright';
import { NormalizedDependency } from '../../src/normalizers/pnpm';

describe('SPDX Format', () => {
  const mockProject: StackwrightProjectInfo = {
    name: '@stackwright/test-package',
    version: '1.0.0',
    root: '/test',
    description: 'Test package',
    license: 'MIT',
    isMonorepo: false,
  };

  const mockDependencies: NormalizedDependency[] = [
    {
      name: 'js-yaml',
      version: '4.1.0',
      dependencies: {},
      isDev: false,
      isPeer: false,
      depth: 0,
    },
    {
      name: 'zod',
      version: '3.22.0',
      dependencies: { tslib: '^2.0.0' },
      isDev: false,
      isPeer: false,
      depth: 0,
    },
    {
      name: 'typescript',
      version: '5.0.0',
      dependencies: {},
      isDev: true,
      isPeer: false,
      depth: 0,
    },
  ];

  describe('generateSPDX', () => {
    it('should generate valid SPDX document', () => {
      const doc = generateSPDX(mockProject, mockDependencies, {
        includeDevDependencies: true,
      });

      expect(doc.spdxVersion).toBe('SPDX-2.3');
      expect(doc.dataLicense).toBe('CC0-1.0');
      expect(doc.SPDXID).toMatch(/^SPDXRef-DOCUMENT-/);
      expect(doc.name).toBe('@stackwright/test-package@1.0.0');
      expect(doc.documentNamespace).toContain('stackwright.dev');
      expect(doc.creationInfo.creators).toContain('Tool: @stackwright/sbom-generator');
    });

    it('should include all packages', () => {
      const doc = generateSPDX(mockProject, mockDependencies);

      expect(doc.packages).toHaveLength(2); // Dev excluded by default
      expect(doc.packages.some((p) => p.name === 'js-yaml')).toBe(true);
      expect(doc.packages.some((p) => p.name === 'zod')).toBe(true);
      expect(doc.packages.some((p) => p.name === 'typescript')).toBe(false);
    });

    it('should include dev dependencies when requested', () => {
      const doc = generateSPDX(mockProject, mockDependencies, {
        includeDevDependencies: true,
      });

      expect(doc.packages).toHaveLength(3);
      expect(doc.packages.some((p) => p.name === 'typescript')).toBe(true);
    });

    it('should include PURL external references', () => {
      const doc = generateSPDX(mockProject, mockDependencies);

      const jsYamlPkg = doc.packages.find((p) => p.name === 'js-yaml');
      expect(jsYamlPkg?.externalRefs).toBeDefined();
      expect(jsYamlPkg?.externalRefs[0].referenceType).toBe('purl');
      expect(jsYamlPkg?.externalRefs[0].referenceLocator).toBe('pkg:npm/js-yaml@4.1.0');
    });

    it('should include checksums for all packages', () => {
      const doc = generateSPDX(mockProject, mockDependencies);

      for (const pkg of doc.packages) {
        expect(pkg.checksums).toBeDefined();
        expect(pkg.checksums.some((c) => c.algorithm === 'SHA256')).toBe(true);
      }
    });

    it('should generate relationships', () => {
      const doc = generateSPDX(mockProject, mockDependencies);

      expect(doc.relationships.length).toBeGreaterThan(0);
      expect(doc.relationships[0].relationshipType).toBe('DESCRIBES');
    });

    it('should use custom namespace when provided', () => {
      const customNamespace = 'https://custom.example.com/sbom';
      const doc = generateSPDX(mockProject, mockDependencies, {
        namespace: customNamespace,
      });

      expect(doc.documentNamespace).toContain(customNamespace);
    });
  });

  describe('toSPDXJSON', () => {
    it('should generate valid JSON', () => {
      const doc = generateSPDX(mockProject, mockDependencies);
      const json = toSPDXJSON(doc);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all required fields in JSON', () => {
      const doc = generateSPDX(mockProject, mockDependencies);
      const json = toSPDXJSON(doc);
      const parsed = JSON.parse(json);

      expect(parsed.spdxVersion).toBe('SPDX-2.3');
      expect(parsed.packages).toBeDefined();
      expect(parsed.relationships).toBeDefined();
    });
  });

  describe('toSPDXTV', () => {
    it('should generate tag-value format', () => {
      const doc = generateSPDX(mockProject, mockDependencies);
      const tv = toSPDXTV(doc);

      expect(tv).toContain('SPDXVersion: SPDX-2.3');
      expect(tv).toContain('SPDXID: SPDXRef-DOCUMENT');
      expect(tv).toContain('PackageName: js-yaml');
    });

    it('should include package details', () => {
      const doc = generateSPDX(mockProject, mockDependencies);
      const tv = toSPDXTV(doc);

      expect(tv).toContain('PackageVersion: 4.1.0');
      expect(tv).toContain('PackageChecksum: SHA256:');
    });

    it('should include relationships', () => {
      const doc = generateSPDX(mockProject, mockDependencies);
      const tv = toSPDXTV(doc);

      expect(tv).toContain('Relationship:');
    });
  });

  describe('validateSPDX', () => {
    it('should validate correct SPDX document', () => {
      const doc = generateSPDX(mockProject, mockDependencies);

      expect(validateSPDX(doc)).toBe(true);
    });

    it('should reject non-SPDX documents', () => {
      expect(validateSPDX({})).toBe(false);
      expect(validateSPDX(null)).toBe(false);
      expect(validateSPDX({ spdxVersion: 'WRONG' })).toBe(false);
    });

    it('should reject documents without packages', () => {
      expect(
        validateSPDX({
          spdxVersion: 'SPDX-2.3',
          SPDXID: 'test',
          name: 'test',
          packages: [],
          relationships: [],
        })
      ).toBe(false);
    });
  });
});
