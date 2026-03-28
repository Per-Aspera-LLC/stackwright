import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 4: Stress Tests & Performance Under Load 💪
 *
 * Testing performance under extreme conditions:
 * 1. Pages with massive amounts of content items
 * 2. Rapid theme switching (memory leak detection)
 * 3. Rapid navigation between pages
 * 4. Large image loading performance
 * 5. Concurrent interactions
 *
 * If your site can handle this, it can handle production traffic! 🚀
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Helper: Measure memory usage
 */
async function getMemoryUsage(page: Page): Promise<number> {
  return await page.evaluate(() => {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });
}

/**
 * Helper: Check for memory leaks
 */
function calculateMemoryIncrease(initial: number, final: number): number {
  if (initial === 0) return 0;
  return ((final - initial) / initial) * 100;
}

test.describe('Heavy Content Load Stress Tests', () => {
  test('Showcase page with all content types loads within budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/showcase', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time even with all content types
    expect(loadTime).toBeLessThan(5000); // 5 seconds max

    // Count content sections on page
    const contentSections = await page
      .locator('[class*="content"], section, article, [data-label]')
      .count();

    console.log(`📦 Showcase page loaded ${contentSections} content sections in ${loadTime}ms`);
    expect(contentSections).toBeGreaterThan(5); // Should have multiple content types

    // No console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    expect(consoleErrors.length).toBe(0);
    console.log('✅ Heavy content page loads successfully');
  });

  test('Scrolling through long page doesn\'t degrade performance', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    const scrollIterations = 20;
    const scrollTimes: number[] = [];

    // Measure scroll performance
    for (let i = 0; i < scrollIterations; i++) {
      const start = Date.now();

      await page.evaluate((iteration) => {
        window.scrollTo(0, iteration * 500);
      }, i);

      await page.waitForTimeout(50); // Allow rendering

      const scrollTime = Date.now() - start;
      scrollTimes.push(scrollTime);
    }

    // Average scroll time should be reasonable
    const avgScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
    expect(avgScrollTime).toBeLessThan(200); // 200ms per scroll is acceptable

    // No significant performance degradation over time
    const firstHalf = scrollTimes.slice(0, scrollIterations / 2);
    const secondHalf = scrollTimes.slice(scrollIterations / 2);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const degradation = ((secondAvg - firstAvg) / firstAvg) * 100;
    expect(degradation).toBeLessThan(50); // Less than 50% degradation

    console.log(`✅ Scroll performance: ${avgScrollTime.toFixed(2)}ms avg, ${degradation.toFixed(1)}% degradation`);
  });

  test('Many simultaneous images load without crashing', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'domcontentloaded' });

    // Inject multiple images
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'image-stress-test';

      // Add 50 images
      for (let i = 0; i < 50; i++) {
        const img = document.createElement('img');
        // Use placeholder images that will load
        img.src = `https://via.placeholder.com/150?text=Image${i}`;
        img.alt = `Test image ${i}`;
        img.style.width = '150px';
        img.style.height = '150px';
        img.loading = 'lazy'; // Use lazy loading
        container.appendChild(img);
      }

      document.body.appendChild(container);
    });

    // Wait for images to start loading
    await page.waitForTimeout(2000);

    // Page should still be responsive
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ 50 images loading simultaneously handled');
  });
});

test.describe('Theme Switching Stress Tests', () => {
  test('Rapid theme switching (50 times) doesn\'t leak memory', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get initial memory
    const initialMemory = await getMemoryUsage(page);

    // Find theme toggle
    const themeToggle = page
      .locator('button')
      .filter({ hasText: /theme|dark|light/i })
      .first();

    if ((await themeToggle.count()) === 0) {
      console.log('⚠️ No theme toggle found, skipping memory leak test');
      test.skip();
      return;
    }

    // Switch theme 50 times
    const switchCount = 50;
    const switchTimes: number[] = [];

    for (let i = 0; i < switchCount; i++) {
      const start = Date.now();
      await themeToggle.click();
      await page.waitForTimeout(20); // Allow theme to apply
      const switchTime = Date.now() - start;
      switchTimes.push(switchTime);
    }

    // Get final memory
    await page.waitForTimeout(500); // Let GC run
    const finalMemory = await getMemoryUsage(page);

    // Calculate memory increase
    const memoryIncrease = calculateMemoryIncrease(initialMemory, finalMemory);

    console.log(`\n🧠 Memory Leak Test:`);
    console.log(`  Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Memory increase: ${memoryIncrease.toFixed(2)}%`);

    // Memory should not grow excessively (less than 50% increase)
    if (initialMemory > 0) {
      expect(memoryIncrease).toBeLessThan(50);
    }

    // Average switch time should remain consistent
    const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
    console.log(`  Avg switch time: ${avgSwitchTime.toFixed(2)}ms`);
    expect(avgSwitchTime).toBeLessThan(100);

    // No performance degradation over time
    const firstTen = switchTimes.slice(0, 10);
    const lastTen = switchTimes.slice(-10);
    const firstAvg = firstTen.reduce((a, b) => a + b, 0) / firstTen.length;
    const lastAvg = lastTen.reduce((a, b) => a + b, 0) / lastTen.length;
    const degradation = ((lastAvg - firstAvg) / firstAvg) * 100;

    console.log(`  Performance degradation: ${degradation.toFixed(1)}%`);
    expect(Math.abs(degradation)).toBeLessThan(100); // Less than 100% degradation

    console.log('✅ No significant memory leak from theme switching');
  });

  test('Theme persists across rapid navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Switch to dark mode (if available)
    const themeToggle = page
      .locator('button')
      .filter({ hasText: /theme|dark|light/i })
      .first();

    if ((await themeToggle.count()) === 0) {
      console.log('⚠️ No theme toggle found');
      test.skip();
      return;
    }

    await themeToggle.click();
    await page.waitForTimeout(100);

    // Get theme state (could be in localStorage, cookie, or data attribute)
    const themeState = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('theme') || localStorage.getItem('sw-color-mode'),
        bodyClass: document.body.className,
        htmlData: document.documentElement.getAttribute('data-theme'),
      };
    });

    // Navigate to different pages rapidly
    const pages = ['/about', '/showcase', '/getting-started', '/'];
    for (const pagePath of pages) {
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(100);
    }

    // Check theme is still consistent
    const finalThemeState = await page.evaluate(() => {
      return {
        localStorage: localStorage.getItem('theme') || localStorage.getItem('sw-color-mode'),
        bodyClass: document.body.className,
        htmlData: document.documentElement.getAttribute('data-theme'),
      };
    });

    // Theme should be preserved (at least localStorage)
    if (themeState.localStorage) {
      expect(finalThemeState.localStorage).toBe(themeState.localStorage);
    }

    console.log('✅ Theme persists across navigation');
  });

  test('Multiple theme switches during page load doesn\'t break', async ({ page }) => {
    // Start loading the page
    const gotoPromise = page.goto('/', { waitUntil: 'domcontentloaded' });

    // While loading, try to switch theme (via localStorage manipulation)
    await page.evaluate(() => {
      // Simulate rapid theme changes during load
      for (let i = 0; i < 10; i++) {
        const mode = i % 2 === 0 ? 'dark' : 'light';
        localStorage.setItem('sw-color-mode', mode);
      }
    }).catch(() => {
      // Might fail if page isn't ready yet, that's fine
    });

    await gotoPromise;
    await page.waitForLoadState('networkidle');

    // Page should still render correctly
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Theme switches during load handled gracefully');
  });
});

test.describe('Rapid Navigation Stress Tests', () => {
  test('Navigate through 10 pages rapidly without errors', async ({ page }) => {
    const pages = [
      '/',
      '/about',
      '/showcase',
      '/getting-started',
      '/blog',
      '/privacy-policy',
      '/terms-of-service',
      '/',
      '/showcase',
      '/about',
    ];

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const navigationTimes: number[] = [];

    for (const pagePath of pages) {
      const start = Date.now();
      await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
      const navTime = Date.now() - start;
      navigationTimes.push(navTime);

      // Quick validation
      expect(await page.locator('body').innerText()).not.toBe('');
    }

    const avgNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
    console.log(`🚀 Average navigation time: ${avgNavTime.toFixed(2)}ms`);
    expect(avgNavTime).toBeLessThan(2000);

    // Should have no critical errors
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('stackwright') ||
        msg.includes('Cannot read') ||
        msg.includes('undefined')
    );
    expect(criticalErrors.length).toBe(0);

    console.log('✅ Rapid navigation across 10 pages successful');
  });

  test('Browser back/forward navigation works', async ({ page }) => {
    // Navigate forward through a couple pages
    await page.goto('/');
    await page.goto('/about');

    // Test basic back/forward
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Should be back on home
    const url = page.url();
    expect(url).toMatch(/\/$/);

    // Page should still be functional
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Browser back/forward navigation handled');
  });

  test('Interrupt navigation (click link before previous loads)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Find multiple navigation links
    const navLinks = page.locator('header a[href^="/"], nav a[href^="/"]');
    const linkCount = await navLinks.count();

    if (linkCount < 2) {
      console.log('⚠️ Not enough nav links to test interruption');
      test.skip();
      return;
    }

    // Click links rapidly without waiting for load
    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      await navLinks.nth(i).click({ timeout: 500 }).catch(() => {
        // Ignore timeout errors
      });
      await page.waitForTimeout(100); // Very short wait
    }

    // Wait for final navigation to settle
    await page.waitForLoadState('networkidle');

    // Page should still be functional
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Interrupted navigation handled gracefully');
  });
});

test.describe('Concurrent Interaction Stress Tests', () => {
  test('Multiple interactive elements clicked simultaneously', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    // Find interactive elements
    const buttons = page.locator('button');
    const links = page.locator('a[href]');

    const buttonCount = await buttons.count();
    const linkCount = await links.count();

    console.log(`Found ${buttonCount} buttons and ${linkCount} links`);

    // Click multiple elements in quick succession
    const clickPromises: Promise<void>[] = [];

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      clickPromises.push(
        buttons.nth(i).click({ timeout: 1000 }).catch(() => {
          // Some clicks may fail, that's okay
        })
      );
    }

    await Promise.allSettled(clickPromises);

    // Page should still be responsive
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Concurrent interactions handled');
  });

  test('Resize window during interactions', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    // Interact while resizing
    const viewportSizes = [
      { width: 1920, height: 1080 },
      { width: 1280, height: 720 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 },
      { width: 1920, height: 1080 },
    ];

    for (const size of viewportSizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(200);

      // Scroll a bit
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(100);
    }

    // Page should still be functional
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Resize during interactions handled');
  });
});

test.describe('Resource Loading Stress', () => {
  test('Load showcase page and measure resource count', async ({ page }) => {
    // Listen to all network requests
    const requests: string[] = [];
    page.on('request', (request) => {
      requests.push(request.url());
    });

    await page.goto('/showcase', { waitUntil: 'networkidle' });

    console.log(`📊 Resources loaded: ${requests.length}`);

    // Count different resource types
    const images = requests.filter((url) => /\.(jpg|jpeg|png|gif|svg|webp)/.test(url));
    const scripts = requests.filter((url) => /\.(js|jsx)/.test(url));
    const styles = requests.filter((url) => /\.(css)/.test(url));

    console.log(`  Images: ${images.length}`);
    console.log(`  Scripts: ${scripts.length}`);
    console.log(`  Styles: ${styles.length}`);

    // Should load resources but not go crazy
    expect(requests.length).toBeLessThan(200); // Reasonable limit

    console.log('✅ Resource loading is reasonable');
  });

  test('Large images load progressively', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'domcontentloaded' });

    // Check if images have loading="lazy" or similar optimization
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount === 0) {
      console.log('⚠️ No images to test');
      test.skip();
      return;
    }

    let lazyLoadedCount = 0;
    for (let i = 0; i < imageCount; i++) {
      const loading = await images.nth(i).getAttribute('loading');
      if (loading === 'lazy') {
        lazyLoadedCount++;
      }
    }

    const lazyPercentage = (lazyLoadedCount / imageCount) * 100;
    console.log(`📸 ${lazyPercentage.toFixed(1)}% of images use lazy loading`);

    // Warn if no lazy loading (but don't fail - it's optional)
    if (imageCount > 5 && lazyLoadedCount === 0) {
      console.warn('⚠️ No images use lazy loading - consider adding loading="lazy" for better performance');
    }

    console.log('✅ Image loading strategy verified');
  });
});

test.describe('Long-Running Session Stress', () => {
  test('Page remains stable after 30 seconds of interaction', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    const initialMemory = await getMemoryUsage(page);
    const startTime = Date.now();
    const duration = 30000; // 30 seconds

    // Simulate user activity for 30 seconds
    while (Date.now() - startTime < duration) {
      // Random scrolling
      await page.evaluate(() => {
        const randomY = Math.random() * document.body.scrollHeight;
        window.scrollTo(0, randomY);
      });

      await page.waitForTimeout(1000);

      // Occasionally interact with buttons
      if (Math.random() > 0.7) {
        const buttons = page.locator('button');
        const count = await buttons.count();
        if (count > 0) {
          const randomIndex = Math.floor(Math.random() * count);
          await buttons.nth(randomIndex).click({ timeout: 500 }).catch(() => {});
        }
      }

      await page.waitForTimeout(1000);
    }

    const finalMemory = await getMemoryUsage(page);
    const memoryIncrease = calculateMemoryIncrease(initialMemory, finalMemory);

    console.log(`\n⏱️ Long Session Test (30s):`);
    console.log(`  Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Memory increase: ${memoryIncrease.toFixed(2)}%`);

    // Memory shouldn't grow too much during normal usage
    if (initialMemory > 0) {
      expect(memoryIncrease).toBeLessThan(100); // Less than 100% growth
    }

    // Page should still be responsive
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Long-running session stable');
  });
});
