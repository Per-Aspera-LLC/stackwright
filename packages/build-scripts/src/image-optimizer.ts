/**
 * image-optimizer.ts
 *
 * Core image optimization pipeline using sharp.
 *
 * Generates WebP/AVIF format variants and tiny base64 blur placeholders for
 * every co-located image processed by the `stackwright-prebuild` script.
 *
 * Design notes:
 *  - sharp is loaded lazily via dynamic import so the build can still run
 *    (with copy-only fallback) if sharp is not installed.
 *  - Concurrency is intentionally NOT handled here — the caller (prebuild.ts)
 *    manages that at the job level.
 *  - This module has zero knowledge of YAML/JSON content; it works purely on
 *    filesystem paths and public URL prefixes.
 */

import fs from 'fs';
import path from 'path';
import type sharpType from 'sharp';
import type { ImageOptimizationConfig } from '@stackwright/types';

// -- Types ------------------------------------------------------------------

/** A single generated format variant for an image. */
export interface ImageVariant {
  /** Output format (e.g. `'webp'`, `'avif'`). */
  format: string;
  /** Public URL path to the variant (e.g. `'/images/about/hero.webp'`). */
  path: string;
  /** Output width in pixels. */
  width: number;
  /** Output height in pixels. */
  height: number;
  /** Output file size in bytes. */
  size: number;
}

/** Full optimization record for a single image. */
export interface ImageManifestEntry {
  /** Public URL path to the original image (e.g. `'/images/about/hero.png'`). */
  original: string;
  /** All generated format variants. */
  variants: ImageVariant[];
  /**
   * Tiny base64-encoded PNG data URI for use as `blurDataURL` in
   * `<NextStackwrightImage placeholder="blur" />`. Undefined when blur is disabled.
   */
  blurDataURL?: string;
  /** Original image width in pixels. */
  width: number;
  /** Original image height in pixels. */
  height: number;
}

/**
 * Maps public image paths to their full optimization manifest entries.
 *
 * @example
 * {
 *   '/images/about/hero.png': {
 *     original: '/images/about/hero.png',
 *     variants: [{ format: 'webp', path: '/images/about/hero.webp', ... }],
 *     blurDataURL: 'data:image/png;base64,...',
 *     width: 1920,
 *     height: 1080,
 *   }
 * }
 */
export type ImageManifest = Record<string, ImageManifestEntry>;

// -- Sharp lazy loader ------------------------------------------------------

// Cached sharp constructor — loaded once on first use.
let sharpFn: typeof sharpType | null = null;

/**
 * Lazily load and unwrap the sharp constructor.
 *
 * Sharp uses `export = sharp` (CJS style), so a dynamic ESM import returns
 * `{ default: fn }` at runtime. We unwrap `.default` here once and cache the
 * callable, giving call sites a clean `const sharp = await getSharp()` API.
 *
 * Throws a helpful error if sharp is not installed so the fallback in
 * `processImageOptimization` can catch it and warn gracefully.
 */
async function getSharp(): Promise<typeof sharpType> {
  if (!sharpFn) {
    try {
      const mod = await import('sharp');
       
      sharpFn = ((mod as any).default ?? mod) as typeof sharpType;
    } catch {
      throw new Error(
        'sharp is required for image optimization. Install it with: pnpm add -D sharp'
      );
    }
  }
  return sharpFn;
}

// -- Image eligibility ------------------------------------------------------

/**
 * Extensions that sharp can meaningfully optimize into WebP/AVIF.
 *
 * Deliberately excludes:
 *  - `.svg`  — vector; lossless by nature, sharp can't sensibly re-encode it
 *  - `.gif`  — may be animated; sharp strips animation on conversion
 *  - `.ico`  — multi-resolution container; best left as-is
 *  - `.bmp`  — rare in practice; copy-only is fine
 */
const OPTIMIZABLE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Returns `true` when the given filename has an extension that this pipeline
 * can optimize (raster formats that sharp handles well).
 *
 * @example
 * shouldOptimizeImage('hero.png')  // true
 * shouldOptimizeImage('logo.svg')  // false
 * shouldOptimizeImage('anim.gif')  // false
 */
export function shouldOptimizeImage(filename: string): boolean {
  return OPTIMIZABLE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

// -- Core image utilities ---------------------------------------------------

/**
 * Read width, height, and format from an image file using sharp metadata.
 *
 * @param srcPath  Absolute filesystem path to the source image.
 */
export async function getImageMetadata(
  srcPath: string
): Promise<{ width: number; height: number; format: string }> {
  const sharp = await getSharp();
  const meta = await sharp(srcPath).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? 'unknown',
  };
}

/**
 * Generate a tiny base64-encoded PNG data URI for use as a blur placeholder.
 *
 * Resizes the image to `blurSize` pixels wide (aspect-ratio-preserving) and
 * encodes the result as a PNG data URI. The resulting string is suitable for
 * use as `blurDataURL` in Next.js `<Image placeholder="blur" />`.
 *
 * @param srcPath   Absolute filesystem path to the source image.
 * @param blurSize  Target width in pixels for the placeholder (e.g. `10`).
 * @returns         `data:image/png;base64,...`
 */
export async function generateBlurPlaceholder(srcPath: string, blurSize: number): Promise<string> {
  const sharp = await getSharp();
  const buffer = await sharp(srcPath)
    .resize(blurSize, undefined, { withoutEnlargement: true })
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

// -- Optimization core (internal) -------------------------------------------

/**
 * Generate all configured format variants for a single image.
 *
 * Writes output files directly to `destDir` alongside the already-copied
 * original. Returns a fully-populated `ImageManifestEntry`.
 *
 * @param srcPath       Absolute path to the source image.
 * @param destDir       Destination directory (e.g. `public/images/about/`).
 * @param publicPrefix  Public URL prefix for building variant paths (e.g. `/images/about`).
 * @param config        Resolved image optimization config from `stackwright.yml`.
 */
async function optimizeImage(
  srcPath: string,
  destDir: string,
  publicPrefix: string,
  config: ImageOptimizationConfig
): Promise<ImageManifestEntry> {
  const sharp = await getSharp();

  const { width: originalWidth, height: originalHeight } = await getImageMetadata(srcPath);

  const basename = path.basename(srcPath, path.extname(srcPath));
  const variants: ImageVariant[] = [];

  // Ensure destination directory exists before writing any variants.
  fs.mkdirSync(destDir, { recursive: true });

  for (const format of config.formats) {
    const variantFilename = `${basename}.${format}`;
    const variantDestPath = path.join(destDir, variantFilename);
    const variantPublicPath = `${publicPrefix}/${variantFilename}`;

    // Build the sharp pipeline: resize (capped at maxWidth), then encode.
    let pipeline = sharp(srcPath).resize({ width: config.maxWidth, withoutEnlargement: true });

    if (format === 'webp') {
      pipeline = pipeline.webp({ quality: config.quality });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality: config.quality });
    }

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    fs.writeFileSync(variantDestPath, data);

    variants.push({
      format,
      path: variantPublicPath,
      width: info.width,
      height: info.height,
      size: info.size,
    });
  }

  let blurDataURL: string | undefined;
  if (config.blur) {
    blurDataURL = await generateBlurPlaceholder(srcPath, config.blurSize);
  }

  return {
    original: `${publicPrefix}/${path.basename(srcPath)}`,
    variants,
    blurDataURL,
    width: originalWidth,
    height: originalHeight,
  };
}

// -- Public entry point -----------------------------------------------------

/**
 * High-level entry point called from `prebuild.ts` for each co-located image.
 *
 * Checks eligibility, delegates to `optimizeImage`, and handles errors
 * gracefully — on failure, logs a warning and returns `null` so the caller
 * can fall back to the plain copy-only path.
 *
 * @param srcPath       Absolute path to the source image.
 * @param destDir       Destination directory (e.g. `public/images/about/`).
 * @param publicPrefix  Public URL prefix (e.g. `/images/about`).
 * @param config        Resolved image optimization config.
 * @param rootDir       Project root — used for human-readable relative paths in logs.
 * @returns             Populated `ImageManifestEntry`, or `null` if the image
 *                      was skipped or optimization failed.
 */
export async function processImageOptimization(
  srcPath: string,
  destDir: string,
  publicPrefix: string,
  config: ImageOptimizationConfig,
  rootDir: string
): Promise<ImageManifestEntry | null> {
  if (!shouldOptimizeImage(srcPath)) {
    return null;
  }

  const relativePath = path.relative(rootDir, srcPath);

  try {
    const entry = await optimizeImage(srcPath, destDir, publicPrefix, config);
    console.log(`  optimized: ${relativePath} → ${entry.variants.length} variant(s)`);
    return entry;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `  Image optimization failed for ${relativePath}: ${message} (falling back to copy-only)`
    );
    return null;
  }
}
