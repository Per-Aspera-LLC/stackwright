/**
 * Tests for pnpm lockfile normalizer — specifically v9 format parsing
 */
import { describe, it, expect } from 'vitest';
import { parseLockfilePackages } from '../src/normalizers/pnpm';

describe('parseLockfilePackages', () => {
  it('parses pnpm v9 format keys (no node_modules/ in key)', () => {
    const packages = {
      'js-yaml@4.1.1': {
        resolution: { integrity: 'sha512-abc123' },
      },
      'react@19.2.6': {
        resolution: { integrity: 'sha512-def456' },
      },
      '@scope/pkg@1.0.0': {
        resolution: { integrity: 'sha512-ghi789' },
      },
    };

    const result = parseLockfilePackages(packages as any, '/fake/root');

    expect(result).toHaveLength(3);
    expect(result.find((d) => d.name === 'js-yaml')?.version).toBe('4.1.1');
    expect(result.find((d) => d.name === 'react')?.version).toBe('19.2.6');
    expect(result.find((d) => d.name === '@scope/pkg')?.version).toBe('1.0.0');
  });

  it('reads integrity from resolution.integrity for v9 packages', () => {
    const packages = {
      'js-yaml@4.1.1': {
        resolution: { integrity: 'sha512-abc123' },
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result[0].integrity).toBe('sha512-abc123');
  });

  it('strips peer context from v9 snapshot keys', () => {
    const packages = {
      'typescript@5.4.5(tslib@2.6.0)': {
        resolution: { integrity: 'sha512-xyz' },
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('typescript');
    expect(result[0].version).toBe('5.4.5');
  });

  it('strips leading slash from v5/v6 format keys', () => {
    const packages = {
      '/react@18.0.0': {
        version: '18.0.0',
        integrity: 'sha512-old',
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('react');
    expect(result[0].version).toBe('18.0.0');
  });

  it('reads integrity from pkg.integrity for v5/v6 packages', () => {
    const packages = {
      '/react@18.0.0': {
        version: '18.0.0',
        integrity: 'sha512-legacy-hash',
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result[0].integrity).toBe('sha512-legacy-hash');
  });

  it('prefers resolution.integrity over pkg.integrity when both present', () => {
    const packages = {
      'react@18.0.0': {
        resolution: { integrity: 'sha512-from-resolution' },
        integrity: 'sha512-old-field',
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result[0].integrity).toBe('sha512-from-resolution');
  });

  it('handles scoped packages in v9 format', () => {
    const packages = {
      '@adobe/css-tools@4.4.4': {
        resolution: { integrity: 'sha512-adobe-hash' },
      },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('@adobe/css-tools');
    expect(result[0].version).toBe('4.4.4');
  });

  it('returns 0 deps for empty packages object', () => {
    expect(parseLockfilePackages({}, '/fake/root')).toHaveLength(0);
  });

  it('skips malformed entries gracefully', () => {
    const packages = {
      'valid-pkg@1.0.0': { resolution: { integrity: 'sha512-ok' } },
      'no-version-at-all': { resolution: { integrity: 'sha512-bad' } },
      '': { resolution: { integrity: 'sha512-empty' } },
    };
    const result = parseLockfilePackages(packages as any, '/fake/root');
    // Only valid-pkg@1.0.0 should parse successfully
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('valid-pkg');
  });
});
