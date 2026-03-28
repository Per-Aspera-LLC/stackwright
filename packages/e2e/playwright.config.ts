/**
 * Playwright E2E Test Configuration
 *
 * Test Strategy:
 * - Functional tests (*.spec.ts): Run on ALL browsers (Desktop + Mobile)
 * - Visual regression (*.visual.spec.ts): Run ONLY on Chromium desktop
 *   (to avoid pixel diff issues across different rendering engines)
 * - Benchmark tests (*.bench.ts): Run on Chromium only (performance baseline)
 *
 * Browser Matrix:
 * - Chromium (desktop): Full test coverage including visual regression
 * - Firefox (desktop): Functional tests only
 * - WebKit (desktop): Functional tests only (Safari engine)
 * - Mobile Chrome (375x667): Functional tests, typical Android viewport
 * - Mobile Safari (375x812): Functional tests, iPhone X dimensions
 */
import { defineConfig } from '@playwright/test';
import path from 'path';

const exampleAppDir = path.resolve(__dirname, '../../examples/hellostackwrightnext');

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.{spec,bench}.ts',
  timeout: 30_000,
  retries: 0,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      // Runs ALL tests including visual regression and benchmarks
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
      // Skip visual regression and benchmarks (Chromium-only for consistency)
      testIgnore: ['**/*.visual.spec.ts', '**/*.bench.ts'],
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
      // Skip visual regression and benchmarks (Chromium-only for consistency)
      testIgnore: ['**/*.visual.spec.ts', '**/*.bench.ts'],
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 375, height: 667 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
      // Skip visual regression and benchmarks on mobile (can add mobile-specific tests later)
      testIgnore: ['**/*.visual.spec.ts', '**/*.bench.ts'],
    },
    {
      name: 'mobile-safari',
      use: {
        browserName: 'webkit',
        viewport: { width: 375, height: 812 }, // iPhone X dimensions
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      },
      // Skip visual regression and benchmarks on mobile (can add mobile-specific tests later)
      testIgnore: ['**/*.visual.spec.ts', '**/*.bench.ts'],
    },
  ],
  webServer: process.env.PERF_NO_SERVER
    ? undefined
    : {
        command: `pnpm --filter stackwright-example-app exec stackwright-prebuild && pnpm --filter stackwright-example-app exec next build && pnpm --filter stackwright-example-app exec next start`,
        cwd: path.resolve(__dirname, '../..'),
        port: 3000,
        timeout: 180_000,
        reuseExistingServer: !process.env.CI,
      },
});
