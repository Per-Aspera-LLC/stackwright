import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { scaffold } from '../../src/commands/scaffold';

// ---------------------------------------------------------------------------
// Mock template-fetcher: __dirname differs in vitest (src/) vs built (dist/).
// We point the bundled copy at the real templates directory.
// ---------------------------------------------------------------------------

const TEMPLATES_DIR = path.resolve(__dirname, '../../templates/scaffold-template');

vi.mock('../../src/utils/template-fetcher', () => ({
  fetchTemplate: async (targetDir: string): Promise<{ source: 'bundled' }> => {
    await fs.ensureDir(targetDir);
    await fs.copy(TEMPLATES_DIR, targetDir, { overwrite: true });
    return { source: 'bundled' as const };
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-scaffold-test-'));
}

/** Standard non-interactive + offline options to avoid prompts and network. */
function baseOpts(overrides: Record<string, unknown> = {}) {
  return { noInteractive: true, offline: true, ...overrides };
}

function readYaml(filePath: string): unknown {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// ---------------------------------------------------------------------------
// Directory guards
// ---------------------------------------------------------------------------

describe('scaffold — directory guards', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('throws DIR_EXISTS for a non-empty directory', async () => {
    const targetDir = path.join(tmpDir, 'existing');
    fs.ensureDirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, 'file.txt'), 'occupied');

    try {
      await scaffold(targetDir, baseOpts());
      expect.unreachable('should have thrown');
    } catch (err) {
      expect((err as NodeJS.ErrnoException).code).toBe('DIR_EXISTS');
      expect((err as Error).message).toContain('--force');
    }
  });

  it('allows scaffold into non-empty directory with --force', async () => {
    const targetDir = path.join(tmpDir, 'existing');
    fs.ensureDirSync(targetDir);
    fs.writeFileSync(path.join(targetDir, 'file.txt'), 'occupied');

    const result = await scaffold(targetDir, baseOpts({ force: true }));
    expect(result.path).toBe(targetDir);
    expect(fs.existsSync(path.join(targetDir, 'stackwright.yml'))).toBe(true);
  });

  it('succeeds for an empty directory without --force', async () => {
    const targetDir = path.join(tmpDir, 'fresh');
    fs.ensureDirSync(targetDir);

    const result = await scaffold(targetDir, baseOpts());
    expect(result.path).toBe(targetDir);
  });

  it('creates the target directory if it does not exist', async () => {
    const targetDir = path.join(tmpDir, 'brand-new');

    const result = await scaffold(targetDir, baseOpts());
    expect(fs.existsSync(targetDir)).toBe(true);
    expect(result.path).toBe(targetDir);
  });
});

// ---------------------------------------------------------------------------
// Non-interactive defaults
// ---------------------------------------------------------------------------

describe('scaffold — non-interactive defaults', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('defaults project name to directory basename', async () => {
    const targetDir = path.join(tmpDir, 'my-cool-app');

    const result = await scaffold(targetDir, baseOpts());
    const pkg = readJson(path.join(targetDir, 'package.json'));
    expect(pkg.name).toBe('my-cool-app');
    expect(result.pages.length).toBeGreaterThan(0);
  });

  it('defaults title to project name', async () => {
    const targetDir = path.join(tmpDir, 'awesome-site');

    await scaffold(targetDir, baseOpts());
    const site = readYaml(path.join(targetDir, 'stackwright.yml')) as Record<string, unknown>;
    expect(site.title).toBe('awesome-site');
  });

  it('defaults theme to corporate', async () => {
    const targetDir = path.join(tmpDir, 'themed');

    const result = await scaffold(targetDir, baseOpts());
    expect(result.theme).toBe('corporate');
  });

  it('uses custom name, title, and theme when provided', async () => {
    const targetDir = path.join(tmpDir, 'custom');

    const result = await scaffold(
      targetDir,
      baseOpts({ name: 'my-proj', title: 'My Project', theme: 'soft' })
    );
    expect(result.theme).toBe('soft');

    const pkg = readJson(path.join(targetDir, 'package.json'));
    expect(pkg.name).toBe('my-proj');

    const site = readYaml(path.join(targetDir, 'stackwright.yml')) as Record<string, unknown>;
    expect(site.title).toBe('My Project');
    expect(site.themeName).toBe('soft');
  });
});

// ---------------------------------------------------------------------------
// Dependency mode detection
// ---------------------------------------------------------------------------

describe('scaffold — dependency mode', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('auto-detects standalone when scaffolding in /tmp (outside monorepo)', async () => {
    const targetDir = path.join(tmpDir, 'standalone');

    const result = await scaffold(targetDir, baseOpts());
    expect(result.dependencyMode).toBe('standalone');
  });

  it('forces workspace mode with --monorepo', async () => {
    const targetDir = path.join(tmpDir, 'mono');

    const result = await scaffold(targetDir, baseOpts({ monorepo: true }));
    expect(result.dependencyMode).toBe('workspace');
  });

  it('forces standalone with --standalone even inside monorepo', async () => {
    const targetDir = path.join(tmpDir, 'solo');

    const result = await scaffold(targetDir, baseOpts({ standalone: true }));
    expect(result.dependencyMode).toBe('standalone');
  });

  it('package.json uses workspace:* deps when --monorepo', async () => {
    const targetDir = path.join(tmpDir, 'mono-deps');

    await scaffold(targetDir, baseOpts({ monorepo: true }));
    const pkg = readJson(path.join(targetDir, 'package.json'));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@stackwright/core']).toBe('workspace:*');
    expect(deps['@stackwright/nextjs']).toBe('workspace:*');
  });

  it('package.json uses versioned deps when --standalone', async () => {
    const targetDir = path.join(tmpDir, 'standalone-deps');

    await scaffold(targetDir, baseOpts({ standalone: true }));
    const pkg = readJson(path.join(targetDir, 'package.json'));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@stackwright/core']).not.toBe('workspace:*');
    expect(deps['@stackwright/core']).toBe('^0.7.0');
  });
});

// ---------------------------------------------------------------------------
// Result shape
// ---------------------------------------------------------------------------

describe('scaffold — result shape', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('returns all expected fields', async () => {
    const targetDir = path.join(tmpDir, 'result-shape');
    const result = await scaffold(
      targetDir,
      baseOpts({ name: 'shaped', title: 'Shaped', theme: 'soft' })
    );

    expect(result.path).toBe(targetDir);
    expect(result.theme).toBe('soft');
    expect(result.dependencyMode).toBe('standalone');
    expect(result.siteConfigPath).toBe(path.join(targetDir, 'stackwright.yml'));
    expect(result.pagesDir).toBe(path.join(targetDir, 'pages'));
    expect(result.nextSteps).toBeInstanceOf(Array);
    expect(result.nextSteps.length).toBeGreaterThan(0);
  });

  it('nextSteps include cd, install, and dev commands', async () => {
    const targetDir = path.join(tmpDir, 'next-steps');
    const result = await scaffold(targetDir, baseOpts({ name: 'steps' }));

    const commands = result.nextSteps.map((s) => s.command);
    expect(commands.some((c) => c.includes('cd'))).toBe(true);
    expect(commands.some((c) => c.includes('pnpm install'))).toBe(true);
    expect(commands.some((c) => c.includes('pnpm dev'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Hook lifecycle — regression tests for issue #351
// ---------------------------------------------------------------------------

describe('scaffold — preInstall hook lifecycle (issue #351)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(async () => {
    fs.removeSync(tmpDir);
    // Reset hook registry so registered hooks don't bleed across tests
    const { resetForTesting } = await import('@stackwright/scaffold-core');
    resetForTesting();
  });

  it('preInstall hook runs exactly once', async () => {
    const { registerScaffoldHook } = await import('@stackwright/scaffold-core');
    const spy = vi.fn();
    registerScaffoldHook({
      type: 'preInstall',
      name: 'test-spy-hook',
      handler: async () => {
        spy();
      },
    });

    const targetDir = path.join(tmpDir, 'hook-once');
    await scaffold(targetDir, baseOpts({ name: 'hook-once' }));

    expect(spy).toHaveBeenCalledOnce();
  });

  it('preInstall hook modifications appear in the written package.json', async () => {
    const { registerScaffoldHook } = await import('@stackwright/scaffold-core');
    registerScaffoldHook({
      type: 'preInstall',
      name: 'test-dep-hook',
      handler: async (ctx) => {
        ctx.packageJson.dependencies = {
          ...((ctx.packageJson.dependencies as Record<string, string>) ?? {}),
          '@test-pro/widget': '^1.2.3',
        };
      },
    });

    const targetDir = path.join(tmpDir, 'hook-writes');
    await scaffold(targetDir, baseOpts({ name: 'hook-writes' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@test-pro/widget']).toBe('^1.2.3');
  });
});
