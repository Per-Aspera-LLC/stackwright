/**
 * Integration tests for `prebuild.unknownContentTypes` yml config wiring (#529 leftover).
 *
 * Verifies that the `prebuild.unknownContentTypes` field in `stackwright.yml`
 * controls validation behaviour, and that an explicit `runPrebuild` option
 * always wins over the yml value (precedence: explicit > yml > default 'error').
 *
 * All tests use real temp directories — no mocks on fs/yaml parsing.
 * See CONTRIBUTING.md "Testing Philosophy" for why.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeTempProject(siteYaml: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-uct-config-test-'));
  fs.writeFileSync(path.join(dir, 'stackwright.yml'), siteYaml);
  fs.mkdirSync(path.join(dir, 'pages'), { recursive: true });
  return dir;
}

function writePageYaml(projectRoot: string, yaml: string, slug?: string): void {
  const dir = slug ? path.join(projectRoot, 'pages', slug) : path.join(projectRoot, 'pages');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'content.yml'), yaml);
}

// ---------------------------------------------------------------------------
// Site YAML fixtures
// ---------------------------------------------------------------------------

const BASE_SITE_YAML = `\
title: Test Site
navigation: []
appBar:
  titleText: Test Site
`;

const SITE_YAML_UCT_WARN = `\
title: Test Site
navigation: []
appBar:
  titleText: Test Site
prebuild:
  unknownContentTypes: warn
`;

const SITE_YAML_UCT_IGNORE = `\
title: Test Site
navigation: []
appBar:
  titleText: Test Site
prebuild:
  unknownContentTypes: ignore
`;

// ---------------------------------------------------------------------------
// Page content fixtures
// ---------------------------------------------------------------------------

const PAGE_WITH_BOGUS_TYPE = `\
meta:
  title: Hello
content:
  content_items:
    - type: totally_bogus_type_xyz
      label: oops
`;

const MINIMAL_PAGE_OSS = `\
meta:
  title: Hello
content:
  content_items:
    - type: text_block
      label: intro
      textBlocks: []
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('prebuild.unknownContentTypes yml config wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test E — yml says 'warn', no explicit option → does NOT throw, emits [WARN]
  // -------------------------------------------------------------------------

  it('Test E: yml unknownContentTypes: warn → prebuild does NOT throw, emits [WARN]', async () => {
    const projectRoot = makeTempProject(SITE_YAML_UCT_WARN);
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE);

    const warnLines: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...args) => warnLines.push(String(args[0])));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // No explicit unknownContentTypes passed — should read from yml
    await expect(runPrebuild({ projectRoot, plugins: [] })).resolves.not.toThrow();

    const validationWarns = warnLines.filter(
      (m) => m.includes('[WARN]') && m.includes('Invalid content')
    );
    expect(validationWarns.length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // Test F — yml says 'warn' but explicit 'error' → throws (explicit wins)
  // -------------------------------------------------------------------------

  it('Test F: yml says warn but runPrebuild({ unknownContentTypes: error }) → throws', async () => {
    const projectRoot = makeTempProject(SITE_YAML_UCT_WARN);
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE);

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // Explicit 'error' must win over yml 'warn'
    await expect(
      runPrebuild({ projectRoot, plugins: [], unknownContentTypes: 'error' })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Test G — yml says 'ignore' → no warn, no throw, page compiles
  // -------------------------------------------------------------------------

  it('Test G: yml unknownContentTypes: ignore → bogus type silently ignored, output written', async () => {
    const projectRoot = makeTempProject(SITE_YAML_UCT_IGNORE);
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE);

    const warnLines: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation((...args) => warnLines.push(String(args[0])));
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(runPrebuild({ projectRoot, plugins: [] })).resolves.not.toThrow();

    const validationWarns = warnLines.filter(
      (m) => m.includes('[WARN]') && m.includes('Invalid content')
    );
    expect(validationWarns).toHaveLength(0);

    // Page JSON must still be written
    const rootJson = path.join(projectRoot, 'public', 'stackwright-content', '_root.json');
    expect(fs.existsSync(rootJson)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Test H — no prebuild block in yml → falls back to 'error' default
  // -------------------------------------------------------------------------

  it('Test H: yml has no prebuild block → defaults to error, throws on bogus type', async () => {
    const projectRoot = makeTempProject(BASE_SITE_YAML);
    writePageYaml(projectRoot, PAGE_WITH_BOGUS_TYPE);

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    // No explicit option, no yml config → should throw (default is 'error')
    await expect(runPrebuild({ projectRoot, plugins: [] })).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Test I — sanity: yml warn + valid page → no warning, no throw
  // -------------------------------------------------------------------------

  it('Test I: yml warn + valid OSS page → clean compile', async () => {
    const projectRoot = makeTempProject(SITE_YAML_UCT_WARN);
    writePageYaml(projectRoot, MINIMAL_PAGE_OSS);

    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(runPrebuild({ projectRoot, plugins: [] })).resolves.not.toThrow();
  });
});
