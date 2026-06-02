import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { gzipSync } from 'zlib';

const execAsync = promisify(exec);

/**
 * Bundle Size Performance Benchmarks
 *
 * Analyzes Next.js static export (`out/`) to measure:
 * 1. First-load JS — shared chunks that load on every page
 * 2. Total JS across all chunks
 * 3. Per-page bundle sizes (from `app/` or `pages/` subdirectories)
 * 4. Image optimization results
 *
 * This approach works with both App Router and Pages Router outputs
 * by reading directly from `out/_next/static/chunks/` rather than
 * relying on internal Next.js manifest formats.
 *
 * Performance budget — interim targets post-App Router migration
 * Baseline: Jan 2025 ~85KB gzip, pre-optimization peak: ~392KB gzip
 * Turbopack interim target: ≤460KB gzip first-load (Turbopack bundles all code as shared chunks)
 * Previous Webpack target: ≤350KB (set 2026-05-29)
 * Final target: ≤350KB after MapLibre tree-shaking and code-splitting optimizations land
 * Budget updated: 2026-05-30 (App Router + Turbopack migration)
 *
 * Current budgets (authoritative source: performance-budgets.json):
 * - First-load JS: ≤460KB gzipped (warn at 400KB)
 * - All pages JS: ≤800KB gzipped (warn at 600KB)
 */

const exampleAppDir = path.resolve(__dirname, '../../../../examples/stackwright-docs');

interface ChunkInfo {
  name: string;
  rawSize: number;
  gzipSize: number;
}

interface BundleStats {
  firstLoadJS: number;
  allPagesJS: number;
  pages: Array<{ route: string; size: number }>;
  sharedChunks: number;
  /** Individual shared chunk breakdown for reporting */
  sharedChunkDetails: ChunkInfo[];
  /** Individual page chunk breakdown for reporting */
  pageChunkDetails: ChunkInfo[];
}

async function loadBudgets() {
  const budgetPath = path.join(__dirname, 'performance-budgets.json');
  const content = await fs.readFile(budgetPath, 'utf-8');
  return JSON.parse(content);
}

async function ensureBuild() {
  const outDir = path.join(exampleAppDir, 'out');
  try {
    await fs.access(outDir);
    console.log('✅ Static export directory exists');
  } catch {
    console.log('🔨 Building application (static export)...');
    await execAsync('pnpm exec stackwright-prebuild && pnpm exec next build', {
      cwd: exampleAppDir,
    });
  }
}

/**
 * Measure gzip size of a single file.
 * Returns both raw and gzipped byte counts.
 */
async function measureFile(filePath: string): Promise<{ rawSize: number; gzipSize: number }> {
  const content = await fs.readFile(filePath);
  const gzipped = gzipSync(content);
  return { rawSize: content.length, gzipSize: gzipped.length };
}

/**
 * Recursively collect all `.js` files under a directory.
 */
async function collectJSFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectJSFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Analyze the static export output directly.
 *
 * Strategy:
 *  - "Shared" (first-load) = top-level `.js` files in `out/_next/static/chunks/`
 *    These are framework, main, polyfills, webpack — loaded on every page.
 *  - "Page-specific" = `.js` files inside `chunks/app/` (App Router)
 *    or `chunks/pages/` (Pages Router fallback).
 *  - "Total" = every `.js` file recursively under `chunks/`.
 */
async function analyzeStaticOutput(): Promise<BundleStats> {
  const chunksDir = path.join(exampleAppDir, 'out', '_next', 'static', 'chunks');

  // 1. Collect top-level shared chunks
  const topLevelEntries = await fs.readdir(chunksDir, { withFileTypes: true });
  const sharedChunkDetails: ChunkInfo[] = [];
  let firstLoadJS = 0;

  for (const entry of topLevelEntries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const filePath = path.join(chunksDir, entry.name);
    const { rawSize, gzipSize } = await measureFile(filePath);
    sharedChunkDetails.push({ name: entry.name, rawSize, gzipSize });
    firstLoadJS += gzipSize;
  }

  // Sort shared chunks largest-first for reporting
  sharedChunkDetails.sort((a, b) => b.gzipSize - a.gzipSize);

  // 2. Collect page-specific chunks (App Router first, Pages Router fallback)
  const appDir = path.join(chunksDir, 'app');
  const pagesDir = path.join(chunksDir, 'pages');
  const pageChunkDetails: ChunkInfo[] = [];
  const pages: Array<{ route: string; size: number }> = [];

  // Try App Router directory first, fall back to Pages Router
  let pageRoutesDir: string;
  let routerLabel: string;
  try {
    await fs.access(appDir);
    pageRoutesDir = appDir;
    routerLabel = 'app';
  } catch {
    pageRoutesDir = pagesDir;
    routerLabel = 'pages';
  }

  const pageFiles = await collectJSFiles(pageRoutesDir);
  for (const filePath of pageFiles) {
    const relativePath = path.relative(pageRoutesDir, filePath);
    const route = `/${routerLabel}/${relativePath.replace(/\.js$/, '').replace(/\\/g, '/')}`;
    const { rawSize, gzipSize } = await measureFile(filePath);
    pageChunkDetails.push({ name: relativePath, rawSize, gzipSize });
    pages.push({ route, size: gzipSize });
  }

  pages.sort((a, b) => b.size - a.size);
  pageChunkDetails.sort((a, b) => b.gzipSize - a.gzipSize);

  // 3. Total JS = every .js file recursively under chunks/
  const allFiles = await collectJSFiles(chunksDir);
  let allPagesJS = 0;
  for (const filePath of allFiles) {
    const { gzipSize } = await measureFile(filePath);
    allPagesJS += gzipSize;
  }

  return {
    firstLoadJS,
    allPagesJS,
    pages,
    sharedChunks: firstLoadJS,
    sharedChunkDetails,
    pageChunkDetails,
  };
}

async function analyzeStaticAssets(): Promise<{ images: number; total: number }> {
  const publicDir = path.join(exampleAppDir, 'public/images');
  let images = 0;
  let total = 0;

  try {
    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(entry.name)) {
          const stats = await fs.stat(fullPath);
          images++;
          total += stats.size;
        }
      }
    };

    await walk(publicDir);
  } catch (error) {
    // Directory might not exist
  }

  return { images, total };
}

test.describe('Bundle Size Benchmarks', () => {
  let budgets: any;

  test.beforeAll(async () => {
    budgets = await loadBudgets();
    await ensureBuild();
  });

  test('first-load JS bundle size', async () => {
    const stats = await analyzeStaticOutput();

    const sizeKB = Math.round(stats.firstLoadJS / 1024);
    const budget = budgets.bundle.firstLoadJS;
    const passed = stats.firstLoadJS <= budget.max;
    const warning = stats.firstLoadJS > budget.warn;

    console.log(`\n📦 First-Load JS Bundle (shared chunks):`);
    console.log(`  Size: ${sizeKB}KB (${stats.firstLoadJS} bytes, gzipped)`);
    console.log(
      `  Budget: ${Math.round(budget.max / 1024)}KB (warn at ${Math.round(budget.warn / 1024)}KB)`
    );
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

    // Individual chunk breakdown
    console.log(`\n  Shared chunk breakdown:`);
    for (const chunk of stats.sharedChunkDetails) {
      const kb = Math.round(chunk.gzipSize / 1024);
      const rawKB = Math.round(chunk.rawSize / 1024);
      console.log(`    ${chunk.name}: ${kb}KB gzip (${rawKB}KB raw)`);
    }

    expect(
      stats.firstLoadJS,
      `First-load JS is ${sizeKB}KB, budget is ${Math.round(budget.max / 1024)}KB`
    ).toBeLessThanOrEqual(budget.max);

    if (warning) {
      console.warn(
        `⚠️ Warning: First-load JS exceeds ${Math.round(budget.warn / 1024)}KB threshold`
      );
    }
  });

  test('total JS bundle size', async () => {
    const stats = await analyzeStaticOutput();

    const sizeKB = Math.round(stats.allPagesJS / 1024);
    const budget = budgets.bundle.allPagesJS;
    const passed = stats.allPagesJS <= budget.max;
    const warning = stats.allPagesJS > budget.warn;

    console.log(`\n📦 Total JS (all chunks in out/_next/static/chunks/):`);
    console.log(`  Size: ${sizeKB}KB (${stats.allPagesJS} bytes, gzipped)`);
    console.log(
      `  Budget: ${Math.round(budget.max / 1024)}KB (warn at ${Math.round(budget.warn / 1024)}KB)`
    );
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

    // Show per-page breakdown
    if (stats.pages.length > 0) {
      console.log(`\n  Page chunk breakdown (top 5):`);
      for (const page of stats.pages.slice(0, 5)) {
        console.log(`    ${page.route}: ${Math.round(page.size / 1024)}KB`);
      }
    } else {
      console.log(`\n  No page-specific chunks found (all code in shared chunks)`);
    }

    expect(
      stats.allPagesJS,
      `Total JS is ${sizeKB}KB, budget is ${Math.round(budget.max / 1024)}KB`
    ).toBeLessThanOrEqual(budget.max);

    if (warning) {
      console.warn(`⚠️ Warning: Total JS exceeds ${Math.round(budget.warn / 1024)}KB threshold`);
    }
  });

  test('image optimization results', async () => {
    const { images, total } = await analyzeStaticAssets();

    const totalMB = (total / (1024 * 1024)).toFixed(2);
    const avgKB = images > 0 ? Math.round(total / images / 1024) : 0;

    console.log(`\n🖼️  Image Optimization Results:`);
    console.log(`  Total Images: ${images}`);
    console.log(`  Total Size: ${totalMB}MB`);
    console.log(`  Average Size: ${avgKB}KB per image`);

    // This is informational, not a hard limit
    // But we can warn if images are unexpectedly large
    if (avgKB > 500) {
      console.warn(`⚠️ Warning: Average image size is high (${avgKB}KB). Consider optimization.`);
    }

    // Basic sanity check - at least some images should exist
    expect(images, 'Should have processed at least some images').toBeGreaterThan(0);
  });

  test('shared chunk efficiency', async () => {
    const stats = await analyzeStaticOutput();

    // Shared chunks should be reasonable compared to total bundle
    const sharedPercentage = ((stats.sharedChunks / stats.allPagesJS) * 100).toFixed(1);

    console.log(`\n🔗 Shared Chunk Analysis:`);
    console.log(`  Shared chunks: ${Math.round(stats.sharedChunks / 1024)}KB`);
    console.log(`  Total bundle: ${Math.round(stats.allPagesJS / 1024)}KB`);
    console.log(`  Shared percentage: ${sharedPercentage}%`);
    console.log(
      `  Chunk count: ${stats.sharedChunkDetails.length} shared, ${stats.pageChunkDetails.length} page-specific`
    );

    // Shared chunks should be a reasonable portion (20-80% is typical)
    const percentage = parseFloat(sharedPercentage);
    // Turbopack uses a flat chunk structure where all chunks are shared
    // (no app/ or pages/ subdirectory). Accept 20-100% as valid.
    // Webpack typically produces 20-80% shared, Turbopack produces ~100%.
    expect(percentage, 'Shared chunks should be at least 20% of total').toBeGreaterThan(20);
  });
});
