/**
 * CycloneDX format tests
 * @package @stackwright/sbom-generator
 */

import { describe, it, expect } from 'vitest';
import { generateCycloneDX, toCycloneDXJSON, validateCycloneDX } from '../../src/formats/cyclonedx';
import { StackwrightProjectInfo } from '../../src/normalizers/stackwright';
import { NormalizedDependency } from '../../src/normalizers/pnpm';

describe('CycloneDX Format', () => {
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

  describe('generateCycloneDX', () => {
    it('should generate valid CycloneDX document', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(doc.bomFormat).toBe('CycloneDX');
      expect(doc.specVersion).toBe('1.5');
      expect(doc.version).toBe(1);
    });

    it('should include metadata with tool info', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(doc.metadata).toBeDefined();
      expect(doc.metadata?.tools).toBeDefined();
      expect(doc.metadata?.tools[0].name).toBe('@stackwright/sbom-generator');
    });

    it('should include main component in metadata', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(doc.metadata?.component).toBeDefined();
      expect(doc.metadata?.component?.name).toBe('@stackwright/test-package');
      expect(doc.metadata?.component?.version).toBe('1.0.0');
    });

    it('should include all packages as components', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(doc.components).toHaveLength(2); // Dev excluded by default
    });

    it('should include dev dependencies when requested', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies, {
        includeDevDependencies: true,
      });

      expect(doc.components).toHaveLength(3);
    });

    it('should include PURL for each component', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      const jsYaml = doc.components.find((c) => c.name === 'js-yaml');
      expect(jsYaml?.purl).toBe('pkg:npm/js-yaml@4.1.0');
    });

    it('should include SHA-256 hashes', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      for (const component of doc.components) {
        expect(component.hashes).toBeDefined();
        expect(component.hashes?.some((h) => h.alg === 'SHA-256')).toBe(true);
      }
    });

    it('should include license info', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      const mainComponent = doc.metadata?.component;
      expect(mainComponent?.licenses).toBeDefined();
    });

    it('should include external references', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      const jsYaml = doc.components.find((c) => c.name === 'js-yaml');
      expect(jsYaml?.externalReferences).toBeDefined();
      expect(jsYaml?.externalReferences[0].type).toBe('package-manager');
    });

    it('should build dependency graph', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(doc.dependencies).toBeDefined();
    });

    it('should set correct scope for dev dependencies', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies, {
        includeDevDependencies: true,
      });

      const typescript = doc.components.find((c) => c.name === 'typescript');
      expect(typescript?.scope).toBe('optional');
    });

    it('should set correct scope for regular dependencies', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      const jsYaml = doc.components.find((c) => c.name === 'js-yaml');
      expect(jsYaml?.scope).toBe('required');
    });
  });

  describe('toCycloneDXJSON', () => {
    it('should generate valid JSON', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);
      const json = toCycloneDXJSON(doc);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all required fields', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);
      const json = toCycloneDXJSON(doc);
      const parsed = JSON.parse(json);

      expect(parsed.bomFormat).toBe('CycloneDX');
      expect(parsed.components).toBeDefined();
    });

    it('should format as pretty JSON', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);
      const json = toCycloneDXJSON(doc);

      expect(json).toContain('\n');
    });
  });

  describe('validateCycloneDX', () => {
    it('should validate correct CycloneDX document', () => {
      const doc = generateCycloneDX(mockProject, mockDependencies);

      expect(validateCycloneDX(doc)).toBe(true);
    });

    it('should reject non-CycloneDX documents', () => {
      expect(validateCycloneDX({})).toBe(false);
      expect(validateCycloneDX(null)).toBe(false);
      expect(validateCycloneDX({ bomFormat: 'Wrong' })).toBe(false);
    });

    it('should reject documents without components', () => {
      expect(
        validateCycloneDX({
          bomFormat: 'CycloneDX',
          specVersion: '1.5',
          version: 1,
          components: [],
        })
      ).toBe(false);
    });

    it('should reject documents with wrong spec version', () => {
      expect(
        validateCycloneDX({
          bomFormat: 'CycloneDX',
          specVersion: '1.4',
          version: 1,
          components: [{ name: 'test' }],
        })
      ).toBe(false);
    });
  });
});
