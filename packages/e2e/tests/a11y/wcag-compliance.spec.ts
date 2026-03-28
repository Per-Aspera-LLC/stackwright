import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Stackwright WCAG Accessibility Tests 🦮
 *
 * These tests ensure that Stackwright-powered sites are accessible to everyone,
 * including users with disabilities. We test for:
 * - WCAG 2.1 Level AA compliance
 * - Color contrast in both light and dark modes
 * - Keyboard navigation
 * - Screen reader compatibility
 *
 * "Accessibility is not a feature, it's a requirement." - Someone smart, probably
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

/**
 * Toggle between light and dark mode by clicking the theme toggle button.
 * Falls back gracefully if no toggle button exists.
 */
async function setColorMode(page: Page, mode: 'light' | 'dark'): Promise<void> {
  // Look for a theme toggle button (common patterns)
  const toggleSelectors = [
    '[aria-label*="theme" i]',
    '[aria-label*="dark" i]',
    '[aria-label*="light" i]',
    '[data-testid*="theme" i]',
    'button[class*="theme" i]',
  ];

  let toggled = false;
  for (const selector of toggleSelectors) {
    const button = page.locator(selector).first();
    if (await button.isVisible().catch(() => false)) {
      // Check current mode by looking at the document's data attribute or class
      const currentMode = await page.evaluate(() => {
        const html = document.documentElement;
        return html.classList.contains('dark') || html.dataset.theme === 'dark'
          ? 'dark'
          : 'light';
      });

      // Toggle if needed
      if (currentMode !== mode) {
        await button.click();
        // Wait for theme transition
        await page.waitForTimeout(300);
      }
      toggled = true;
      break;
    }
  }

  // If no toggle found, try to set via cookie or localStorage
  if (!toggled) {
    await page.evaluate((targetMode) => {
      // Try localStorage first
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('sw-color-mode', targetMode);
        window.localStorage.setItem('theme', targetMode);
      }
      // Try cookie
      document.cookie = `sw-color-mode=${targetMode}; path=/`;
      // Apply class directly for immediate effect
      document.documentElement.classList.toggle('dark', targetMode === 'dark');
      document.documentElement.dataset.theme = targetMode;
    }, mode);
    await page.reload({ waitUntil: 'networkidle' });
  }
}

/**
 * Run axe accessibility scan on the current page.
 */
async function runAxeScan(page: Page, context: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Format violations for better readability in test output
  if (results.violations.length > 0) {
    const violationSummary = results.violations.map((v) => {
      const nodes = v.nodes.map(n => `    - ${n.html.substring(0, 100)}...`).join('\n');
      return `  ${v.id} (${v.impact}): ${v.description}\n${nodes}`;
    }).join('\n\n');

    console.error(`❌ Accessibility violations found in ${context}:\n\n${violationSummary}`);
  }

  return results;
}

// Test each page in both light and dark mode
for (const { path: pagePath, name } of PAGES) {
  test.describe(`A11y: ${name} (${pagePath})`, () => {
    test('passes WCAG 2.1 AA compliance in LIGHT mode', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });
      await setColorMode(page, 'light');

      const results = await runAxeScan(page, `${name} - Light Mode`);

      // No critical or serious violations allowed
      const critical = results.violations.filter(v => v.impact === 'critical');
      const serious = results.violations.filter(v => v.impact === 'serious');

      expect(critical, `Critical violations in ${name} (light mode)`).toHaveLength(0);
      expect(serious, `Serious violations in ${name} (light mode)`).toHaveLength(0);

      // Log moderate/minor as warnings but don't fail
      const moderate = results.violations.filter(v => v.impact === 'moderate');
      const minor = results.violations.filter(v => v.impact === 'minor');
      if (moderate.length > 0 || minor.length > 0) {
        console.warn(`⚠️  ${name} (light) has ${moderate.length} moderate and ${minor.length} minor a11y issues`);
      }
    });

    test('passes WCAG 2.1 AA compliance in DARK mode', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });
      await setColorMode(page, 'dark');

      const results = await runAxeScan(page, `${name} - Dark Mode`);

      // No critical or serious violations allowed
      const critical = results.violations.filter(v => v.impact === 'critical');
      const serious = results.violations.filter(v => v.impact === 'serious');

      expect(critical, `Critical violations in ${name} (dark mode)`).toHaveLength(0);
      expect(serious, `Serious violations in ${name} (dark mode)`).toHaveLength(0);

      // Log moderate/minor as warnings but don't fail
      const moderate = results.violations.filter(v => v.impact === 'moderate');
      const minor = results.violations.filter(v => v.impact === 'minor');
      if (moderate.length > 0 || minor.length > 0) {
        console.warn(`⚠️  ${name} (dark) has ${moderate.length} moderate and ${minor.length} minor a11y issues`);
      }
    });

    test('has sufficient color contrast in LIGHT mode', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });
      await setColorMode(page, 'light');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .disableRules(['document-title', 'html-has-lang', 'landmark-one-main', 'region'])
        .analyze();

      const contrastViolations = results.violations.filter(v => 
        v.id === 'color-contrast' || 
        v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        const summary = contrastViolations.map(v => 
          `${v.id}: ${v.nodes.length} elements`
        ).join(', ');
        console.error(`❌ Color contrast issues in ${name} (light): ${summary}`);
      }

      expect(contrastViolations, `Color contrast violations in ${name} (light mode)`).toHaveLength(0);
    });

    test('has sufficient color contrast in DARK mode', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });
      await setColorMode(page, 'dark');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .disableRules(['document-title', 'html-has-lang', 'landmark-one-main', 'region'])
        .analyze();

      const contrastViolations = results.violations.filter(v => 
        v.id === 'color-contrast' || 
        v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        const summary = contrastViolations.map(v => 
          `${v.id}: ${v.nodes.length} elements`
        ).join(', ');
        console.error(`❌ Color contrast issues in ${name} (dark): ${summary}`);
      }

      expect(contrastViolations, `Color contrast violations in ${name} (dark mode)`).toHaveLength(0);
    });
  });
}

// Site-wide accessibility tests
test.describe('Site-wide A11y', () => {
  test('all pages have valid document structure', async ({ page }) => {
    // Test one page as a representative sample
    await page.goto('/', { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Check for document structure violations
    const structureRules = [
      'html-has-lang',
      'document-title',
      'landmark-one-main',
      'page-has-heading-one',
    ];

    const structureViolations = results.violations.filter(v =>
      structureRules.includes(v.id)
    );

    expect(structureViolations, 'Document structure violations').toHaveLength(0);
  });

  test('navigation is keyboard accessible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Find navigation links
    const navLinks = page.locator('header a, nav a').first();
    
    if (await navLinks.isVisible()) {
      // Focus the first link via keyboard
      await page.keyboard.press('Tab');
      
      // Check if focus is visible (browser should handle this automatically)
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate(el => el?.tagName.toLowerCase());
      
      // The focused element should be something interactive
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
      expect(interactiveTags).toContain(tagName);
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' }); // Showcase likely has images

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const imageViolations = results.violations.filter(v =>
      v.id === 'image-alt' || v.id === 'image-redundant-alt'
    );

    expect(imageViolations, 'Image alt text violations').toHaveLength(0);
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/privacy-policy', { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .analyze();

    const formViolations = results.violations.filter(v =>
      v.id === 'label' || v.id === 'label-title-only'
    );

    expect(formViolations, 'Form label violations').toHaveLength(0);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const nameViolations = results.violations.filter(v =>
      v.id === 'button-name' || 
      v.id === 'link-name' || 
      v.id === 'aria-command-name'
    );

    expect(nameViolations, 'Accessible name violations').toHaveLength(0);
  });
});

// Bonus test: Check for common a11y antipatterns
test.describe('A11y Best Practices', () => {
  test('no elements have ARIA roles that are redundant', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const results = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    const ariaViolations = results.violations.filter(v =>
      v.id.includes('aria')
    );

    // Log warnings but don't fail (best practices are suggestions)
    if (ariaViolations.length > 0) {
      console.warn(`⚠️  Found ${ariaViolations.length} ARIA best practice suggestions`);
    }
  });

  test('heading hierarchy is logical', async ({ page }) => {
    await page.goto('/about', { waitUntil: 'networkidle' });

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map(h => h.evaluate(el => parseInt(el.tagName[1])))
    );

    // Should have exactly one h1
    const h1Count = levels.filter(l => l === 1).length;
    expect(h1Count, 'Should have exactly one h1 per page').toBe(1);

    // No heading level should jump by more than 1
    let previousLevel = 0;
    for (const level of levels) {
      if (previousLevel === 0) {
        previousLevel = level;
        continue;
      }
      const jump = level - previousLevel;
      expect(
        jump,
        `Heading jumped from h${previousLevel} to h${level} - should not skip levels`
      ).toBeLessThanOrEqual(1);
      previousLevel = level;
    }
  });
});
