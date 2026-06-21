/**
 * Tests for stackwright.theme.yml config file split (swp-xyia).
 *
 * Theme-specific keys (themeName, customTheme, fonts, defaultColorMode)
 * are compiled to `_theme.json` by compileTheme(). They are NO LONGER
 * merged into `_site.json` — that was the old behaviour (removed in swp-xyia).
 *
 * Tests verify:
 *   - `_theme.json` is always emitted (even when empty)
 *   - Theme file keys land in `_theme.json`
 *   - Non-theme keys in the theme file are ignored
 *   - Inline keys in `stackwright.yml` pass through to `_site.json` unchanged
 *   - `defaultColorMode` is supported in `stackwright.theme.yml`
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_SITE_CONFIG = `title: "Test Site"\nappBar:\n  titleText: "Test"\nnavigation: []\n`;

const PAGE_CONTENT_YAML = `content:\n  content_items:\n    - type: text_block\n      label: "test"\n      textBlocks:\n        - text: "Hello"\n          textSize: "body1"\n`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpProject(siteYaml = BASE_SITE_CONFIG): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-theme-split-test-'));
  fs.writeFileSync(path.join(root, 'stackwright.yml'), siteYaml);
  const pagesDir = path.join(root, 'pages');
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.writeFileSync(path.join(pagesDir, 'content.yml'), PAGE_CONTENT_YAML);
  return root;
}

function readSiteJson(root: string): Record<string, unknown> {
  const p = path.join(root, 'public', 'stackwright-content', '_site.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readThemeJson(root: string): Record<string, unknown> {
  const p = path.join(root, 'public', 'stackwright-content', '_theme.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function cleanup(root: string): void {
  fs.rmSync(root, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('stackwright.theme.yml config split', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = '';
  });
  afterEach(() => {
    if (tmpRoot) cleanup(tmpRoot);
  });

  it('runs without errors when no stackwright.theme.yml exists (no regression)', async () => {
    tmpRoot = makeTmpProject();
    await expect(runPrebuild({ projectRoot: tmpRoot })).resolves.not.toThrow();
    const site = readSiteJson(tmpRoot);
    expect(site.title).toBe('Test Site');
    expect(site.themeName).toBeUndefined(); // NOT in stackwright.yml
  });

  it('always emits _theme.json even when no theme file exists', async () => {
    tmpRoot = makeTmpProject();
    await runPrebuild({ projectRoot: tmpRoot });
    const themeJsonPath = path.join(tmpRoot, 'public', 'stackwright-content', '_theme.json');
    expect(fs.existsSync(themeJsonPath)).toBe(true);
    // Empty object when no theme info is present
    const theme = readThemeJson(tmpRoot);
    expect(theme).toEqual({});
  });

  it('writes themeName from stackwright.theme.yml to _theme.json (not _site.json)', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yml'), `themeName: "ocean-dark"\n`);
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    expect(theme.themeName).toBe('ocean-dark');

    const site = readSiteJson(tmpRoot);
    expect(site.title).toBe('Test Site'); // base config preserved
    expect(site.themeName).toBeUndefined(); // NOT merged into site.json
  });

  it('writes fonts from stackwright.theme.yml to _theme.json', async () => {
    tmpRoot = makeTmpProject(BASE_SITE_CONFIG + `fonts:\n  strategy: external\n`);
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yml'), `fonts:\n  strategy: bundle\n`);
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    expect((theme.fonts as any)?.strategy).toBe('bundle');

    // stackwright.yml still has its own fonts config in _site.json
    const site = readSiteJson(tmpRoot);
    expect((site.fonts as any)?.strategy).toBe('external');
  });

  it('ignores non-theme keys in stackwright.theme.yml (title, navigation, appBar)', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(
      path.join(tmpRoot, 'stackwright.theme.yml'),
      `themeName: "sand"\ntitle: "Should Be Ignored"\nnavigation:\n  - label: "Injected"\n    href: "/injected"\n`
    );
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    expect(theme.themeName).toBe('sand');
    expect(theme.title).toBeUndefined(); // non-theme key stripped

    const site = readSiteJson(tmpRoot);
    expect(site.title).toBe('Test Site'); // NOT overridden
    expect(site.navigation).toEqual([]); // NOT overridden
  });

  it('stackwright.theme.yaml (.yaml extension) is also discovered', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yaml'), `themeName: "midnight"\n`);
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    expect(theme.themeName).toBe('midnight');
  });

  it('supports defaultColorMode in stackwright.theme.yml', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(
      path.join(tmpRoot, 'stackwright.theme.yml'),
      `themeName: "ocean"\ndefaultColorMode: "dark"\n`
    );
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    expect(theme.themeName).toBe('ocean');
    expect(theme.defaultColorMode).toBe('dark');
  });

  it('extracts inline theme keys from stackwright.yml when no theme file exists', async () => {
    tmpRoot = makeTmpProject(BASE_SITE_CONFIG + `themeName: "sunset"\n`);
    await runPrebuild({ projectRoot: tmpRoot });

    // Inline themeName in stackwright.yml should be in _theme.json too
    const theme = readThemeJson(tmpRoot);
    expect(theme.themeName).toBe('sunset');

    // And still in _site.json (Bead 4 will strip it, but not this PR)
    const site = readSiteJson(tmpRoot);
    expect(site.themeName).toBe('sunset');
  });

  it('carries defaultColorMode through Path 2 (extract from stackwright.yml inline customTheme)', async () => {
    // No stackwright.theme.yml — defaultColorMode is inside inline customTheme in stackwright.yml.
    // Path 2 extracts only the known theme keys (themeName, customTheme, fonts) — NOT defaultColorMode
    // because defaultColorMode lives at the theme-file root, not inside customTheme.
    // This test documents the current Path 2 behavior: defaultColorMode at YAML root IS extracted.
    tmpRoot = makeTmpProject(BASE_SITE_CONFIG + `defaultColorMode: "light"\n`);
    await runPrebuild({ projectRoot: tmpRoot });

    const theme = readThemeJson(tmpRoot);
    // defaultColorMode passes through _theme.json via siteConfig raw pass-through
    // (it lives at the root of stackwright.yml, not inside customTheme)
    // The stackwrightThemeFileSchema includes defaultColorMode at the root level.
    expect(theme.defaultColorMode).toBe('light');
  });

  it('defaultColorMode in stackwright.theme.yml overrides any site config value (Path 1)', async () => {
    tmpRoot = makeTmpProject(BASE_SITE_CONFIG + `defaultColorMode: "light"\n`);
    // Theme file takes priority — it has dark
    fs.writeFileSync(
      path.join(tmpRoot, 'stackwright.theme.yml'),
      `themeName: "custom"\ndefaultColorMode: "dark"\n`
    );
    await runPrebuild({ projectRoot: tmpRoot });

    // Path 1: theme file wins — dark
    const theme = readThemeJson(tmpRoot);
    expect(theme.defaultColorMode).toBe('dark');
  });
});
