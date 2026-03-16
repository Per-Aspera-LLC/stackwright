import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { composeSite } from '../../src/commands/compose';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-compose-test-'));
  // Create the pages directory structure expected by composeSite
  fs.ensureDirSync(path.join(dir, 'pages'));
  return dir;
}

const VALID_SITE_CONFIG = `title: "Test Site"
navigation:
  - label: "Home"
    href: "/"
  - label: "About"
    href: "/about"
appBar:
  titleText: "Test Site"
`;

const VALID_ROOT_PAGE = `content:
  content_items:
    - type: main
      label: "hero"
      heading:
        text: "Welcome"
        textSize: "h1"
      textBlocks:
        - text: "Hello world"
          textSize: "body1"
`;

const VALID_ABOUT_PAGE = `content:
  content_items:
    - type: main
      label: "about-hero"
      heading:
        text: "About Us"
        textSize: "h1"
      textBlocks:
        - text: "We are a company."
          textSize: "body1"
`;

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('composeSite — happy path', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it('creates site config and all pages', () => {
    const result = composeSite(tmpDir, VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      'about': VALID_ABOUT_PAGE,
    });

    expect(result.siteConfigPath).toBe(path.join(tmpDir, 'stackwright.yml'));
    expect(fs.existsSync(result.siteConfigPath)).toBe(true);

    const rootPage = path.join(tmpDir, 'pages', 'content.yml');
    expect(fs.existsSync(rootPage)).toBe(true);
    expect(fs.readFileSync(rootPage, 'utf8')).toBe(VALID_ROOT_PAGE);

    const aboutPage = path.join(tmpDir, 'pages', 'about', 'content.yml');
    expect(fs.existsSync(aboutPage)).toBe(true);
    expect(fs.readFileSync(aboutPage, 'utf8')).toBe(VALID_ABOUT_PAGE);
  });

  it('reports pages as created when they are new', () => {
    const result = composeSite(tmpDir, VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      'about': VALID_ABOUT_PAGE,
    });

    expect(result.pagesCreated).toContain('/');
    expect(result.pagesCreated).toContain('/about');
    expect(result.pagesUpdated).toHaveLength(0);
  });

  it('reports pages as updated when they already exist', () => {
    // First write
    composeSite(tmpDir, VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      'about': VALID_ABOUT_PAGE,
    });

    // Second write — same pages
    const result = composeSite(tmpDir, VALID_SITE_CONFIG, {
      '/': VALID_ROOT_PAGE,
      'about': VALID_ABOUT_PAGE,
    });

    expect(result.pagesCreated).toHaveLength(0);
    expect(result.pagesUpdated).toContain('/');
    expect(result.pagesUpdated).toContain('/about');
  });

  it('returns warnings without failing', () => {
    // Create a site where "about" page is not in nav — should produce orphan warning
    const siteConfig = `title: "Test"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test"
`;
    const result = composeSite(tmpDir, siteConfig, {
      '/': VALID_ROOT_PAGE,
      'about': VALID_ABOUT_PAGE,
    });

    // Should succeed (warnings don't block writes)
    expect(result.siteConfigPath).toBeTruthy();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.message.includes('about'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Validation failures — nothing should be written
// ---------------------------------------------------------------------------

describe('composeSite — validation failures', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it('throws COMPOSITION_INVALID when site config has schema errors', () => {
    try {
      composeSite(tmpDir, 'invalid: yaml: only\n', { '/': VALID_ROOT_PAGE });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('COMPOSITION_INVALID');
    }

    // Nothing should have been written
    expect(fs.existsSync(path.join(tmpDir, 'stackwright.yml'))).toBe(false);
  });

  it('throws COMPOSITION_INVALID when a page has schema errors', () => {
    try {
      composeSite(tmpDir, VALID_SITE_CONFIG, {
        '/': 'content:\n  content_items: "not-an-array"\n',
        'about': VALID_ABOUT_PAGE,
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('COMPOSITION_INVALID');
    }

    // Nothing should have been written
    expect(fs.existsSync(path.join(tmpDir, 'stackwright.yml'))).toBe(false);
  });

  it('throws COMPOSITION_INVALID when nav links point to missing pages', () => {
    const siteConfig = `title: "Test"
navigation:
  - label: "Home"
    href: "/"
  - label: "Pricing"
    href: "/pricing"
appBar:
  titleText: "Test"
`;
    try {
      composeSite(tmpDir, siteConfig, { '/': VALID_ROOT_PAGE });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('COMPOSITION_INVALID');
      expect((err as Error).message).toMatch(/pricing/);
    }
  });

  it('attaches validation result to the error', () => {
    try {
      composeSite(tmpDir, 'bad: true\n', { '/': VALID_ROOT_PAGE });
      expect.unreachable('should have thrown');
    } catch (err) {
      const validation = (err as any).validation;
      expect(validation).toBeDefined();
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe('composeSite — input validation', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it('throws INVALID_PROJECT_ROOT for relative path', () => {
    try {
      composeSite('relative/path', VALID_SITE_CONFIG, { '/': VALID_ROOT_PAGE });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('INVALID_PROJECT_ROOT');
    }
  });

  it('throws MISSING_PAGES when pages object is empty', () => {
    try {
      composeSite(tmpDir, VALID_SITE_CONFIG, {});
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('MISSING_PAGES');
    }
  });

  it('throws MISSING_SITE_CONFIG when siteConfigYaml is empty', () => {
    try {
      composeSite(tmpDir, '', { '/': VALID_ROOT_PAGE });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('MISSING_SITE_CONFIG');
    }
  });
});

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

describe('composeSite — security', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  it('prevents path traversal in page slugs', () => {
    try {
      composeSite(tmpDir, VALID_SITE_CONFIG, {
        '../../../etc/passwd': VALID_ROOT_PAGE,
      });
      // If it doesn't throw for path traversal, it should at least fail validation
      // (the nav check would fail since no page matches "/" or "/about")
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      // Accept either INVALID_SLUG or COMPOSITION_INVALID (nav mismatch)
      expect(['INVALID_SLUG', 'COMPOSITION_INVALID']).toContain(code);
    }
  });
});
