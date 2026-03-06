import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { stageChanges, openPr } from '../../src/commands/git-ops';

const exec = promisify(execFile);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-gitops-test-'));
}

async function initGitRepo(dir: string): Promise<void> {
  await exec('git', ['init'], { cwd: dir });
  await exec('git', ['config', 'user.email', 'test@stackwright.dev'], { cwd: dir });
  await exec('git', ['config', 'user.name', 'Stackwright Test'], { cwd: dir });
  // Initial commit so we have a branch
  await exec('git', ['commit', '--allow-empty', '-m', 'init'], { cwd: dir });
}

function makePageYaml(heading: string): string {
  return `content:
  content_items:
    - main:
        label: "hero"
        heading:
          text: "${heading}"
          textSize: "h1"
        textBlocks:
          - text: "Test page body"
            textSize: "body1"
`;
}

function makeValidSiteConfig(): string {
  return `title: "Test Site"
themeName: "per-aspera"
description: "A test site"
navigation:
  - label: "Home"
    href: "/"
appBar:
  titleText: "Test Site"
footer:
  copyright: "© 2026 Test"
`;
}

// ---------------------------------------------------------------------------
// stageChanges
// ---------------------------------------------------------------------------

describe('stageChanges', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = makeTmpDir();
    await initGitRepo(testDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  it('returns empty when no changes exist', async () => {
    const result = await stageChanges(testDir);
    expect(result.staged).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it('stages page YAML files in pages/', async () => {
    const pageDir = path.join(testDir, 'pages', 'about');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makePageYaml('About'));

    const result = await stageChanges(testDir);
    expect(result.staged).toContain('pages/about/content.yml');
  });

  it('stages page YAML files in content/pages/', async () => {
    const pageDir = path.join(testDir, 'content', 'pages', 'about');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makePageYaml('About'));

    const result = await stageChanges(testDir);
    expect(result.staged).toContain('content/pages/about/content.yml');
  });

  it('stages site config files', async () => {
    fs.writeFileSync(path.join(testDir, 'stackwright.yml'), makeValidSiteConfig());

    const result = await stageChanges(testDir);
    expect(result.staged).toContain('stackwright.yml');
  });

  it('stages co-located images', async () => {
    const pageDir = path.join(testDir, 'pages', 'about');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'hero.png'), 'fake-png-data');

    const result = await stageChanges(testDir);
    expect(result.staged).toContain('pages/about/hero.png');
  });

  it('skips non-content files', async () => {
    fs.writeFileSync(path.join(testDir, '.env'), 'SECRET=123');
    fs.writeFileSync(path.join(testDir, 'package.json'), '{}');

    const result = await stageChanges(testDir);
    expect(result.staged).toHaveLength(0);
    expect(result.skipped).toContain('.env');
    expect(result.skipped).toContain('package.json');
  });

  it('stages only specified paths when paths option is provided', async () => {
    const aboutDir = path.join(testDir, 'pages', 'about');
    const contactDir = path.join(testDir, 'pages', 'contact');
    fs.ensureDirSync(aboutDir);
    fs.ensureDirSync(contactDir);
    fs.writeFileSync(path.join(aboutDir, 'content.yml'), makePageYaml('About'));
    fs.writeFileSync(path.join(contactDir, 'content.yml'), makePageYaml('Contact'));

    const result = await stageChanges(testDir, { paths: ['pages/about/content.yml'] });
    expect(result.staged).toContain('pages/about/content.yml');
    expect(result.staged).not.toContain('pages/contact/content.yml');
  });

  it('actually stages files in git', async () => {
    const pageDir = path.join(testDir, 'pages', 'test');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makePageYaml('Test'));

    await stageChanges(testDir);

    // Verify git knows about the staged file
    const { stdout } = await exec('git', ['diff', '--cached', '--name-only'], { cwd: testDir });
    expect(stdout.trim()).toContain('pages/test/content.yml');
  });
});

// ---------------------------------------------------------------------------
// openPr — validation gate tests (no remote needed)
// ---------------------------------------------------------------------------

describe('openPr', () => {
  let testDir: string;
  let pagesDir: string;
  let siteConfigPath: string;

  beforeEach(async () => {
    testDir = makeTmpDir();
    await initGitRepo(testDir);
    pagesDir = path.join(testDir, 'pages');
    siteConfigPath = path.join(testDir, 'stackwright.yml');
    fs.ensureDirSync(pagesDir);
  });

  afterEach(() => {
    fs.removeSync(testDir);
  });

  it('throws NO_STAGED_CHANGES when nothing is staged', async () => {
    await expect(
      openPr(testDir, pagesDir, siteConfigPath)
    ).rejects.toThrow('No staged changes to commit');

    try {
      await openPr(testDir, pagesDir, siteConfigPath);
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('NO_STAGED_CHANGES');
    }
  });

  it('throws VALIDATION_FAILED for invalid staged page YAML', async () => {
    // Create an invalid page and stage it
    const pageDir = path.join(pagesDir, 'broken');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), 'invalid: true\n');
    await exec('git', ['add', 'pages/broken/content.yml'], { cwd: testDir });

    await expect(
      openPr(testDir, pagesDir, siteConfigPath)
    ).rejects.toThrow('validation failed');

    try {
      await openPr(testDir, pagesDir, siteConfigPath);
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('VALIDATION_FAILED');
    }
  });

  it('throws VALIDATION_FAILED for invalid staged site config', async () => {
    // Create an invalid site config and stage it
    fs.writeFileSync(siteConfigPath, 'invalid: true\n');
    await exec('git', ['add', 'stackwright.yml'], { cwd: testDir });

    await expect(
      openPr(testDir, pagesDir, siteConfigPath)
    ).rejects.toThrow('validation failed');

    try {
      await openPr(testDir, pagesDir, siteConfigPath);
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('VALIDATION_FAILED');
    }
  });

  it('does not create a branch or commit when validation fails', async () => {
    const pageDir = path.join(pagesDir, 'bad');
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), 'invalid: true\n');
    await exec('git', ['add', 'pages/bad/content.yml'], { cwd: testDir });

    // Record branches before
    const { stdout: branchesBefore } = await exec('git', ['branch'], { cwd: testDir });

    try {
      await openPr(testDir, pagesDir, siteConfigPath);
    } catch {
      // expected
    }

    // Branches should be unchanged
    const { stdout: branchesAfter } = await exec('git', ['branch'], { cwd: testDir });
    expect(branchesAfter).toBe(branchesBefore);
  });
});
