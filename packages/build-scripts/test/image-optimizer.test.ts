import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  shouldOptimizeImage,
  getImageMetadata,
  generateBlurPlaceholder,
  processImageOptimization,
} from '../src/image-optimizer';
import type { ImageOptimizationConfig } from '@stackwright/types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

// Mirrors the lazy-loader pattern in image-optimizer.ts — safe in vitest's
// ESM environment where `import('sharp')` exposes { default: fn, ... }.
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

// ---------------------------------------------------------------------------
// Shared config fixture
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: ImageOptimizationConfig = {
  enabled: true,
  formats: ['webp'],
  quality: 80,
  maxWidth: 1920,
  blur: true,
  blurSize: 10,
};

// ---------------------------------------------------------------------------
// Shared temp-dir lifecycle
// ---------------------------------------------------------------------------

let tmpDir: string;
let destDir: string;
let testImagePath: string;

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-imgopt-test-'));
  destDir = path.join(tmpDir, 'dest');
  fs.mkdirSync(destDir, { recursive: true });
  testImagePath = path.join(tmpDir, 'test.png');
  await createTestImage(testImagePath); // 200×100 red PNG
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// shouldOptimizeImage
// ---------------------------------------------------------------------------

describe('shouldOptimizeImage', () => {
  it('returns true for .png', () => {
    expect(shouldOptimizeImage('hero.png')).toBe(true);
  });

  it('returns true for .jpg', () => {
    expect(shouldOptimizeImage('photo.jpg')).toBe(true);
  });

  it('returns true for .jpeg', () => {
    expect(shouldOptimizeImage('photo.jpeg')).toBe(true);
  });

  it('returns true for .webp', () => {
    expect(shouldOptimizeImage('thumb.webp')).toBe(true);
  });

  it('returns false for .svg', () => {
    expect(shouldOptimizeImage('logo.svg')).toBe(false);
  });

  it('returns false for .gif', () => {
    expect(shouldOptimizeImage('anim.gif')).toBe(false);
  });

  it('returns false for .ico', () => {
    expect(shouldOptimizeImage('favicon.ico')).toBe(false);
  });

  it('returns false for .bmp', () => {
    expect(shouldOptimizeImage('old.bmp')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(shouldOptimizeImage('hero.PNG')).toBe(true);
    expect(shouldOptimizeImage('photo.JPG')).toBe(true);
    expect(shouldOptimizeImage('logo.SVG')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getImageMetadata
// ---------------------------------------------------------------------------

describe('getImageMetadata', () => {
  it('returns correct dimensions for a 200×100 PNG', async () => {
    const meta = await getImageMetadata(testImagePath);
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(100);
  });

  it('returns "png" as the format for a PNG file', async () => {
    const meta = await getImageMetadata(testImagePath);
    expect(meta.format).toBe('png');
  });

  it('returns correct dimensions for a non-square image', async () => {
    const tallPath = path.join(tmpDir, 'tall.png');
    await createTestImage(tallPath, 50, 300);
    const meta = await getImageMetadata(tallPath);
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// generateBlurPlaceholder
// ---------------------------------------------------------------------------

describe('generateBlurPlaceholder', () => {
  it('returns a data:image/png;base64 URI', async () => {
    const result = await generateBlurPlaceholder(testImagePath, 10);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('produces a non-empty, decodable base64 payload', async () => {
    const result = await generateBlurPlaceholder(testImagePath, 10);
    const base64Part = result.replace('data:image/png;base64,', '');
    const decoded = Buffer.from(base64Part, 'base64');
    expect(decoded.length).toBeGreaterThan(0);
  });

  it('produces a smaller placeholder with a smaller blurSize', async () => {
    const small = await generateBlurPlaceholder(testImagePath, 4);
    const large = await generateBlurPlaceholder(testImagePath, 32);
    const smallBytes = Buffer.from(small.replace('data:image/png;base64,', ''), 'base64').length;
    const largeBytes = Buffer.from(large.replace('data:image/png;base64,', ''), 'base64').length;
    expect(smallBytes).toBeLessThan(largeBytes);
  });
});

// ---------------------------------------------------------------------------
// processImageOptimization
// ---------------------------------------------------------------------------

describe('processImageOptimization', () => {
  // ── Format variants ───────────────────────────────────────────────────

  it('generates a WebP variant alongside the original', async () => {
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry).not.toBeNull();
    expect(entry!.variants).toHaveLength(1);
    expect(entry!.variants[0].format).toBe('webp');
    expect(fs.existsSync(path.join(destDir, 'test.webp'))).toBe(true);
  });

  it('generates an AVIF variant when formats = ["avif"]', async () => {
    const config: ImageOptimizationConfig = { ...DEFAULT_CONFIG, formats: ['avif'] };
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      config,
      tmpDir
    );
    expect(entry!.variants).toHaveLength(1);
    expect(entry!.variants[0].format).toBe('avif');
    expect(fs.existsSync(path.join(destDir, 'test.avif'))).toBe(true);
  });

  it('generates both WebP and AVIF when both formats are configured', async () => {
    const config: ImageOptimizationConfig = { ...DEFAULT_CONFIG, formats: ['webp', 'avif'] };
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      config,
      tmpDir
    );
    expect(entry!.variants).toHaveLength(2);
    const formats = entry!.variants.map((v) => v.format).sort();
    expect(formats).toEqual(['avif', 'webp']);
  });

  // ── Blur placeholder ─────────────────────────────────────────────────

  it('includes blurDataURL when blur is enabled', async () => {
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry!.blurDataURL).toMatch(/^data:image\/png;base64,/);
  });

  it('omits blurDataURL when blur is disabled', async () => {
    const config: ImageOptimizationConfig = { ...DEFAULT_CONFIG, blur: false };
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      config,
      tmpDir
    );
    expect(entry!.blurDataURL).toBeUndefined();
  });

  // ── Skip conditions ──────────────────────────────────────────────────

  it('returns null for SVG files (not optimizable)', async () => {
    const svgPath = path.join(tmpDir, 'logo.svg');
    fs.writeFileSync(svgPath, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const entry = await processImageOptimization(
      svgPath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry).toBeNull();
  });

  it('returns null for GIF files (not optimizable)', async () => {
    const gifPath = path.join(tmpDir, 'anim.gif');
    fs.writeFileSync(gifPath, Buffer.alloc(10));
    const entry = await processImageOptimization(
      gifPath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry).toBeNull();
  });

  // ── Sizing behaviour ─────────────────────────────────────────────────

  it('downscales images wider than maxWidth', async () => {
    const widePath = path.join(tmpDir, 'wide.png');
    await createTestImage(widePath, 3000, 1000);

    const config: ImageOptimizationConfig = { ...DEFAULT_CONFIG, maxWidth: 1920 };
    const entry = await processImageOptimization(widePath, destDir, '/images/test', config, tmpDir);
    expect(entry!.variants[0].width).toBeLessThanOrEqual(1920);
  });

  it('does not upscale images narrower than maxWidth', async () => {
    const smallPath = path.join(tmpDir, 'small.png');
    await createTestImage(smallPath, 100, 50);

    const entry = await processImageOptimization(
      smallPath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    // Should stay at 100px — withoutEnlargement is set
    expect(entry!.variants[0].width).toBe(100);
  });

  // ── Manifest entry fields ────────────────────────────────────────────

  it('records the original image dimensions on the manifest entry', async () => {
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry!.width).toBe(200);
    expect(entry!.height).toBe(100);
  });

  it('sets the public variant path from the publicPrefix argument', async () => {
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/about',
      DEFAULT_CONFIG,
      tmpDir
    );
    expect(entry!.variants[0].path).toBe('/images/about/test.webp');
  });

  it('includes positive size and dimension values on each variant', async () => {
    const entry = await processImageOptimization(
      testImagePath,
      destDir,
      '/images/test',
      DEFAULT_CONFIG,
      tmpDir
    );
    const v = entry!.variants[0];
    expect(v.width).toBeGreaterThan(0);
    expect(v.height).toBeGreaterThan(0);
    expect(v.size).toBeGreaterThan(0);
  });
});
