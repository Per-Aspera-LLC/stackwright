/**
 * Generator tests
 * @package @stackwright/sbom-generator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSBOM } from '../src/generator';
import { rm } from 'node:fs/promises';
import { mkdtempSync } from 'node:fs';

// Mock dependencies - 2 regular + 1 dev
const allMockDeps = [
  { name: 'js-yaml', version: '4.1.0', dependencies: {}, isDev: false, isPeer: false, depth: 0 },
  { name: 'zod', version: '3.22.0', dependencies: {}, isDev: false, isPeer: false, depth: 0 },
  { name: 'typescript', version: '5.0.0', dependencies: {}, isDev: true, isPeer: false, depth: 0 },
];

vi.mock('../src/analyzer', () => ({
  analyzeDependencies: vi
    .fn()
    .mockImplementation(async (options: { includeDevDependencies?: boolean }) => {
      const deps = options.includeDevDependencies
        ? allMockDeps
        : allMockDeps.filter((d) => !d.isDev);
      return {
        project: {
          name: '@stackwright/test-package',
          version: '1.0.0',
          root: '/test',
          isMonorepo: false,
        },
        dependencies: deps,
      };
    }),
}));

describe('SBOM Generator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync('/tmp/sbom-test-');
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  describe('createSBOM', () => {
    it('should create SBOM with all formats', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['spdx', 'cyclonedx', 'build-manifest'],
      });

      expect(sbom.project.name).toBe('@stackwright/test-package');
      expect(sbom.dependencies).toHaveLength(2); // dev deps excluded by default
      expect(sbom.spdx).toBeDefined();
      expect(sbom.cyclonedx).toBeDefined();
      expect(sbom.buildManifest).toBeDefined();
    });

    it('should create SBOM with only SPDX format', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['spdx'],
      });

      expect(sbom.spdx).toBeDefined();
      expect(sbom.cyclonedx).toBeUndefined();
      expect(sbom.buildManifest).toBeUndefined();
    });

    it('should create SBOM with only CycloneDX format', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['cyclonedx'],
      });

      expect(sbom.spdx).toBeUndefined();
      expect(sbom.cyclonedx).toBeDefined();
      expect(sbom.buildManifest).toBeUndefined();
    });

    it('should create SBOM with only build manifest format', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['build-manifest'],
      });

      expect(sbom.spdx).toBeUndefined();
      expect(sbom.cyclonedx).toBeUndefined();
      expect(sbom.buildManifest).toBeDefined();
    });

    it('should include dev dependencies when requested', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['build-manifest'],
        includeDevDependencies: true,
      });

      expect(sbom.dependencies).toHaveLength(3);
      expect(sbom.buildManifest?.dependencies.some((d) => d.type === 'dev')).toBe(true);
    });

    it('should exclude dev dependencies by default', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['build-manifest'],
      });

      expect(sbom.buildManifest?.dependencies.some((d) => d.type === 'dev')).toBe(false);
    });
  });

  describe('SBOM.writeTo', () => {
    it('should write all formats to disk', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['spdx', 'cyclonedx', 'build-manifest'],
      });

      await sbom.writeTo(tempDir);

      const summary = sbom.getSummary();
      expect(summary.formats).toContain('spdx');
      expect(summary.formats).toContain('cyclonedx');
      expect(summary.formats).toContain('build-manifest');
    });
  });

  describe('SBOM.getSummary', () => {
    it('should return correct summary with dev deps excluded by default', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['spdx', 'build-manifest'],
      });

      const summary = sbom.getSummary();
      expect(summary.projectName).toBe('@stackwright/test-package');
      expect(summary.totalDependencies).toBe(2);
      expect(summary.devDependencies).toBe(0);
    });

    it('should include dev dependencies in summary when included', async () => {
      const sbom = await createSBOM({
        projectRoot: '/test',
        formats: ['build-manifest'],
        includeDevDependencies: true,
      });

      const summary = sbom.getSummary();
      expect(summary.totalDependencies).toBe(3);
      expect(summary.devDependencies).toBe(1);
    });
  });
});
