/**
 * Tests for stackwright.theme.yml config file split (swp-z21).
 *
 * stackwright.theme.yml is an optional sidecar that holds only theme-specific
 * keys (themeName, customTheme, fonts). prebuild merges these on top of
 * stackwright.yml before validation so Theme Otter and Page Otter can own
 * separate files without clobbering each other.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_SITE_CONFIG = `title: "Test Site"
appBar:
  titleText: "Test"
navigation: []
`;

const PAGE_CONTENT_YAML = `content:
  content_items:
    - type: text_block
      label: "test"
      textBlocks:
        - text: "Hello"
          textSize: "body1"
`;

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
    expect(site.themeName).toBeUndefined();
  });

  it('merges themeName from stackwright.theme.yml into _site.json', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yml'), `themeName: "ocean-dark"\n`);
    await runPrebuild({ projectRoot: tmpRoot });
    const site = readSiteJson(tmpRoot);
    expect(site.themeName).toBe('ocean-dark');
    expect(site.title).toBe('Test Site'); // base config preserved
  });

  it('merges fonts from stackwright.theme.yml, overriding base config fonts', async () => {
    tmpRoot = makeTmpProject(BASE_SITE_CONFIG + `fonts:\n  strategy: external\n`);
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yml'), `fonts:\n  strategy: bundle\n`);
    await runPrebuild({ projectRoot: tmpRoot });
    const site = readSiteJson(tmpRoot);
    expect((site.fonts as any)?.strategy).toBe('bundle');
  });

  it('ignores non-theme keys in stackwright.theme.yml (title, navigation, appBar)', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(
      path.join(tmpRoot, 'stackwright.theme.yml'),
      `themeName: "sand"\ntitle: "Should Be Ignored"\nnavigation:\n  - label: "Injected"\n    href: "/injected"\n`
    );
    await runPrebuild({ projectRoot: tmpRoot });
    const site = readSiteJson(tmpRoot);
    expect(site.themeName).toBe('sand');
    expect(site.title).toBe('Test Site'); // NOT overridden
    expect(site.navigation).toEqual([]); // NOT overridden
  });

  it('stackwright.theme.yaml (.yaml extension) is also discovered', async () => {
    tmpRoot = makeTmpProject();
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.theme.yaml'), `themeName: "midnight"\n`);
    await runPrebuild({ projectRoot: tmpRoot });
    const site = readSiteJson(tmpRoot);
    expect(site.themeName).toBe('midnight');
  });
});
