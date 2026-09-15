/**
 * Tests for the site-config color-ref build guard (stackwright-819 / swp-rlih).
 *
 * appBar/footer/sidebar textColor/backgroundColor must reference a color the
 * runtime can actually resolve. An unrecognized token used to be silently
 * passed through to the browser as invalid CSS — this guard makes it
 * BUILD-FATAL instead, with the offending path, the bad value, and the
 * allowed vocabulary in the error message.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { validateSiteColorRefs, extractThemeCssTokenNames } from '../src/compile/validateColorRefs';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Unit tests — validateSiteColorRefs / extractThemeCssTokenNames
// ---------------------------------------------------------------------------

describe('extractThemeCssTokenNames', () => {
  it('extracts token names, stripping the --sw-color- prefix', () => {
    const css = `:root {\n  --sw-color-primary: #1a365d;\n  --sw-color-primary-foreground: #ffffff;\n}\n`;
    expect(extractThemeCssTokenNames(css)).toEqual(
      expect.arrayContaining(['primary', 'primary-foreground'])
    );
  });

  it('returns an empty array for CSS with no --sw-color- vars', () => {
    expect(extractThemeCssTokenNames(':root { --unrelated: 1px; }')).toEqual([]);
  });

  it('de-duplicates repeated declarations', () => {
    const css = '--sw-color-accent: red; --sw-color-accent: blue;';
    expect(extractThemeCssTokenNames(css)).toEqual(['accent']);
  });
});

describe('validateSiteColorRefs', () => {
  let tmpRoot: string;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-color-guard-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('allows a hex color', () => {
    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: '#1a365d' } }, tmpRoot)
    ).not.toThrow();
  });

  it('allows a known ThemeColors key', () => {
    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: 'primary' } }, tmpRoot)
    ).not.toThrow();
  });

  it('allows a known kebab-case alias, including a foreground slot', () => {
    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: 'primary-foreground' } }, tmpRoot)
    ).not.toThrow();
    expect(() =>
      validateSiteColorRefs({ footer: { textColor: 'bg-foreground' } }, tmpRoot)
    ).not.toThrow();
  });

  it('BUILD-FATAL: throws with the offending path, value, and allowed list for an unknown token', () => {
    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: 'totally-made-up' } }, tmpRoot)
    ).toThrowError(/BUILD-FATAL: siteConfig\.appBar\.textColor.*"totally-made-up"/s);
  });

  it('error message includes the allowed vocabulary', () => {
    try {
      validateSiteColorRefs({ footer: { backgroundColor: 'nonsense' } }, tmpRoot);
      throw new Error('expected validateSiteColorRefs to throw');
    } catch (err) {
      expect((err as Error).message).toContain('siteConfig.footer.backgroundColor');
      expect((err as Error).message).toContain('nonsense');
      expect((err as Error).message).toContain('primary');
      expect((err as Error).message).toContain('primary-foreground');
    }
  });

  it('checks sidebar in addition to appBar/footer', () => {
    expect(() =>
      validateSiteColorRefs({ sidebar: { backgroundColor: 'not-a-token' } }, tmpRoot)
    ).toThrow(/siteConfig\.sidebar\.backgroundColor/);
  });

  it('is a no-op when no color fields are present', () => {
    expect(() => validateSiteColorRefs({ appBar: { titleText: 'Hi' } }, tmpRoot)).not.toThrow();
  });

  it('accepts a token declared only in the project-s compiled _theme-tokens.css', () => {
    const themeContentDir = path.join(tmpRoot, 'public', 'stackwright-content');
    fs.mkdirSync(themeContentDir, { recursive: true });
    fs.writeFileSync(
      path.join(themeContentDir, '_theme-tokens.css'),
      ':root { --sw-color-brand-emphasis: #ff00ff; }\n'
    );

    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: 'brand-emphasis' } }, tmpRoot)
    ).not.toThrow();
  });

  it('still rejects unknown tokens when _theme-tokens.css exists but does not declare them', () => {
    const themeContentDir = path.join(tmpRoot, 'public', 'stackwright-content');
    fs.mkdirSync(themeContentDir, { recursive: true });
    fs.writeFileSync(
      path.join(themeContentDir, '_theme-tokens.css'),
      ':root { --sw-color-brand-emphasis: #ff00ff; }\n'
    );

    expect(() =>
      validateSiteColorRefs({ appBar: { textColor: 'not-declared-anywhere' } }, tmpRoot)
    ).toThrow(/BUILD-FATAL/);
  });
});

// ---------------------------------------------------------------------------
// Integration — runPrebuild (covers the real compileSite wiring)
// ---------------------------------------------------------------------------

describe('validateSiteColorRefs — wired into compileSite via runPrebuild', () => {
  let tmpRoot: string;

  function makeProject(siteYaml: string): void {
    fs.writeFileSync(path.join(tmpRoot, 'stackwright.yml'), siteYaml);
    const pagesDir = path.join(tmpRoot, 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });
    fs.writeFileSync(
      path.join(pagesDir, 'content.yml'),
      'content:\n  content_items:\n    - type: text_block\n      label: "test"\n      textBlocks:\n        - text: "Hello"\n          textSize: "body1"\n'
    );
  }

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-color-guard-prebuild-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('fails the whole prebuild BUILD-FATAL on an unresolvable appBar.textColor', async () => {
    makeProject(
      'title: "Test Site"\nappBar:\n  titleText: "Test"\n  textColor: "primary-foreground-typo"\nnavigation: []\n'
    );

    await expect(runPrebuild({ projectRoot: tmpRoot })).rejects.toThrow(
      /BUILD-FATAL: siteConfig\.appBar\.textColor/
    );
  });

  it('succeeds when appBar.textColor is the R10-shaped "primary-foreground" token', async () => {
    makeProject(
      'title: "Test Site"\nappBar:\n  titleText: "Test"\n  textColor: "primary-foreground"\nfooter:\n  textColor: "primary-foreground"\nnavigation: []\n'
    );

    await expect(runPrebuild({ projectRoot: tmpRoot })).resolves.not.toThrow();
    const siteJson = JSON.parse(
      fs.readFileSync(path.join(tmpRoot, 'public', 'stackwright-content', '_site.json'), 'utf8')
    );
    expect(siteJson.appBar.textColor).toBe('primary-foreground');
  });
});
