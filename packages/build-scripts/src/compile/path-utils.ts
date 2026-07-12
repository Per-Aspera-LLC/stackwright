/**
 * Shared filesystem path utilities for compile primitives.
 *
 * These are pure functions (or close to it) that deal with copying assets
 * and rewriting path strings. Shared between site.ts, pages.ts, and
 * collections.ts to avoid duplication.
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Extension sets
// ---------------------------------------------------------------------------

export const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
]);

// Keep in sync with VIDEO_EXTENSIONS_ARRAY exported from @stackwright/types
export const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']);

// ---------------------------------------------------------------------------
// Predicates
// ---------------------------------------------------------------------------

export function isImagePath(str: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(str).toLowerCase());
}

export function isVideoPath(str: string): boolean {
  return VIDEO_EXTENSIONS.has(path.extname(str).toLowerCase());
}

export function isColocatablePath(str: string): boolean {
  return isImagePath(str) || isVideoPath(str);
}

// ---------------------------------------------------------------------------
// File copy
// ---------------------------------------------------------------------------

/**
 * Copy src to dest only if dest is missing or older than src.
 * Creates destination parent directories automatically.
 * Skips symlinks (security: prevents path traversal).
 */
export function copyIfNewer(src: string, dest: string, rootDir: string): void {
  fs.mkdirSync(path.dirname(dest), { recursive: true });

  const srcStat = fs.lstatSync(src);
  if (srcStat.isSymbolicLink()) {
    console.warn(`  WARNING: Skipping symlink: ${src}`);
    return;
  }

  if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
    fs.copyFileSync(src, dest);
    console.log(`  asset: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
  }
}

// ---------------------------------------------------------------------------
// Deep path rewriting
// ---------------------------------------------------------------------------

/**
 * Walk any JS value, calling rewrite() on every string.
 * Returns a new deep copy with rewritten strings. Does not mutate input.
 */
export function rewritePaths(node: unknown, rewrite: (s: string) => string): unknown {
  if (typeof node === 'string') return rewrite(node);
  if (Array.isArray(node)) return node.map((item) => rewritePaths(item, rewrite));
  if (node !== null && typeof node === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      result[k] = rewritePaths(v, rewrite);
    }
    return result;
  }
  return node;
}
