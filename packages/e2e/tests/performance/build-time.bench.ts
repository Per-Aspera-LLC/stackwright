import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * Build Time Performance Benchmarks
 *
 * Measures the time taken for:
 * 1. stackwright-prebuild (image co-location + path rewriting)
 * 2. next build (full SSG build)
 *
 * Baselines (established 2025-01-27):
 * - Prebuild (7 pages, 17 files): ~2-5s
 * - Next build (7 pages): ~30-45s
 *
 * Budgets:
 * - Prebuild: <10s (warn at 8s)
 * - Next build: <60s (warn at 45s)
 * - Regression threshold: 20%
 */

const exampleAppDir = path.resolve(__dirname, '../../../../examples/stackwright-docs');

interface BenchmarkResult {
  name: string;
  duration: number;
  passed: boolean;
  warning: boolean;
  budget: { max: number; warn: number };
}

async function loadBudgets() {
  const budgetPath = path.join(__dirname, 'performance-budgets.json');
  const content = await fs.readFile(budgetPath, 'utf-8');
  return JSON.parse(content);
}

async function benchmarkCommand(name: string, command: string, cwd: string): Promise<number> {
  const startTime = Date.now();
  try {
    await execAsync(command, { cwd, env: { ...process.env, NODE_ENV: 'production' } });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`, error);
    throw error;
  }
  const duration = Date.now() - startTime;
  console.log(`✅ ${name}: ${duration}ms`);
  return duration;
}

test.describe('Build Time Benchmarks', () => {
  // Set longer timeout for build operations (2 minutes per test)
  test.setTimeout(120_000);

  let budgets: any;

  test.beforeAll(async () => {
    budgets = await loadBudgets();
  });

  test('stackwright-prebuild performance', async () => {
    // Clean previous build artifacts
    const processedDir = path.join(exampleAppDir, '.stackwright/processed');
    await fs.rm(processedDir, { recursive: true, force: true });

    const duration = await benchmarkCommand(
      'stackwright-prebuild',
      'pnpm exec stackwright-prebuild',
      exampleAppDir
    );

    const budget = budgets.build.prebuild;
    const passed = duration <= budget.max;
    const warning = duration > budget.warn;

    // Log results
    console.log(`\n📊 Prebuild Performance:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Budget: ${budget.max}ms (warn at ${budget.warn}ms)`);
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

    // Assert
    expect(duration, `Prebuild took ${duration}ms, budget is ${budget.max}ms`).toBeLessThanOrEqual(
      budget.max
    );

    if (warning) {
      console.warn(`⚠️ Warning: Prebuild is slower than ${budget.warn}ms threshold`);
    }
  });

  test('next build performance', async () => {
    // Clean build directory
    const buildDir = path.join(exampleAppDir, '.next');
    await fs.rm(buildDir, { recursive: true, force: true });

    const duration = await benchmarkCommand('next build', 'pnpm exec next build', exampleAppDir);

    const budget = budgets.build.nextBuild;
    const passed = duration <= budget.max;
    const warning = duration > budget.warn;

    // Log results
    console.log(`\n📊 Next Build Performance:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Budget: ${budget.max}ms (warn at ${budget.warn}ms)`);
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);

    // Assert
    expect(
      duration,
      `Next build took ${duration}ms, budget is ${budget.max}ms`
    ).toBeLessThanOrEqual(budget.max);

    if (warning) {
      console.warn(`⚠️ Warning: Next build is slower than ${budget.warn}ms threshold`);
    }
  });

  test('combined build pipeline performance', async () => {
    // Clean everything
    const processedDir = path.join(exampleAppDir, '.stackwright/processed');
    const buildDir = path.join(exampleAppDir, '.next');
    await Promise.all([
      fs.rm(processedDir, { recursive: true, force: true }),
      fs.rm(buildDir, { recursive: true, force: true }),
    ]);

    const startTime = Date.now();

    // Run prebuild
    await execAsync('pnpm exec stackwright-prebuild', { cwd: exampleAppDir });
    const prebuildDuration = Date.now() - startTime;

    // Run build
    await execAsync('pnpm exec next build', { cwd: exampleAppDir });
    const totalDuration = Date.now() - startTime;
    const buildDuration = totalDuration - prebuildDuration;

    console.log(`\n📊 Full Pipeline Performance:`);
    console.log(`  Prebuild: ${prebuildDuration}ms`);
    console.log(`  Next Build: ${buildDuration}ms`);
    console.log(`  Total: ${totalDuration}ms`);
    console.log(`  Budget: ${budgets.build.prebuild.max + budgets.build.nextBuild.max}ms`);

    const totalBudget = budgets.build.prebuild.max + budgets.build.nextBuild.max;
    expect(
      totalDuration,
      `Total build took ${totalDuration}ms, budget is ${totalBudget}ms`
    ).toBeLessThanOrEqual(totalBudget);
  });
});
