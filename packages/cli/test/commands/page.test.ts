import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { addPage, listPages, validatePages } from '../../src/commands/page';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-cli-test-'));
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

// ---------------------------------------------------------------------------
// addPage
// ---------------------------------------------------------------------------

describe('addPage', () => {
  let pagesDir: string;

  beforeEach(() => {
    pagesDir = path.join(makeTmpDir(), 'pages');
    fs.ensureDirSync(pagesDir);
  });

  it('creates a content.yml at the correct path', async () => {
    const result = await addPage(pagesDir, 'about', {});
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.path).toContain(path.join('about', 'content.yml'));
  });

  it('returns the correct slug', async () => {
    const result = await addPage(pagesDir, 'about', {});
    expect(result.slug).toBe('/about');
  });

  it('uses the provided heading in the generated content', async () => {
    await addPage(pagesDir, 'contact', { heading: 'Contact Us' });
    const raw = fs.readFileSync(path.join(pagesDir, 'contact', 'content.yml'), 'utf8');
    expect(raw).toContain('Contact Us');
  });

  it('falls back to slug as heading when none provided', async () => {
    await addPage(pagesDir, 'services', {});
    const raw = fs.readFileSync(path.join(pagesDir, 'services', 'content.yml'), 'utf8');
    expect(raw).toContain('services');
  });

  it('supports nested slugs', async () => {
    const result = await addPage(pagesDir, 'blog/first-post', {});
    expect(fs.existsSync(result.path)).toBe(true);
    expect(result.slug).toBe('/blog/first-post');
  });

  it('strips a leading slash from the slug', async () => {
    const result = await addPage(pagesDir, '/stripped', {});
    expect(result.slug).toBe('/stripped');
    expect(fs.existsSync(path.join(pagesDir, 'stripped', 'content.yml'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// listPages
// ---------------------------------------------------------------------------

describe('listPages', () => {
  let pagesDir: string;

  beforeEach(() => {
    pagesDir = path.join(makeTmpDir(), 'pages');
    fs.ensureDirSync(pagesDir);
  });

  it('returns empty array when pagesDir does not exist', () => {
    const result = listPages(path.join(makeTmpDir(), 'nonexistent'));
    expect(result.pages).toHaveLength(0);
  });

  it('returns empty array for an empty pagesDir', () => {
    const result = listPages(pagesDir);
    expect(result.pages).toHaveLength(0);
  });

  it('finds a page written by addPage', async () => {
    await addPage(pagesDir, 'home', { heading: 'Home' });
    const result = listPages(pagesDir);
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].slug).toBe('/home');
  });

  it('finds multiple pages', async () => {
    await addPage(pagesDir, 'about', { heading: 'About' });
    await addPage(pagesDir, 'contact', { heading: 'Contact' });
    const result = listPages(pagesDir);
    const slugs = result.pages.map((p) => p.slug);
    expect(slugs).toContain('/about');
    expect(slugs).toContain('/contact');
  });

  it('extracts the heading from the first content item', async () => {
    await addPage(pagesDir, 'pricing', { heading: 'Our Pricing' });
    const result = listPages(pagesDir);
    const page = result.pages.find((p) => p.slug === '/pricing');
    expect(page?.heading).toBe('Our Pricing');
  });

  it('sets heading to null for a page without a main heading', () => {
    const customYaml = `content:\n  content_items: []\n`;
    const dir = path.join(pagesDir, 'empty-page');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'content.yml'), customYaml, 'utf8');
    const result = listPages(pagesDir);
    const page = result.pages.find((p) => p.slug === '/empty-page');
    expect(page?.heading).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// validatePages — NOTE: requires @stackwright/types dist to be built
// ---------------------------------------------------------------------------

describe('validatePages', () => {
  let pagesDir: string;

  beforeEach(() => {
    pagesDir = path.join(makeTmpDir(), 'pages');
    fs.ensureDirSync(pagesDir);
  });

  it('returns valid=true for an empty pages directory', () => {
    const result = validatePages(pagesDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid=true for pages created by addPage', async () => {
    await addPage(pagesDir, 'valid-page', { heading: 'Valid Page' });
    const result = validatePages(pagesDir);
    expect(result.valid).toBe(true);
  });

  it('reports a YAML parse error for malformed YAML', () => {
    const dir = path.join(pagesDir, 'broken');
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'content.yml'), '{ bad yaml: : :', 'utf8');
    const result = validatePages(pagesDir);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/YAML parse error/);
  });

  it('filters to a specific slug when provided', async () => {
    await addPage(pagesDir, 'page-a', { heading: 'A' });
    await addPage(pagesDir, 'page-b', { heading: 'B' });
    // Only validate page-a
    const result = validatePages(pagesDir, 'page-a');
    expect(result.valid).toBe(true);
    // No errors specifically for page-b since we didn't validate it
    expect(result.errors.every((e) => e.slug !== '/page-b')).toBe(true);
  });
});
