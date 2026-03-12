import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { writeSiteConfig, readSiteConfig, validateSite } from '../../src/commands/site';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-cli-test-'));
}

const VALID_SITE_YAML = `title: "Test Site"
themeName: "per-aspera"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test Site"
footer:
  copyright: "© 2026 Test"
`;

const INVALID_YAML_SYNTAX = 'bad: yaml: [[broken';

const SCHEMA_INVALID_YAML = `themeName: "per-aspera"
`;

// ---------------------------------------------------------------------------
// writeSiteConfig
// ---------------------------------------------------------------------------

describe('writeSiteConfig', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
  });

  it('creates a new file when none exists and returns created: true', () => {
    const result = writeSiteConfig(siteConfigPath, VALID_SITE_YAML);
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.created).toBe(true);
    expect(result.path).toBe(siteConfigPath);
  });

  it('overwrites an existing file and returns created: false', () => {
    fs.writeFileSync(siteConfigPath, 'placeholder', 'utf8');
    const result = writeSiteConfig(siteConfigPath, VALID_SITE_YAML);
    expect(result.created).toBe(false);
    const content = fs.readFileSync(siteConfigPath, 'utf8');
    expect(content).toBe(VALID_SITE_YAML);
  });

  it('throws with code YAML_PARSE_ERROR for invalid YAML syntax', () => {
    try {
      writeSiteConfig(siteConfigPath, INVALID_YAML_SYNTAX);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('YAML_PARSE_ERROR');
    }
  });

  it('throws with code VALIDATION_FAILED for schema-invalid config', () => {
    try {
      writeSiteConfig(siteConfigPath, SCHEMA_INVALID_YAML);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('VALIDATION_FAILED');
    }
  });

  it('includes field-level details in the validation error message', () => {
    try {
      writeSiteConfig(siteConfigPath, SCHEMA_INVALID_YAML);
      expect.unreachable('should have thrown');
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toMatch(/Validation failed/);
      expect(message).toMatch(/title|navigation|appBar/);
    }
  });

  it('does NOT write the file when validation fails', () => {
    try {
      writeSiteConfig(siteConfigPath, SCHEMA_INVALID_YAML);
    } catch {
      // expected
    }
    expect(fs.existsSync(siteConfigPath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// readSiteConfig
// ---------------------------------------------------------------------------

describe('readSiteConfig', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
  });

  it('reads content of an existing site config file', () => {
    fs.writeFileSync(siteConfigPath, VALID_SITE_YAML, 'utf8');
    const result = readSiteConfig(siteConfigPath);
    expect(result.content).toBe(VALID_SITE_YAML);
  });

  it('returns the correct path', () => {
    fs.writeFileSync(siteConfigPath, VALID_SITE_YAML, 'utf8');
    const result = readSiteConfig(siteConfigPath);
    expect(result.path).toBe(siteConfigPath);
  });

  it('throws with code NOT_A_PROJECT when file does not exist', () => {
    try {
      readSiteConfig(siteConfigPath);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('NOT_A_PROJECT');
    }
  });
});

// ---------------------------------------------------------------------------
// validateSite
// ---------------------------------------------------------------------------

describe('validateSite', () => {
  let tmpDir: string;
  let siteConfigPath: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    siteConfigPath = path.join(tmpDir, 'stackwright.yml');
  });

  it('returns valid: true and empty errors for a valid config', () => {
    fs.writeFileSync(siteConfigPath, VALID_SITE_YAML, 'utf8');
    const result = validateSite(siteConfigPath);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid: false with field-level errors for invalid config', () => {
    fs.writeFileSync(siteConfigPath, SCHEMA_INVALID_YAML, 'utf8');
    const result = validateSite(siteConfigPath);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.field.length > 0)).toBe(true);
    expect(result.errors.some((e) => e.message.length > 0)).toBe(true);
  });

  it('returns errors for unparseable YAML', () => {
    fs.writeFileSync(siteConfigPath, INVALID_YAML_SYNTAX, 'utf8');
    const result = validateSite(siteConfigPath);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toMatch(/YAML/i);
  });
});
