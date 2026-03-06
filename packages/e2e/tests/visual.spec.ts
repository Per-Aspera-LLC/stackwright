import { test, expect } from "@playwright/test";

/**
 * Visual regression tests for Stackwright content types.
 *
 * Uses Playwright's built-in toHaveScreenshot() to compare against committed
 * baseline screenshots. The /showcase page demonstrates all 13 content types,
 * each wrapped in a [data-content-type] element for reliable targeting.
 *
 * Run with --update-snapshots to regenerate baselines:
 *   pnpm test:e2e --update-snapshots
 */

/** Content type sections on the /showcase page, identified by data-label. */
const CONTENT_TYPE_SECTIONS = [
  { label: "main-demo", name: "main" },
  { label: "carousel-demo", name: "carousel" },
  { label: "timeline-demo", name: "timeline" },
  { label: "icon-grid-demo", name: "icon_grid" },
  { label: "tabbed-content-demo", name: "tabbed_content" },
  { label: "code-block-yaml-demo", name: "code_block" },
  { label: "feature-list-demo", name: "feature_list" },
  { label: "testimonial-grid-demo", name: "testimonial_grid" },
  { label: "faq-demo", name: "faq" },
  { label: "pricing-table-demo", name: "pricing_table" },
  { label: "alert-info-demo", name: "alert" },
  { label: "contact-form-stub-demo", name: "contact_form_stub" },
];

test.describe("Visual regression — desktop (1280x720)", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("home page full layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot("home-desktop.png", {
      fullPage: true,
    });
  });

  test.describe("showcase content types", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/showcase", { waitUntil: "networkidle" });
    });

    for (const { label, name } of CONTENT_TYPE_SECTIONS) {
      test(`${name}`, async ({ page }) => {
        const section = page.locator(`[data-label="${label}"]`);
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveScreenshot(`${name}-desktop.png`);
      });
    }
  });
});

test.describe("Visual regression — mobile (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("home page full layout", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page).toHaveScreenshot("home-mobile.png", {
      fullPage: true,
    });
  });

  test.describe("showcase content types", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/showcase", { waitUntil: "networkidle" });
    });

    for (const { label, name } of CONTENT_TYPE_SECTIONS) {
      test(`${name}`, async ({ page }) => {
        const section = page.locator(`[data-label="${label}"]`);
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveScreenshot(`${name}-mobile.png`);
      });
    }
  });
});
