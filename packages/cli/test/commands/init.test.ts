import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { init } from '../../src/commands/init';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-init-test-'));
}

/** A bare-minimum Node.js project: just a package.json. */
function makeNodeProject(dir: string): void {
  fs.ensureDirSync(dir);
  fs.writeJsonSync(path.join(dir, 'package.json'), { name: path.basename(dir) });
}

function readYaml(filePath: string): unknown {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

/** Standard non-interactive options to avoid prompts. */
const NO_INTERACTIVE = { noInteractive: true };

// ---------------------------------------------------------------------------
// Error guards
// ---------------------------------------------------------------------------

describe('init — error guards', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('throws TARGET_NOT_FOUND when directory does not exist', async () => {
    const missing = path.join(tmpDir, 'does-not-exist');
    await expect(init(missing, NO_INTERACTIVE)).rejects.toMatchObject({
      code: 'TARGET_NOT_FOUND',
    });
  });

  it('throws NOT_A_NODEJS_PROJECT when package.json is absent', async () => {
    const bare = path.join(tmpDir, 'bare');
    fs.ensureDirSync(bare);
    await expect(init(bare, NO_INTERACTIVE)).rejects.toMatchObject({
      code: 'NOT_A_NODEJS_PROJECT',
    });
  });
});

// ---------------------------------------------------------------------------
// File creation
// ---------------------------------------------------------------------------

describe('init — file creation', () => {
  let tmpDir: string;
  let projectDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    projectDir = path.join(tmpDir, 'my-site');
    makeNodeProject(projectDir);
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('creates stackwright.yml with title and theme', async () => {
    await init(projectDir, { ...NO_INTERACTIVE, title: 'My Site', theme: 'soft' });

    const config = readYaml(path.join(projectDir, 'stackwright.yml')) as Record<string, string>;
    expect(config.title).toBe('My Site');
    expect(config.themeName).toBe('soft');
  });

  it('creates pages/content.yml by default when pages/ does not exist', async () => {
    const result = await init(projectDir, { ...NO_INTERACTIVE, title: 'Hello' });

    expect(result.rootPageCreated).toBe(true);
    expect(result.rootPagePath).toBe(path.join(projectDir, 'pages', 'content.yml'));
    expect(fs.existsSync(result.rootPagePath)).toBe(true);
  });

  it('root page content contains the site title', async () => {
    await init(projectDir, { ...NO_INTERACTIVE, title: 'Awesome Site' });

    const page = readYaml(path.join(projectDir, 'pages', 'content.yml')) as Record<string, unknown>;
    const content = page.content as Record<string, unknown>;
    const items = content.content_items as Array<Record<string, unknown>>;
    const heading = items[0].heading as Record<string, string>;
    expect(heading.text).toContain('Awesome Site');
  });

  it('returns correct InitResult shape', async () => {
    const result = await init(projectDir, { ...NO_INTERACTIVE, title: 'Test', theme: 'corporate' });

    expect(result.targetDir).toBe(projectDir);
    expect(result.siteConfigCreated).toBe(true);
    expect(result.rootPageCreated).toBe(true);
    expect(result.theme).toBe('corporate');
    expect(result.title).toBe('Test');
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  it('nextSteps includes the pnpm add command', async () => {
    const result = await init(projectDir, NO_INTERACTIVE);

    const commands = result.nextSteps.map((s) => s.command);
    expect(commands.some((c) => c.includes('@stackwright/nextjs'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Pages directory resolution
// ---------------------------------------------------------------------------

describe('init — pages dir resolution', () => {
  let tmpDir: string;
  let projectDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    projectDir = path.join(tmpDir, 'my-site');
    makeNodeProject(projectDir);
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('prefers pages/ when it already exists', async () => {
    fs.ensureDirSync(path.join(projectDir, 'pages'));

    const result = await init(projectDir, NO_INTERACTIVE);

    expect(result.rootPagePath).toBe(path.join(projectDir, 'pages', 'content.yml'));
  });

  it('uses content/pages/ when pages/ is absent but content/pages/ exists', async () => {
    fs.ensureDirSync(path.join(projectDir, 'content', 'pages'));

    const result = await init(projectDir, NO_INTERACTIVE);

    expect(result.rootPagePath).toBe(path.join(projectDir, 'content', 'pages', 'content.yml'));
  });

  it('defaults to pages/ when neither pages/ nor content/pages/ exist', async () => {
    const result = await init(projectDir, NO_INTERACTIVE);

    expect(result.rootPagePath).toBe(path.join(projectDir, 'pages', 'content.yml'));
  });
});

// ---------------------------------------------------------------------------
// Idempotency — existing files must never be overwritten
// ---------------------------------------------------------------------------

describe('init — idempotency', () => {
  let tmpDir: string;
  let projectDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    projectDir = path.join(tmpDir, 'my-site');
    makeNodeProject(projectDir);
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('does not overwrite an existing stackwright.yml', async () => {
    const configPath = path.join(projectDir, 'stackwright.yml');
    const original = 'title: "Original"\nthemeName: "soft"\n';
    fs.writeFileSync(configPath, original, 'utf8');

    const result = await init(projectDir, {
      ...NO_INTERACTIVE,
      title: 'Changed',
      theme: 'corporate',
    });

    expect(result.siteConfigCreated).toBe(false);
    expect(fs.readFileSync(configPath, 'utf8')).toBe(original);
  });

  it('does not overwrite an existing pages/content.yml', async () => {
    const pagesDir = path.join(projectDir, 'pages');
    fs.ensureDirSync(pagesDir);
    const pagePath = path.join(pagesDir, 'content.yml');
    const original = 'content:\n  content_items: []\n';
    fs.writeFileSync(pagePath, original, 'utf8');

    const result = await init(projectDir, NO_INTERACTIVE);

    expect(result.rootPageCreated).toBe(false);
    expect(fs.readFileSync(pagePath, 'utf8')).toBe(original);
  });

  it('reports skipped=false for both files when both already exist', async () => {
    fs.writeFileSync(path.join(projectDir, 'stackwright.yml'), 'title: "x"\nthemeName: "soft"\n');
    const pagesDir = path.join(projectDir, 'pages');
    fs.ensureDirSync(pagesDir);
    fs.writeFileSync(path.join(pagesDir, 'content.yml'), 'content:\n  content_items: []\n');

    const result = await init(projectDir, NO_INTERACTIVE);

    expect(result.siteConfigCreated).toBe(false);
    expect(result.rootPageCreated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Non-interactive defaults
// ---------------------------------------------------------------------------

describe('init — non-interactive defaults', () => {
  let tmpDir: string;
  let projectDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    projectDir = path.join(tmpDir, 'cool-project');
    makeNodeProject(projectDir);
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('uses basename of targetDir as default title', async () => {
    const result = await init(projectDir, NO_INTERACTIVE);
    expect(result.title).toBe('cool-project');
  });

  it('uses corporate as default theme', async () => {
    const result = await init(projectDir, NO_INTERACTIVE);
    expect(result.theme).toBe('corporate');
  });

  it('json:true implies non-interactive and uses defaults', async () => {
    const result = await init(projectDir, { json: true });
    expect(result.title).toBe('cool-project');
    expect(result.theme).toBe('corporate');
  });
});
