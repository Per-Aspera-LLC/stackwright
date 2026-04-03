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
 * Analyzes Next.js build output to measure:
 * 1. First-load JS (critical for initial page load)
 * 2. Total JS across all pages
 * 3. Per-page bundle sizes
 * 4. Image optimization results
 *
 * Baselines (established 2025-01-27):
 * - First-load JS: ~85KB gzipped
 * - Total JS: ~300KB gzipped
 *
 * Budgets:
 * - First-load JS: <100KB gzipped (warn at 80KB)
 * - All pages JS: <500KB gzipped (warn at 400KB)
 */

const exampleAppDir = path.resolve(__dirname, '../../../../examples/stackwright-docs');

interface BundleStats {
  firstLoadJS: number;
  allPagesJS: number;
  pages: Array<{ route: string; size: number }>;
  sharedChunks: number;
}

async function loadBudgets() {
  const budgetPath = path.join(__dirname, 'performance-budgets.json');
  const content = await fs.readFile(budgetPath, 'utf-8');
  return JSON.parse(content);
}

async function ensureBuild() {
  const buildDir = path.join(exampleAppDir, '.next');
  try {
    await fs.access(buildDir);
    console.log('✅ Build directory exists');
  } catch {
    console.log('🔨 Building application first...');
    await execAsync('pnpm exec stackwright-prebuild && pnpm exec next build', {
      cwd: exampleAppDir,
    });
  }
}

async function analyzeBuildManifest(): Promise<BundleStats> {
  const manifestPath = path.join(exampleAppDir, '.next/build-manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

  // Get first-load JS files
  const firstLoadFiles = manifest.pages['/_app'] || [];

  // Calculate sizes
  let firstLoadJS = 0;
  let allPagesJS = 0;
  const pages: Array<{ route: string; size: number }> = [];

  // Analyze first-load JS
  for (const file of firstLoadFiles) {
    const filePath = path.join(exampleAppDir, '.next', file);
    try {
      const content = await fs.readFile(filePath);
      const gzipped = gzipSync(content);
      firstLoadJS += gzipped.length;
    } catch (error) {
      // File might not exist, skip
    }
  }

  // Analyze all pages
  for (const [route, files] of Object.entries(manifest.pages)) {
    let pageSize = 0;
    for (const file of files as string[]) {
      const filePath = path.join(exampleAppDir, '.next', file);
      try {
        const content = await fs.readFile(filePath);
        const gzipped = gzipSync(content);
        pageSize += gzipped.length;
        allPagesJS += gzipped.length;
      } catch (error) {
        // File might not exist, skip
      }
    }
    pages.push({ route, size: pageSize });
  }

  return {
    firstLoadJS,
    allPagesJS,
    pages: pages.sort((a, b) => b.size - a.size),
    sharedChunks: firstLoadJS,
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
    const stats = await analyzeBuildManifest();

    const sizeKB = Math.round(stats.firstLoadJS / 1024);
    const budget = budgets.bundle.firstLoadJS;
    const passed = stats.firstLoadJS <= budget.max;
    const warning = stats.firstLoadJS > budget.warn;

    console.log(`\n📦 First-Load JS Bundle:`);
    console.log(`  Size: ${sizeKB}KB (${stats.firstLoadJS} bytes, gzipped)`);
    console.log(
      `  Budget: ${Math.round(budget.max / 1024)}KB (warn at ${Math.round(budget.warn / 1024)}KB)`
    );
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

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
    const stats = await analyzeBuildManifest();

    const sizeKB = Math.round(stats.allPagesJS / 1024);
    const budget = budgets.bundle.allPagesJS;
    const passed = stats.allPagesJS <= budget.max;
    const warning = stats.allPagesJS > budget.warn;

    console.log(`\n📦 Total JS Across All Pages:`);
    console.log(`  Size: ${sizeKB}KB (${stats.allPagesJS} bytes, gzipped)`);
    console.log(
      `  Budget: ${Math.round(budget.max / 1024)}KB (warn at ${Math.round(budget.warn / 1024)}KB)`
    );
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

    // Show per-page breakdown
    console.log(`\n  Per-Page Breakdown (top 5):`);
    for (const page of stats.pages.slice(0, 5)) {
      console.log(`    ${page.route}: ${Math.round(page.size / 1024)}KB`);
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
    const stats = await analyzeBuildManifest();

    // Shared chunks should be reasonable compared to total bundle
    const sharedPercentage = ((stats.sharedChunks / stats.allPagesJS) * 100).toFixed(1);

    console.log(`\n🔗 Shared Chunk Analysis:`);
    console.log(`  Shared chunks: ${Math.round(stats.sharedChunks / 1024)}KB`);
    console.log(`  Total bundle: ${Math.round(stats.allPagesJS / 1024)}KB`);
    console.log(`  Shared percentage: ${sharedPercentage}%`);

    // Shared chunks should be a reasonable portion (20-60% is typical)
    const percentage = parseFloat(sharedPercentage);
    expect(percentage, 'Shared chunks should be between 20% and 80% of total').toBeGreaterThan(20);
    expect(percentage, 'Shared chunks should be between 20% and 80% of total').toBeLessThan(80);
  });
});
