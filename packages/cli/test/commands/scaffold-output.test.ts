import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'js-yaml';
import { scaffold } from '../../src/commands/scaffold';
import { siteConfigSchema, pageContentSchema } from '../../src/utils/schema-loader';

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-scaffold-out-'));
}

function baseOpts(overrides: Record<string, unknown> = {}) {
  return { noInteractive: true, offline: true, ...overrides };
}

function readYaml(filePath: string): unknown {
  return yaml.load(fs.readFileSync(filePath, 'utf8'));
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Recursively collect text files, skipping node_modules and .git. */
function collectTextFiles(dir: string): string[] {
  const results: string[] = [];
  const TEXT_EXTS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.yml',
    '.yaml',
    '.md',
    '.css',
  ]);

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectTextFiles(fullPath));
    } else if (TEXT_EXTS.has(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Generated file structure
// ---------------------------------------------------------------------------

describe('scaffold output — file structure', () => {
  let targetDir: string;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = makeTmpDir();
    targetDir = path.join(tmpDir, 'full-project');
    await scaffold(targetDir, baseOpts({ name: 'test-project', title: 'Test Project' }));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('creates stackwright.yml', () => {
    expect(fs.existsSync(path.join(targetDir, 'stackwright.yml'))).toBe(true);
  });

  it('creates root page at pages/content.yml', () => {
    expect(fs.existsSync(path.join(targetDir, 'pages', 'content.yml'))).toBe(true);
  });

  it('creates getting-started page', () => {
    expect(fs.existsSync(path.join(targetDir, 'pages', 'getting-started', 'content.yml'))).toBe(
      true
    );
  });

  it('creates package.json', () => {
    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
  });

  it('creates tsconfig.json', () => {
    expect(fs.existsSync(path.join(targetDir, 'tsconfig.json'))).toBe(true);
  });

  it('creates Next.js template files', () => {
    expect(fs.existsSync(path.join(targetDir, 'next.config.js'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'pages', '_app.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'pages', '[...slug].tsx'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'pages', 'index.ts'))).toBe(true);
  });

  it('removes template repo README.md', () => {
    expect(fs.existsSync(path.join(targetDir, 'README.md'))).toBe(false);
  });

  it('returns all written files in result.pages', async () => {
    const freshDir = path.join(tmpDir, 'fresh-project');
    const result = await scaffold(freshDir, baseOpts({ name: 'test', title: 'Test' }));
    expect(result.pages).toContain('stackwright.yml');
    expect(result.pages).toContain('pages/content.yml');
    expect(result.pages).toContain('pages/getting-started/content.yml');
    expect(result.pages).toContain('package.json');
    expect(result.pages).toContain('tsconfig.json');
  });
});

// ---------------------------------------------------------------------------
// Site config validation
// ---------------------------------------------------------------------------

describe('scaffold output — site config', () => {
  let targetDir: string;
  let tmpDir: string;
  let siteConfig: Record<string, any>;

  beforeEach(async () => {
    tmpDir = makeTmpDir();
    targetDir = path.join(tmpDir, 'validated');
    await scaffold(
      targetDir,
      baseOpts({ name: 'validated', title: 'My Validated Site', theme: 'corporate' })
    );
    siteConfig = readYaml(path.join(targetDir, 'stackwright.yml')) as Record<string, any>;
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('passes Zod schema validation', () => {
    const parsed = siteConfigSchema.parse(siteConfig);
    expect(parsed).toBeDefined();
  });

  it('has the correct title', () => {
    expect(siteConfig.title).toBe('My Validated Site');
  });

  it('has the correct theme', () => {
    expect(siteConfig.themeName).toBe('corporate');
  });

  it('has navigation with Home and Getting Started', () => {
    expect(siteConfig.navigation).toHaveLength(2);
    expect(siteConfig.navigation[0].label).toBe('Home');
    expect(siteConfig.navigation[0].href).toBe('/');
    expect(siteConfig.navigation[1].label).toBe('Getting Started');
    expect(siteConfig.navigation[1].href).toBe('/getting-started');
  });

  it('has appBar with correct titleText', () => {
    expect(siteConfig.appBar.titleText).toBe('My Validated Site');
  });

  it('has footer with copyright containing current year', () => {
    const year = new Date().getFullYear();
    expect(siteConfig.footer.copyright).toContain(String(year));
    expect(siteConfig.footer.copyright).toContain('My Validated Site');
  });

  it('has customTheme with expected color keys', () => {
    expect(siteConfig.customTheme).toBeDefined();
    expect(siteConfig.customTheme.colors.primary).toBe('#1976d2');
    expect(siteConfig.customTheme.colors.secondary).toBe('#ffffff');
    expect(siteConfig.customTheme.typography.fontFamily.primary).toBe('Inter');
  });

  it('YAML round-trips through parse without data loss', () => {
    const yamlStr = yaml.dump(siteConfig, { lineWidth: 120 });
    const reparsed = yaml.load(yamlStr) as Record<string, unknown>;
    const validated = siteConfigSchema.parse(reparsed);
    expect(validated.title).toBe('My Validated Site');
  });
});

// ---------------------------------------------------------------------------
// Page content validation
// ---------------------------------------------------------------------------

describe('scaffold output — page content', () => {
  let targetDir: string;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = makeTmpDir();
    targetDir = path.join(tmpDir, 'pages-test');
    await scaffold(targetDir, baseOpts({ name: 'pages-test', title: 'Pages Test' }));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('root page passes Zod schema validation', () => {
    const rootPage = readYaml(path.join(targetDir, 'pages', 'content.yml'));
    const parsed = pageContentSchema.parse(rootPage);
    expect(parsed.content.content_items.length).toBeGreaterThan(0);
  });

  it('root page has hero section with site title', () => {
    const rootPage = readYaml(path.join(targetDir, 'pages', 'content.yml')) as any;
    const items = rootPage.content.content_items;
    expect(items).toHaveLength(1);
    const hero = items[0];
    expect(hero.heading.text).toContain('Pages Test');
    expect(hero.heading.textSize).toBe('h1');
  });

  it('root page has text blocks with onboarding copy', () => {
    const rootPage = readYaml(path.join(targetDir, 'pages', 'content.yml')) as any;
    const hero = rootPage.content.content_items[0];
    expect(hero.textBlocks).toHaveLength(2);
    expect(hero.textBlocks[0].text).toContain('Stackwright');
  });

  it('getting-started page passes Zod schema validation', () => {
    const gsPage = readYaml(path.join(targetDir, 'pages', 'getting-started', 'content.yml'));
    const parsed = pageContentSchema.parse(gsPage);
    expect(parsed.content.content_items).toHaveLength(5);
  });

  it('getting-started page has code_block item', () => {
    const gsPage = readYaml(path.join(targetDir, 'pages', 'getting-started', 'content.yml')) as any;
    const codeItem = gsPage.content.content_items.find((item: any) => item.type === 'code_block');
    expect(codeItem).toBeDefined();
    expect(codeItem.language).toBe('bash');
  });

  it('getting-started page YAML round-trips', () => {
    const gsPage = readYaml(path.join(targetDir, 'pages', 'getting-started', 'content.yml'));
    const yamlStr = yaml.dump(gsPage, { lineWidth: 120 });
    const reparsed = yaml.load(yamlStr);
    const validated = pageContentSchema.parse(reparsed);
    expect(validated.content.content_items).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// Extra pages (--pages flag)
// ---------------------------------------------------------------------------

describe('scaffold output — extra pages via --pages', () => {
  let targetDir: string;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = makeTmpDir();
    targetDir = path.join(tmpDir, 'extra-pages');
    await scaffold(
      targetDir,
      baseOpts({ name: 'extra', title: 'Extra Pages', pages: 'about,contact,pricing' })
    );
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('creates page directories for each slug', () => {
    for (const slug of ['about', 'contact', 'pricing']) {
      expect(fs.existsSync(path.join(targetDir, 'pages', slug, 'content.yml'))).toBe(true);
    }
  });

  it('extra pages pass Zod schema validation', () => {
    for (const slug of ['about', 'contact', 'pricing']) {
      const page = readYaml(path.join(targetDir, 'pages', slug, 'content.yml'));
      const parsed = pageContentSchema.parse(page);
      expect(parsed.content.content_items.length).toBeGreaterThan(0);
    }
  });

  it('extra pages have human-readable titles derived from slug', () => {
    const aboutPage = readYaml(path.join(targetDir, 'pages', 'about', 'content.yml')) as any;
    expect(aboutPage.content.content_items[0].heading.text).toBe('About');

    const pricingPage = readYaml(path.join(targetDir, 'pages', 'pricing', 'content.yml')) as any;
    expect(pricingPage.content.content_items[0].heading.text).toBe('Pricing');
  });

  it('navigation includes entries for extra pages', () => {
    const site = readYaml(path.join(targetDir, 'stackwright.yml')) as any;
    const navLabels = site.navigation.map((n: any) => n.label);
    expect(navLabels).toContain('About');
    expect(navLabels).toContain('Contact');
    expect(navLabels).toContain('Pricing');
    expect(site.navigation).toHaveLength(5); // Home + Getting Started + 3 extra
  });

  it('navigation hrefs match page slugs', () => {
    const site = readYaml(path.join(targetDir, 'stackwright.yml')) as any;
    const navHrefs = site.navigation.map((n: any) => n.href);
    expect(navHrefs).toContain('/about');
    expect(navHrefs).toContain('/contact');
    expect(navHrefs).toContain('/pricing');
  });

  it('filters out root and getting-started from --pages', async () => {
    const freshDir = path.join(tmpDir, 'no-dupes');
    await scaffold(
      freshDir,
      baseOpts({ name: 'nd', title: 'No Dupes', pages: '/,getting-started,blog' })
    );

    const site = readYaml(path.join(freshDir, 'stackwright.yml')) as any;
    expect(site.navigation).toHaveLength(3);
    expect(site.navigation[2].label).toBe('Blog');
  });

  it('handles hyphenated slugs in title conversion', async () => {
    const freshDir = path.join(tmpDir, 'hyphen');
    await scaffold(freshDir, baseOpts({ name: 'hyph', title: 'Hyph', pages: 'about-us' }));

    const aboutPage = readYaml(path.join(freshDir, 'pages', 'about-us', 'content.yml')) as any;
    expect(aboutPage.content.content_items[0].heading.text).toBe('About Us');
  });
});

// ---------------------------------------------------------------------------
// Package.json correctness
// ---------------------------------------------------------------------------

describe('scaffold output — package.json', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('has required scripts including prebuild hooks', async () => {
    const targetDir = path.join(tmpDir, 'scripts');
    await scaffold(targetDir, baseOpts({ name: 'scripts-test' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.dev).toBe('next dev');
    expect(scripts.build).toBe('next build');
    expect(scripts.prebuild).toBe('stackwright-prebuild');
    expect(scripts.predev).toBe('stackwright-prebuild');
    expect(scripts.lint).toBe('next lint');
  });

  it('has all required stackwright dependencies', async () => {
    const targetDir = path.join(tmpDir, 'deps');
    await scaffold(targetDir, baseOpts({ name: 'deps-test' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps['@stackwright/core']).toBeDefined();
    expect(deps['@stackwright/nextjs']).toBeDefined();
    expect(deps['@stackwright/icons']).toBeDefined();
    expect(deps['@stackwright/ui-shadcn']).toBeDefined();
    expect(deps['next']).toBeDefined();
    expect(deps['react']).toBeDefined();
    expect(deps['react-dom']).toBeDefined();
  });

  it('has build-scripts in devDependencies', async () => {
    const targetDir = path.join(tmpDir, 'devdeps');
    await scaffold(targetDir, baseOpts({ name: 'devdeps-test' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    const devDeps = pkg.devDependencies as Record<string, string>;
    expect(devDeps['@stackwright/build-scripts']).toBeDefined();
    expect(devDeps['typescript']).toBeDefined();
  });

  it('has engine constraints', async () => {
    const targetDir = path.join(tmpDir, 'engines');
    await scaffold(targetDir, baseOpts({ name: 'engines-test' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    const engines = pkg.engines as Record<string, string>;
    expect(engines.node).toMatch(/>=20/);
    expect(engines.pnpm).toMatch(/>=10/);
  });

  it('is marked private', async () => {
    const targetDir = path.join(tmpDir, 'private');
    await scaffold(targetDir, baseOpts({ name: 'private-test' }));

    const pkg = readJson(path.join(targetDir, 'package.json'));
    expect(pkg.private).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// tsconfig.json correctness
// ---------------------------------------------------------------------------

describe('scaffold output — tsconfig.json', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('has jsx set to react-jsx', async () => {
    const targetDir = path.join(tmpDir, 'tsconfig');
    await scaffold(targetDir, baseOpts({ name: 'tsconfig-test' }));

    const tsconfig = readJson(path.join(targetDir, 'tsconfig.json'));
    const compilerOpts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOpts.jsx).toBe('react-jsx');
  });

  it('has strict mode enabled', async () => {
    const targetDir = path.join(tmpDir, 'strict');
    await scaffold(targetDir, baseOpts({ name: 'strict-test' }));

    const tsconfig = readJson(path.join(targetDir, 'tsconfig.json'));
    const compilerOpts = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOpts.strict).toBe(true);
  });

  it('includes Next.js plugin', async () => {
    const targetDir = path.join(tmpDir, 'next-plugin');
    await scaffold(targetDir, baseOpts({ name: 'plugin-test' }));

    const tsconfig = readJson(path.join(targetDir, 'tsconfig.json'));
    const compilerOpts = tsconfig.compilerOptions as Record<string, any>;
    expect(compilerOpts.plugins).toContainEqual({ name: 'next' });
  });
});

// ---------------------------------------------------------------------------
// Template placeholder substitution
// ---------------------------------------------------------------------------

describe('scaffold output — placeholder substitution', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  it('does not leave raw {{projectName}} placeholders in output files', async () => {
    const targetDir = path.join(tmpDir, 'placeholders');
    await scaffold(targetDir, baseOpts({ name: 'acme-corp', title: 'Acme Corp' }));

    const files = collectTextFiles(targetDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toContain('{{projectName}}');
      expect(content).not.toContain('{{siteTitle}}');
      expect(content).not.toContain('{{year}}');
    }
  });
});
