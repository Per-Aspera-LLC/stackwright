/**
 * i18n tests for the prebuild pipeline:
 * - findContentFiles locale variant discovery
 * - runPrebuild output routing for locale subdirectories
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild, findContentFiles } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SITE_CONFIG_YAML = `title: "Test Site"
appBar:
  titleText: "Test"
navigation: []
`;

const SITE_CONFIG_WITH_LOCALES_YAML = `title: "Test Site"
appBar:
  titleText: "Test"
navigation: []
locales:
  default: en
  supported:
    - en
    - fr
`;

const PAGE_CONTENT_YAML = `content:
  content_items:
    - type: text_block
      label: "test"
      textBlocks:
        - text: "Hello"
          textSize: "body1"
`;

const PAGE_CONTENT_FR_YAML = `content:
  content_items:
    - type: text_block
      label: "test-fr"
      textBlocks:
        - text: "Bonjour"
          textSize: "body1"
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-i18n-test-'));
}

function makeTmpProject(siteConfig = SITE_CONFIG_YAML): string {
  const root = makeTmpDir();
  fs.writeFileSync(path.join(root, 'stackwright.yml'), siteConfig);
  fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
  return root;
}

function writePageFile(
  root: string,
  /** Relative path from pages/ — empty string means root pages dir */
  slug: string,
  filename: string,
  content: string
): void {
  const dir = slug ? path.join(root, 'pages', slug) : path.join(root, 'pages');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content, 'utf8');
}

// ---------------------------------------------------------------------------
// findContentFiles — locale variant discovery
// ---------------------------------------------------------------------------

describe('findContentFiles — locale variant discovery', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('discovers default content.yml with no locale field', () => {
    const aboutDir = path.join(tmpDir, 'pages', 'about');
    fs.mkdirSync(aboutDir, { recursive: true });
    fs.writeFileSync(path.join(aboutDir, 'content.yml'), PAGE_CONTENT_YAML);

    const results = findContentFiles(path.join(tmpDir, 'pages'));
    expect(results).toHaveLength(1);
    expect(results[0].locale).toBeUndefined();
    expect(results[0].slug).toBe('about');
  });

  it('discovers locale variant files and sets locale field', () => {
    const aboutDir = path.join(tmpDir, 'pages', 'about');
    fs.mkdirSync(aboutDir, { recursive: true });
    fs.writeFileSync(path.join(aboutDir, 'content.yml'), PAGE_CONTENT_YAML);
    fs.writeFileSync(path.join(aboutDir, 'content.fr.yml'), PAGE_CONTENT_FR_YAML);
    fs.writeFileSync(path.join(aboutDir, 'content.de.yml'), PAGE_CONTENT_YAML);

    const results = findContentFiles(path.join(tmpDir, 'pages'));
    expect(results).toHaveLength(3);

    const defaultFile = results.find((r) => r.locale === undefined);
    expect(defaultFile).toBeDefined();
    expect(defaultFile!.slug).toBe('about');

    expect(results.find((r) => r.locale === 'fr')).toBeDefined();
    expect(results.find((r) => r.locale === 'de')).toBeDefined();
  });

  it('ignores non-locale filenames (backup, old, etc.)', () => {
    const aboutDir = path.join(tmpDir, 'pages', 'about');
    fs.mkdirSync(aboutDir, { recursive: true });
    fs.writeFileSync(path.join(aboutDir, 'content.yml'), PAGE_CONTENT_YAML);
    // 'backup' and 'old' are not valid BCP 47 locale tags — should be ignored
    fs.writeFileSync(path.join(aboutDir, 'content.backup.yml'), PAGE_CONTENT_YAML);
    fs.writeFileSync(path.join(aboutDir, 'content.old.yaml'), PAGE_CONTENT_YAML);

    const results = findContentFiles(path.join(tmpDir, 'pages'));
    expect(results).toHaveLength(1);
    expect(results[0].locale).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// runPrebuild — i18n output routing
// ---------------------------------------------------------------------------

describe('runPrebuild — default locale output is unchanged', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
    writePageFile(root, '', 'content.yml', PAGE_CONTENT_YAML);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('writes _root.json at the content root (not in a locale subdir)', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, '_root.json'))).toBe(true);
  });

  it('does NOT create an en/ subdirectory for the default locale', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, 'en'))).toBe(false);
  });
});

describe('runPrebuild — locale variant outputs to subdir', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
    writePageFile(root, '', 'content.yml', PAGE_CONTENT_YAML);
    writePageFile(root, '', 'content.fr.yml', PAGE_CONTENT_FR_YAML);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('writes fr/_root.json for the French locale variant', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, 'fr', '_root.json'))).toBe(true);
  });

  it('default _root.json is still written alongside the locale variant', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, '_root.json'))).toBe(true);
  });
});

describe('runPrebuild — missing locale file produces no locale output', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject(SITE_CONFIG_WITH_LOCALES_YAML);
    const aboutDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(aboutDir, { recursive: true });
    fs.writeFileSync(path.join(aboutDir, 'content.yml'), PAGE_CONTENT_YAML);
    // Intentionally no content.fr.yml
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('build completes without error', async () => {
    await expect(runPrebuild(root)).resolves.not.toThrow();
  });

  it('writes default about.json', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, 'about.json'))).toBe(true);
  });

  it('does NOT create fr/about.json when no fr content file was authored', async () => {
    await runPrebuild(root);
    const contentDir = path.join(root, 'public', 'stackwright-content');
    expect(fs.existsSync(path.join(contentDir, 'fr', 'about.json'))).toBe(false);
  });
});
