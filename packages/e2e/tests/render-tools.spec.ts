import { test, expect, chromium } from '@playwright/test';

/**
 * E2E integration tests for the MCP visual render tools.
 *
 * These tests verify the core rendering pipeline works end-to-end:
 * - Server probe detects the running dev server
 * - Page rendering produces valid screenshots
 * - Different viewport sizes produce appropriately sized output
 *
 * The webServer config in playwright.config.ts builds and starts the
 * example app before any tests run, so localhost:3000 is guaranteed
 * to be available.
 */

test.describe('Visual render tools — E2E', () => {
  /**
   * Test the probeServer logic by directly hitting the running server.
   * (The webServer config guarantees localhost:3000 is up.)
   */
  test('can detect a running server', async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch('http://localhost:3000', { signal: controller.signal });
      expect(res.status).toBeLessThan(500);
    } finally {
      clearTimeout(timer);
    }
  });

  /**
   * Core rendering test — launch a browser, navigate, screenshot, verify output.
   * This mirrors what renderPage() does internally.
   */
  test('renders home page to a valid PNG screenshot', async () => {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      const response = await page.goto('http://localhost:3000/', {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      expect(response).not.toBeNull();
      expect(response!.status()).toBe(200);

      await page.waitForTimeout(500);
      const buffer = await page.screenshot({ fullPage: true, type: 'png' });

      // Verify we got a valid PNG (magic bytes: \x89PNG)
      expect(buffer[0]).toBe(0x89);
      expect(buffer[1]).toBe(0x50); // P
      expect(buffer[2]).toBe(0x4e); // N
      expect(buffer[3]).toBe(0x47); // G

      // Screenshot should be non-trivial (at least 10KB for a real page)
      expect(buffer.length).toBeGreaterThan(10_000);

      // Verify base64 encoding round-trip (what MCP tools return)
      const base64 = buffer.toString('base64');
      const decoded = Buffer.from(base64, 'base64');
      expect(decoded.length).toBe(buffer.length);

      await page.close();
    } finally {
      await browser.close();
    }
  });

  /**
   * Mobile viewport test — verify rendering works at a narrow width.
   */
  test('renders at mobile viewport (375x667)', async () => {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 375, height: 667 });

      const response = await page.goto('http://localhost:3000/', {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      expect(response!.status()).toBe(200);

      const buffer = await page.screenshot({ fullPage: false, type: 'png' });
      expect(buffer.length).toBeGreaterThan(5_000);

      await page.close();
    } finally {
      await browser.close();
    }
  });

  /**
   * Non-existent page should return 404 — verify error handling.
   */
  test('returns error for non-existent page', async () => {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const response = await page.goto('http://localhost:3000/does-not-exist-xyz', {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      // Next.js returns 404 for unknown pages
      expect(response!.status()).toBe(404);

      await page.close();
    } finally {
      await browser.close();
    }
  });

  /**
   * JPEG format test — verify JPEG output works.
   */
  test('renders to JPEG format', async () => {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto('http://localhost:3000/', {
        waitUntil: 'networkidle',
        timeout: 30_000,
      });

      await page.waitForTimeout(500);
      const buffer = await page.screenshot({ fullPage: false, type: 'jpeg' });

      // JPEG magic bytes: \xFF\xD8\xFF
      expect(buffer[0]).toBe(0xff);
      expect(buffer[1]).toBe(0xd8);
      expect(buffer[2]).toBe(0xff);

      expect(buffer.length).toBeGreaterThan(5_000);

      await page.close();
    } finally {
      await browser.close();
    }
  });
});
