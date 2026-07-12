import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { runPrebuild } from '../src/prebuild';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Mirrors the lazy-loader pattern in image-optimizer.ts.
 * sharp uses `export = sharp` (CJS), so dynamic ESM import gives { default: fn }.
 */
async function getSharp() {
  const mod = await import('sharp');

  return ((mod as any).default ?? mod) as typeof import('sharp');
}

async function createTestImage(filePath: string, width = 200, height = 100): Promise<void> {
  const sharp = await getSharp();
  await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 0, b: 0 } },
  })
    .png()
    .toFile(filePath);
}

/**
 * Create a minimal valid Stackwright project in a temp dir with
 * image optimization enabled by default.
 */
function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-prebuild-img-test-'));
  fs.writeFileSync(
    path.join(root, 'stackwright.yml'),
    `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
imageOptimization:
  enabled: true
  formats: [webp]
  quality: 80
  maxWidth: 1920
  blur: true
  blurSize: 10
`
  );
  fs.mkdirSync(path.join(root, 'pages'), { recursive: true });
  return root;
}

/**
 * A minimal valid page YAML that references a co-located image.
 * Uses `type: media` — the standalone content item for images.
 * (`type: image` is only valid as an embedded mediaItem, e.g. inside appBar.logo.)
 */
function makeImagePageYaml(src = './hero.png'): string {
  return `
content:
  content_items:
    - type: media
      label: Hero
      src: "${src}"
`;
}

// ---------------------------------------------------------------------------
// Image optimization pipeline — integration tests
// ---------------------------------------------------------------------------

describe('runPrebuild — image optimization pipeline', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  // ── Manifest generation ──────────────────────────────────────────────────

  it('produces _image-manifest.json when optimization is enabled', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    await createTestImage(path.join(pageDir, 'hero.png'));
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    await runPrebuild(root);

    const manifestPath = path.join(root, 'public', 'stackwright-content', '_image-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    expect(Object.keys(manifest).length).toBeGreaterThan(0);
  });

  // ── WebP variant generation ──────────────────────────────────────────────

  it('generates WebP variants alongside originals in public/images/', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    await createTestImage(path.join(pageDir, 'hero.png'));
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    await runPrebuild(root);

    // Original must be present
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.png'))).toBe(true);
    // WebP variant must be generated alongside it
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.webp'))).toBe(true);
  });

  // ── blurDataURL injection ────────────────────────────────────────────────

  it('enriches page JSON with blurDataURL for co-located images', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    await createTestImage(path.join(pageDir, 'hero.png'));
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    await runPrebuild(root);

    const pageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'public', 'stackwright-content', 'about.json'), 'utf8')
    );

    // enrichContentJsonsWithBlur injects blurDataURL as a sibling of `src`
    // on any object whose `src` matches a manifest entry.
    const imageItem = pageJson.content.content_items.find(
      (item: Record<string, unknown>) => item.type === 'media'
    );
    expect(imageItem).toBeDefined();
    expect(imageItem.blurDataURL).toMatch(/^data:image\/png;base64,/);
  });

  // ── Disabled via YAML config ─────────────────────────────────────────────

  it('skips optimization when imageOptimization.enabled is false in YAML', async () => {
    // Overwrite the site config with optimization explicitly disabled
    fs.writeFileSync(
      path.join(root, 'stackwright.yml'),
      `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
imageOptimization:
  enabled: false
`
    );

    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    await createTestImage(path.join(pageDir, 'hero.png'));
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    await runPrebuild(root);

    // Original should still be copied by the normal pipeline
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.png'))).toBe(true);
    // No WebP variant — optimization was off
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.webp'))).toBe(false);
    // Manifest block is skipped entirely when disabled
    expect(
      fs.existsSync(path.join(root, 'public', 'stackwright-content', '_image-manifest.json'))
    ).toBe(false);
  });

  // ── Disabled via PrebuildOptions ─────────────────────────────────────────

  it('skips optimization when PrebuildOptions.imageOptimization is false', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    await createTestImage(path.join(pageDir, 'hero.png'));
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    // CLI flag overrides YAML config (YAML says enabled:true, flag says false)
    await runPrebuild({ projectRoot: root, imageOptimization: false });

    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.png'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'hero.webp'))).toBe(false);
  });

  // ── SVG passthrough ──────────────────────────────────────────────────────

  it('copies SVG files without generating variants', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(
      path.join(pageDir, 'logo.svg'),
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
        '<rect fill="red" width="100" height="100"/>' +
        '</svg>'
    );
    fs.writeFileSync(
      path.join(pageDir, 'content.yml'),
      `
content:
  content_items:
    - type: media
      label: Logo
      src: ./logo.svg
`
    );

    await runPrebuild(root);

    // Original SVG must be present
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'logo.svg'))).toBe(true);
    // SVGs are not optimizable — no WebP variant should appear
    expect(fs.existsSync(path.join(root, 'public', 'images', 'about', 'logo.webp'))).toBe(false);
  });

  // ── Config image optimization ────────────────────────────────────────────

  it('optimizes config images referenced from stackwright.yml', async () => {
    // Place the logo in the project root so processSiteConfig can find it
    await createTestImage(path.join(root, 'logo.png'));
    fs.writeFileSync(
      path.join(root, 'stackwright.yml'),
      `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
  logo:
    type: image
    src: ./logo.png
imageOptimization:
  enabled: true
  formats: [webp]
  blur: true
  blurSize: 10
`
    );

    // At least one page is required; root page lives at pages/content.yml
    fs.writeFileSync(
      path.join(root, 'pages', 'content.yml'),
      `
content:
  content_items: []
`
    );

    await runPrebuild(root);

    // processSiteConfig copies config images to public/images/config/
    expect(fs.existsSync(path.join(root, 'public', 'images', 'config', 'logo.png'))).toBe(true);
    // Optimization pass picks up the copied file and generates a WebP variant
    expect(fs.existsSync(path.join(root, 'public', 'images', 'config', 'logo.webp'))).toBe(true);
  });

  // ── Manifest entry structure ─────────────────────────────────────────────

  it('manifest entries contain the correct structure and values', async () => {
    const pageDir = path.join(root, 'pages', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    // Use a known size so we can assert width/height exactly
    await createTestImage(path.join(pageDir, 'hero.png'), 800, 600);
    fs.writeFileSync(path.join(pageDir, 'content.yml'), makeImagePageYaml());

    await runPrebuild(root);

    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(root, 'public', 'stackwright-content', '_image-manifest.json'),
        'utf8'
      )
    );

    const entry = manifest['/images/about/hero.png'];
    expect(entry).toBeDefined();

    // Original image public path
    expect(entry.original).toBe('/images/about/hero.png');
    // Dimensions from getImageMetadata
    expect(entry.width).toBe(800);
    expect(entry.height).toBe(600);

    // Single WebP variant (matches the formats: [webp] config)
    expect(entry.variants).toHaveLength(1);
    const variant = entry.variants[0];
    expect(variant.format).toBe('webp');
    expect(variant.path).toBe('/images/about/hero.webp');
    expect(variant.width).toBeGreaterThan(0);
    expect(variant.height).toBeGreaterThan(0);
    expect(variant.size).toBeGreaterThan(0);

    // Blur placeholder
    expect(entry.blurDataURL).toMatch(/^data:image\/png;base64,/);
  });
});
