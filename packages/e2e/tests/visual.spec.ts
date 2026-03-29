import { test, expect } from '@playwright/test';
import { SHOWCASE_PAGE, SHOWCASE_SECTIONS } from './fixtures';

/**
 * Visual regression tests for Stackwright content types.
 *
 * Uses Playwright's built-in toHaveScreenshot() to compare against committed
 * baseline screenshots. The /showcase page demonstrates all content types,
 * each wrapped in a [data-content-type] element for reliable targeting.
 *
 * Run with --update-snapshots to regenerate baselines:
 *   pnpm test:e2e --update-snapshots
 */

test.describe('Visual regression — desktop (1280x720)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('home page full layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveScreenshot('home-desktop.png', {
      fullPage: true,
    });
  });

  test.describe('showcase content types', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SHOWCASE_PAGE, { waitUntil: 'networkidle' });
    });

    for (const { label, name } of SHOWCASE_SECTIONS) {
      test(`${name}`, async ({ page }) => {
        const section = page.locator(`[data-label="${label}"]`);
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveScreenshot(`${name}-desktop.png`);
      });
    }
  });
});

test.describe('Visual regression — mobile (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('home page full layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
    });
  });

  test.describe('showcase content types', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(SHOWCASE_PAGE, { waitUntil: 'networkidle' });
    });

    for (const { label, name } of SHOWCASE_SECTIONS) {
      test(`${name}`, async ({ page }) => {
        const section = page.locator(`[data-label="${label}"]`);
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveScreenshot(`${name}-mobile.png`);
      });
    }
  });
});
