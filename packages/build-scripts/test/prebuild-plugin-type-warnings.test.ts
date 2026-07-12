/**
 * Integration tests for plugin-declared content type warning dedup (swp-3r93).
 *
 * Verifies that the per-page [WARN] spam is replaced by a single [INFO]
 * post-loop summary, while genuine validation errors still fire per-page.
 *
 * All tests use real temp directories — no mocks on fs/module resolution.
 * See CONTRIBUTING.md "Testing Philosophy" for why.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import { runPrebuild } from '../src/prebuild';
import { CANONICAL_PRO_BUNDLE } from '../src/compile/discover';

// ---------------------------------------------------------------------------
// Zod symlink — fake CJS plugins need real zod in their resolution chain
// ---------------------------------------------------------------------------

const _req = createRequire(import.meta.url);
const ZOD_PACKAGE_DIR = path.dirname(_req.resolve('zod/package.json'));

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeTempProject(overrides: { siteYaml?: string } = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-warn-dedup-test-'));
  const siteYaml =
    overrides.siteYaml ?? `title: Test Site\nnavigation: []\nappBar:\n  titleText: Test Site\n`;
  fs.writeFileSync(path.join(dir, 'stackwright.yml'), siteYaml);
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });

  // Symlink real zod so fake CJS plugins can require('zod')
  const zodDest = path.join(dir, 'node_modules', 'zod');
  fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true });
  if (!fs.existsSync(zodDest)) {
    fs.symlinkSync(ZOD_PACKAGE_DIR, zodDest, 'dir');
  }

  return dir;
}

function writePageYaml(projectRoot: string, yaml: string, slug?: string): void {
  const dir = slug ? path.join(projectRoot, 'pages', slug) : path.join(projectRoot, 'pages');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), yaml);
}

function installFakePackage(projectRoot: string, packageName: string, indexJs: string): void {
  const pkgDir = path.join(projectRoot, 'node_modules', ...packageName.split('/'));
  fs.mkdirSync(pkgDir, { recursive: true });
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, main: './index.js' }, null, 2)
  );
  fs.writeFileSync(path.join(pkgDir, 'index.js'), indexJs);
}

// ---------------------------------------------------------------------------
// Fake plugin templates
// ---------------------------------------------------------------------------

/**
 * A fake Pro bundle exposing ONE plugin type: `fake_pulse`.
 */
const FAKE_PRO_BUNDLE_SINGLE = `\
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

/**
 * A fake Pro bundle exposing TWO plugin types: `fake_pulse_a` and `fake_pulse_b`.
 */
const FAKE_PRO_BUNDLE_DUAL = `\
'use strict';
const z = require('zod');
const schemaA = z.object({ type: z.literal('fake_pulse_a'), label: z.string() }).passthrough();
const schemaB = z.object({ type: z.literal('fake_pulse_b'), label: z.string() }).passthrough();
const fakePlugin = {
  name: 'fake-multi-plugin',
  knownContentTypeKeys: ['fake_pulse_a', 'fake_pulse_b'],
  contentItemSchemas: [schemaA, schemaB],
};
module.exports = { proPlugins: [fakePlugin] };
`;

// ---------------------------------------------------------------------------
// Page content fixtures
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
      label: widget-a
`;

const PAGE_WITH_PULSE_A = `\
meta:
  title: Hello
content:
  content_items:
    - type: fake_pulse_a
      label: widget-a
`;

const PAGE_WITH_PULSE_B = `\
meta:
  title: Hello
content:
  content_items:
    - type: fake_pulse_b
      label: widget-b
`;

const PAGE_WITH_PULSE_A_AND_B = `\
meta:
  title: Hello
content:
  content_items:
    - type: fake_pulse_a
      label: widget-a
    - type: fake_pulse_b
      label: widget-b
`;

const PAGE_WITH_BOGUS_TYPE = `\
meta:
  title: Hello
content:
  content_items:
    - type: truly_bogus_widget
      label: oops
`;

// ---------------------------------------------------------------------------
// Test A — single [INFO] summary across 3 pages using the same type
// ---------------------------------------------------------------------------

describe('swp-3r93: dedup plugin-type warnings', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Test A: 3 pages using fake_pulse → exactly ONE [INFO] summary, zero old-format [WARN] lines', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_SINGLE);
    writePageYaml(projectRoot, PAGE_WITH_FAKE_PULSE);
    writePageYaml(projectRoot, PAGE_WITH_FAKE_PULSE, 'page-two');
    writePageYaml(projectRoot, PAGE_WITH_FAKE_PULSE, 'page-three');

    const logLines: string[] = [];
    const warnLines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => logLines.push(String(args[0])));
    vi.spyOn(console, 'warn').mockImplementation((...args) => warnLines.push(String(args[0])));

    await runPrebuild({ projectRoot });

    // Old per-page format must be completely gone
    const oldFormatWarn = warnLines.filter((m) => m.includes('plugin-declared type(s)'));
    expect(oldFormatWarn).toHaveLength(0);

    // Exactly ONE new [INFO] summary line
    const summaryLines = logLines.filter((m) => m.includes('[INFO] Plugin-declared content types'));
    expect(summaryLines).toHaveLength(1);

    // Summary reports 3 pages
    expect(summaryLines[0]).toContain('3 page(s)');

    // fake_pulse appears in the summary
    expect(summaryLines[0]).toContain('fake_pulse');
  });

  // -------------------------------------------------------------------------
  // Test B — zero pages use plugin types → NO summary
  // -------------------------------------------------------------------------

  it('Test B: no pages use plugin types → no [INFO] Plugin-declared summary at all', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_SINGLE);
    // Pages only use core OSS types
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS);
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS, 'about');

    const logLines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => logLines.push(String(args[0])));

    await runPrebuild({ projectRoot });

    const summaryLines = logLines.filter((m) => m.includes('[INFO] Plugin-declared content types'));
    expect(summaryLines).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Test C — regression guard: genuine validation errors still fire per-page
  // -------------------------------------------------------------------------

  it('Test C (regression): truly_bogus_widget with unknownContentTypes warn → per-page [WARN] still fires', async () => {
    const projectRoot = makeTempProject();
    // No plugin installed, so truly_bogus_widget is entirely unknown
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE, 'bad-page-one');
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE, 'bad-page-two');

    const warnLines: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...args) => warnLines.push(String(args[0])));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPrebuild({ projectRoot, unknownContentTypes: 'warn' });

    // Both bad pages must emit a [WARN] (per-page validation errors are NOT deduped)
    const validationWarns = warnLines.filter(
      (m) => m.includes('[WARN]') && m.includes('Invalid content')
    );
    expect(validationWarns).toHaveLength(2);
  });

  it('Test C2: one page with truly_bogus_widget → exactly one [WARN] Invalid content', async () => {
    const projectRoot = makeTempProject();
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE);

    const warnLines: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...args) => warnLines.push(String(args[0])));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPrebuild({ projectRoot, unknownContentTypes: 'warn' });

    const validationWarns = warnLines.filter(
      (m) => m.includes('[WARN]') && m.includes('Invalid content')
    );
    expect(validationWarns).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Test D — multi-page, multi-type: correct page count and type list
  // -------------------------------------------------------------------------

  it('Test D: 2 pages use fake_pulse_a, 3 use fake_pulse_b, 1 uses both → summary has 5 unique pages + both types', async () => {
    const projectRoot = makeTempProject();
    installFakePackage(projectRoot, CANONICAL_PRO_BUNDLE, FAKE_PRO_BUNDLE_DUAL);

    // page-a1 and page-a2 → fake_pulse_a only
    writePageYaml(projectRoot, PAGE_WITH_PULSE_A, 'page-a1');
    writePageYaml(projectRoot, PAGE_WITH_PULSE_A, 'page-a2');
    // page-b1, page-b2 → fake_pulse_b only
    writePageYaml(projectRoot, PAGE_WITH_PULSE_B, 'page-b1');
    writePageYaml(projectRoot, PAGE_WITH_PULSE_B, 'page-b2');
    // page-both → uses both types (counted as 1 unique page)
    writePageYaml(projectRoot, PAGE_WITH_PULSE_A_AND_B, 'page-both');
    // page-oss → no plugin types (should not appear in count)
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS, 'page-oss');

    const logLines: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...args) => logLines.push(String(args[0])));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await runPrebuild({ projectRoot });

    const summaryLines = logLines.filter((m) => m.includes('[INFO] Plugin-declared content types'));
    expect(summaryLines).toHaveLength(1);

    const summary = summaryLines[0];
    // 5 unique pages: a1, a2, b1, b2, both
    expect(summary).toContain('5 page(s)');
    // Both types present
    expect(summary).toContain('fake_pulse_a');
    expect(summary).toContain('fake_pulse_b');
    // Declaring plugin named correctly
    expect(summary).toContain('fake-multi-plugin');
  });
});
