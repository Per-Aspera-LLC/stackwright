import { test, expect, type Page, type ConsoleMessage } from '@playwright/test';

/**
 * Stackwright E2E smoke tests.
 *
 * These tests verify the full pipeline: YAML → prebuild → Next.js build → browser.
 * The webServer config in playwright.config.ts builds and starts the example app
 * before any tests run.
 */

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/getting-started', name: 'Getting Started' },
  { path: '/showcase', name: 'Showcase' },
  { path: '/privacy-policy', name: 'Privacy Policy' },
  { path: '/terms-of-service', name: 'Terms of Service' },
  { path: '/blog', name: 'Blog' },
];

/** Collect console errors during a page visit. */
function collectConsoleErrors(page: Page): ConsoleMessage[] {
  const errors: ConsoleMessage[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg);
    }
  });
  return errors;
}

for (const { path: pagePath, name } of PAGES) {
  test.describe(`Page: ${name} (${pagePath})`, () => {
    let consoleErrors: ConsoleMessage[];

    test.beforeEach(async ({ page }) => {
      consoleErrors = collectConsoleErrors(page);
      const response = await page.goto(pagePath, { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
    });

    test('renders visible content (not blank)', async ({ page }) => {
      // Page should have at least one heading or substantive text
      const body = await page.locator('body').innerText();
      expect(body.trim().length).toBeGreaterThan(0);

      // At least one heading should be present on every page
      const headings = page.locator('h1, h2, h3');
      await expect(headings.first()).toBeVisible();
    });

    test('has no error boundary content', async ({ page }) => {
      // Check for common React error boundary text
      const errorIndicators = [
        'Something went wrong',
        'Application error',
        'Unhandled Runtime Error',
      ];
      const bodyText = await page.locator('body').innerText();
      for (const indicator of errorIndicators) {
        expect(bodyText).not.toContain(indicator);
      }
    });

    test('has no critical console errors', async () => {
      // Fail on console errors related to Stackwright internals
      const criticalPatterns = [
        /stackwright/i,
        /registration/i,
        /registerComponent/i,
        /Cannot read properties of undefined/,
        /is not a function/,
      ];
      const critical = consoleErrors.filter((msg) =>
        criticalPatterns.some((pattern) => pattern.test(msg.text()))
      );
      if (critical.length > 0) {
        const messages = critical.map((m) => m.text()).join('\n');
        expect.soft(critical, `Critical console errors:\n${messages}`).toHaveLength(0);
      }
    });
  });
}

test.describe('Site-wide navigation', () => {
  test('app bar navigation links are present and reachable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Find nav links in the header/app bar area
    const navLinks = page.locator('header a[href], nav a[href]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    // Collect all internal hrefs
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && href.startsWith('/')) {
        hrefs.push(href);
      }
    }

    // Each internal nav link should resolve (not 404)
    for (const href of [...new Set(hrefs)]) {
      const response = await page.goto(href, { waitUntil: 'networkidle' });
      expect(response?.status(), `Nav link ${href} returned non-200`).toBe(200);
    }
  });
});
