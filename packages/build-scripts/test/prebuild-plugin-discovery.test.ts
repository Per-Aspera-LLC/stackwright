/**
 * Integration tests for plugin auto-discovery (feat/prebuild-plugin-discovery).
 *
 * All tests use real temp directories and real file system ops — no mocks.
 * See CONTRIBUTING.md "Testing Philosophy" for why.
 *
 * Tier A: Convention discovery (@stackwright-pro/build-scripts-plugins)
 * Tier B: Config discovery (prebuild.plugins in stackwright.yml)
 * CLI:    --plugins override / --no-plugin-discovery
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { runPrebuild } from '../src/prebuild';
import { discoverPlugins, CANONICAL_PRO_BUNDLE } from '../src/compile/discover';

// ---------------------------------------------------------------------------
// Zod path resolution — fake plugins need real Zod schemas.
//
// CJS plugins in temp node_modules can't find zod on their own, so we
// symlink the real zod package into each fake project's node_modules.
// We find zod's path relative to THIS test file's location.
// ---------------------------------------------------------------------------

const _req = createRequire(import.meta.url);
const ZOD_PACKAGE_DIR = path.dirname(_req.resolve('zod/package.json'));

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal valid project root in a temp dir.
 * The stackwright.yml satisfies siteConfigSchema (title + navigation + appBar required).
 */
function makeTempProject(overrides: { siteYaml?: string } = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-discovery-test-'));
  const siteYaml =
    overrides.siteYaml ?? `title: Test Site\nnavigation: []\nappBar:\n  titleText: Test Site\n`;
  fs.writeFileSync(path.join(dir, 'stackwright.yml'), siteYaml);
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });

  // Symlink the real zod package so fake CJS plugins can require('zod')
  const zodDest = path.join(dir, 'node_modules', 'zod');
  fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
  if (!fs.existsSync(zodDest)) {
    fs.symlinkSync(ZOD_PACKAGE_DIR, zodDest, 'dir');
  }

  return dir;
}

/**
 * Write a content.yml at the root page (slug = null) or a named slug.
 */
function writePageYaml(projectRoot: string, yaml: string, slug?: string): void {
  const dir = slug ? path.join(projectRoot, 'pages', slug) : path.join(projectRoot, 'pages');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), yaml);
}

/**
 * Install a fake CommonJS plugin package into node_modules of a project.
 *
 * @param projectRoot - The temp project root.
 * @param packageName - e.g. '@stackwright-pro/build-scripts-plugins'
 * @param indexJs     - Content of the package's index.js (CJS).
 */
function installFakePackage(projectRoot: string, packageName: string, indexJs: string): void {
  // Handle scoped packages (@scope/name → node_modules/@scope/name)
  const pkgDir = path.join(projectRoot, 'node_modules', ...packageName.split('/'));
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, main: './index.js' }, null, 2)
  );
  fs.writeFileSync(path.join(pkgDir, 'index.js'), indexJs);
}

// ---------------------------------------------------------------------------
// Fake CJS plugin module templates
//
// These use real Zod schemas (require('zod') works because we symlinked zod
// into the temp project's node_modules in makeTempProject).
// ---------------------------------------------------------------------------

/** Fake Pro bundle — exports proPlugins with 'fake_pulse' schema (Tier A). */
const FAKE_PRO_BUNDLE_INDEX_JS = `\
'use strict';
const z = require('zod');
const fakeSchema = z.object({ type: z.literal('fake_pulse'), label: z.string() }).passthrough();
const fakePlugin = {
  name: 'fake-pulse-plugin',
  knownContentTypeKeys: ['fake_pulse'],
  contentItemSchemas: [fakeSchema],
};
module.exports = { proPlugins: [fakePlugin] };
`;

/** Fake third-party plugin — exports via `plugins` key with 'third_party_widget'. */
const FAKE_THIRD_PARTY_INDEX_JS = `\
'use strict';
const z = require('zod');
const fakeSchema = z.object({ type: z.literal('third_party_widget'), label: z.string() }).passthrough();
const fakePlugin = {
  name: 'fake-third-party-plugin',
  knownContentTypeKeys: ['third_party_widget'],
  contentItemSchemas: [fakeSchema],
};
module.exports = { plugins: [fakePlugin] };
`;

// ---------------------------------------------------------------------------
// Test content fixtures
// ---------------------------------------------------------------------------

const MINIMAL_PAGE_OSS = `\
meta:
  title: Hello
content:
  content_items:
    - type: text_block
      label: intro
      textBlocks: []
`;

const PAGE_WITH_FAKE_PULSE = `\
meta:
  title: Hello
content:
  content_items:
    - type: fake_pulse
      label: my-widget
`;

const PAGE_WITH_DATA_TABLE = `\
meta:
  title: Hello
content:
  content_items:
    - type: data_table_pulse
      label: my-table
`;

const PAGE_WITH_THIRD_PARTY = `\
meta:
  title: Hello
content:
  content_items:
    - type: third_party_widget
      label: my-widget
`;

// ---------------------------------------------------------------------------
// Test 2.1: Convention-tier discovery succeeds
// ---------------------------------------------------------------------------

describe('Tier A — convention discovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.1: discovers @stackwright-pro/build-scripts-plugins and validates fake_pulse without warnings', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);
    writePageYaml(projectRoot, PAGE_WITH_FAKE_PULSE);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // unknownContentTypes: 'warn' so validation errors become warnings not throws
    await runPrebuild({ projectRoot, unknownContentTypes: 'warn' });

    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    // Plugin was discovered and schemas registered — no "Unknown content type" or
    // "Invalid content" warnings about fake_pulse expected
    const hasContentWarning = warnMessages.some(
      (m) =>
        (m.includes('Unknown content type') || m.includes('Invalid content')) &&
        m.includes('fake_pulse')
    );
    expect(hasContentWarning).toBe(false);

    // The output JSON must be written
    const rootJson = path.join(projectRoot, 'public', 'stackwright-content', '_root.json');
    expect(fs.existsSync(rootJson)).toBe(true);
  });

  it('2.1b: CANONICAL_PRO_BUNDLE const matches the expected package name', () => {
    expect(CANONICAL_PRO_BUNDLE).toBe('@stackwright-pro/build-scripts-plugins');
  });

  it('2.1c: discovery log line is emitted when Pro bundle is found', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runPrebuild({ projectRoot });

    const logMessages = logSpy.mock.calls.map((args) => String(args[0]));
    const hasConventionLog = logMessages.some(
      (m) => m.includes(CANONICAL_PRO_BUNDLE) && m.includes('convention')
    );
    expect(hasConventionLog).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2.2: OSS-only (no Pro bundle) — clean fallback
// ---------------------------------------------------------------------------

describe('Tier A — OSS-only fallback', () => {
  it('2.2: no Pro bundle in node_modules → prebuild completes cleanly with OSS content', async () => {
    const projectRoot = makeTempProject();
    // No Pro package installed. Use a known-good OSS content type.
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(runPrebuild({ projectRoot })).resolves.not.toThrow();

    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    // No plugin-resolution warnings expected
    const hasPluginWarning = warnMessages.some(
      (m) => m.includes('build-scripts-plugins') || m.includes('no recognized export')
    );
    expect(hasPluginWarning).toBe(false);
    vi.restoreAllMocks();
  });
});

// ---------------------------------------------------------------------------
// Test 2.3: OSS-only with unknown pro type — warning IS preserved (regression guard)
// ---------------------------------------------------------------------------

describe('Tier A — unknown type regression guard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.3: no Pro bundle + data_table_pulse → unknown-type warning still emitted (OSS UX unchanged)', async () => {
    const projectRoot = makeTempProject();
    // No Pro package. Use the actual Pro type name to prove it still warns.
    writePageYaml(projectRoot, PAGE_WITH_DATA_TABLE);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await runPrebuild({ projectRoot, unknownContentTypes: 'warn' });

    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    // Some kind of content error should be present for the unknown pro type
    const hasContentWarning = warnMessages.some(
      (m) => m.includes('data_table_pulse') || m.includes('Invalid content')
    );
    expect(hasContentWarning).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2.4: Explicit plugins: [] overrides discovery
// ---------------------------------------------------------------------------

describe('explicit plugins array overrides discovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.4: plugins: [] skips discovery even when Pro bundle is present in node_modules', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);
    writePageYaml(projectRoot, PAGE_WITH_FAKE_PULSE);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Explicit empty array → discovery must be skipped
    await runPrebuild({ projectRoot, plugins: [], unknownContentTypes: 'warn' });

    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    // Discovery was bypassed, so fake_pulse should be unrecognized → some content warning
    const hasContentWarning = warnMessages.some(
      (m) => m.includes('fake_pulse') || m.includes('Invalid content')
    );
    expect(hasContentWarning).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2.5: Config-tier discovery via stackwright.yml prebuild.plugins
// ---------------------------------------------------------------------------

describe('Tier B — config discovery', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.5: prebuild.plugins in stackwright.yml loads third-party plugin and validates type', async () => {
    const projectRoot = makeTempProject({
      siteYaml: [
        'title: Test Site',
        'navigation: []',
        'appBar:',
        '  titleText: Test Site',
        'prebuild:',
        '  plugins:',
        '    - fake-third-party-plugin',
      ].join('\n'),
    });
    installFakePackage(projectRoot, 'fake-third-party-plugin', FAKE_THIRD_PARTY_INDEX_JS);
    writePageYaml(projectRoot, PAGE_WITH_THIRD_PARTY);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await runPrebuild({ projectRoot, unknownContentTypes: 'warn' });

    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    // Plugin loaded via config tier — no content warnings for third_party_widget
    const hasContentWarning = warnMessages.some(
      (m) =>
        (m.includes('Unknown content type') || m.includes('Invalid content')) &&
        m.includes('third_party_widget')
    );
    expect(hasContentWarning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Test 2.6: Config-tier typo → hard error
// ---------------------------------------------------------------------------

describe('Tier B — hard error on typo', () => {
  it('2.6: nonexistent plugin in prebuild.plugins throws with package name', async () => {
    const projectRoot = makeTempProject({
      siteYaml: [
        'title: Test Site',
        'navigation: []',
        'appBar:',
        '  titleText: Test Site',
        'prebuild:',
        '  plugins:',
        '    - nonexistent-plugin-xyz',
      ].join('\n'),
    });
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS);

    await expect(runPrebuild({ projectRoot })).rejects.toThrow('nonexistent-plugin-xyz');
  });
});

// ---------------------------------------------------------------------------
// Test 2.7: pluginOverride skips Tier A even when Pro bundle is present
// ---------------------------------------------------------------------------

describe('pluginOverride option', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('2.7: pluginOverride loads named packages and skips convention tier', async () => {
    const projectRoot = makeTempProject();
    // Install BOTH the pro bundle AND the third-party plugin.
    // Override should load only the third-party one.
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);
    installFakePackage(projectRoot, 'fake-third-party-plugin', FAKE_THIRD_PARTY_INDEX_JS);

    // Use a type only the third-party plugin knows (NOT fake_pulse from pro bundle)
    writePageYaml(projectRoot, PAGE_WITH_THIRD_PARTY);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPrebuild({
      projectRoot,
      pluginOverride: ['fake-third-party-plugin'],
      unknownContentTypes: 'warn',
    });

    // third_party_widget should be known (no content warning)
    const warnMessages = warnSpy.mock.calls.map((args) => String(args[0]));
    const hasContentWarning = warnMessages.some(
      (m) =>
        (m.includes('Unknown content type') || m.includes('Invalid content')) &&
        m.includes('third_party_widget')
    );
    expect(hasContentWarning).toBe(false);

    // Convention tier log line for CANONICAL_PRO_BUNDLE should NOT appear
    const logMessages = logSpy.mock.calls.map((args) => String(args[0]));
    const hasConventionLog = logMessages.some(
      (m) => m.includes(CANONICAL_PRO_BUNDLE) && m.includes('convention')
    );
    expect(hasConventionLog).toBe(false);

    // Override log line SHOULD appear
    const hasOverrideLog = logMessages.some(
      (m) => m.includes('fake-third-party-plugin') && m.includes('override')
    );
    expect(hasOverrideLog).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// discoverPlugins low-level API tests
// ---------------------------------------------------------------------------

describe('discoverPlugins low-level API', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns [] immediately when enabled is false', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);

    const result = await discoverPlugins(projectRoot, { enabled: false });
    expect(result).toEqual([]);
  });

  it('de-duplicates plugins with the same name', async () => {
    // Install the pro bundle as the convention tier, AND add it again via config tier
    // under a different package name but same plugin.name — dedup should keep only one.
    const dualPlugin = `\
'use strict';
module.exports = {
  proPlugins: [{ name: 'shared-plugin', knownContentTypeKeys: [] }],
  plugins: [{ name: 'shared-plugin', knownContentTypeKeys: [] }],
};
`;
    const projectRoot = makeTempProject({
      siteYaml: [
        'title: Test Site',
        'navigation: []',
        'appBar:',
        '  titleText: Test Site',
        'prebuild:',
        '  plugins:',
        '    - fake-third-party-plugin',
      ].join('\n'),
    });
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, dualPlugin);
    installFakePackage(projectRoot, 'fake-third-party-plugin', dualPlugin);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const result = await discoverPlugins(projectRoot);

    // Should only have ONE instance of 'shared-plugin'
    const names = result.map((p) => p.name);
    expect(names.filter((n) => n === 'shared-plugin').length).toBe(1);

    // Debug log should have fired about the duplicate
    const logMessages = logSpy.mock.calls.map((args) => String(args[0]));
    expect(logMessages.some((m) => m.includes('Skipping duplicate plugin'))).toBe(true);
  });

  it('--no-plugin-discovery: pluginDiscovery false returns [] even with Pro bundle present', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_INDEX_JS);

    const result = await discoverPlugins(projectRoot, { enabled: false });
    expect(result).toHaveLength(0);
  });
});
