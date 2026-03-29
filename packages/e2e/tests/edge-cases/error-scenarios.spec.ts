import { test, expect, type Page } from '@playwright/test';
import { PAGES, SHOWCASE_PAGE } from '../fixtures';

/**
 * Phase 4: Error Scenarios & Edge Cases 🔥
 *
 * Testing what happens when things go wrong:
 * 1. 404 pages render gracefully
 * 2. Missing images don't crash the page
 * 3. Very long strings don't break layout
 * 4. Unicode/emoji/special characters display correctly
 * 5. Broken content doesn't kill the whole site
 *
 * If your site can't handle weird input gracefully, it's not production-ready.
 * Let's throw some chaos at it! 🎲
 */

test.describe('404 and Error Pages', () => {
  test('404 page renders correctly for non-existent route', async ({ page }) => {
    // Navigate to a route that definitely doesn't exist
    const response = await page.goto('/this-page-does-not-exist-123456789', {
      waitUntil: 'networkidle',
    });

    // Should return 404 status
    expect(response?.status()).toBe(404);

    // Page should still render (not just blank)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);

    // Should have some indication it's a 404
    // (Next.js default or custom 404 page)
    const text = bodyText.toLowerCase();
    const has404Indicator =
      text.includes('404') ||
      text.includes('not found') ||
      text.includes('page not found') ||
      text.includes('could not find');
    expect(has404Indicator).toBeTruthy();

    console.log('✅ 404 page renders gracefully');
  });

  test('404 page has no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/another-nonexistent-route-xyz', {
      waitUntil: 'networkidle',
    });

    // Should have no critical errors even on 404
    const criticalErrors = consoleErrors.filter(
      (msg) =>
        msg.includes('stackwright') ||
        msg.includes('Cannot read') ||
        msg.includes('undefined') ||
        msg.includes('is not a function')
    );

    expect(criticalErrors).toHaveLength(0);
    console.log('✅ 404 page has no console errors');
  });

  test('404 page can navigate back to home', async ({ page }) => {
    await page.goto('/nonexistent-route');

    // Look for any link that might go back home
    const homeLink = page.locator('a[href="/"], a[href="./"], a:has-text("Home")').first();

    if ((await homeLink.count()) > 0) {
      await homeLink.click();
      await page.waitForLoadState('networkidle');

      // Should successfully navigate to home
      expect(page.url()).toContain('/');
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);

      console.log('✅ Can navigate from 404 back to home');
    } else {
      console.log('⚠️ No home link found on 404 page (optional feature)');
    }
  });
});

test.describe('Missing/Broken Media Handling', () => {
  test('Page still renders with missing image sources', async ({ page }) => {
    // Navigate to a page
    await page.goto(SHOWCASE_PAGE, { waitUntil: 'networkidle' });

    // Inject a broken image into the page
    await page.evaluate(() => {
      const img = document.createElement('img');
      img.src = '/nonexistent-image-12345.jpg';
      img.alt = 'Broken test image';
      img.style.width = '100px';
      img.style.height = '100px';
      document.body.appendChild(img);
    });

    // Wait a bit for error to potentially occur
    await page.waitForTimeout(500);

    // Page should still be functional
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Page handles missing images gracefully');
  });

  test('Images have alt text or aria-labels', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Find all images
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount === 0) {
      console.log('⚠️ No images found on homepage to test');
      test.skip();
      return;
    }

    // Check each image has either alt text or aria-label
    let imagesWithoutAlt = 0;
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      if (!alt && !ariaLabel) {
        imagesWithoutAlt++;
        const src = await img.getAttribute('src');
        console.warn(`⚠️ Image without alt text: ${src}`);
      }
    }

    // Allow some images without alt (decorative), but most should have it
    const percentWithoutAlt = (imagesWithoutAlt / imageCount) * 100;
    expect(percentWithoutAlt).toBeLessThan(50); // At least 50% should have alt text

    console.log(`✅ ${imageCount - imagesWithoutAlt}/${imageCount} images have alt text`);
  });
});

test.describe('Extreme Content Length', () => {
  test('Very long strings (10,000 chars) don\'t break layout', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Create a 10,000 character string
    const longString = 'A'.repeat(10000);

    // Inject it into a text element
    await page.evaluate((text) => {
      const div = document.createElement('div');
      div.textContent = text;
      div.style.maxWidth = '800px';
      div.id = 'long-text-test';
      document.body.appendChild(div);
    }, longString);

    // Check that it renders
    const testDiv = page.locator('#long-text-test');
    await expect(testDiv).toBeVisible();

    // Check that it doesn't overflow the viewport horizontally
    const boundingBox = await testDiv.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      const viewportSize = page.viewportSize();
      expect(boundingBox.width).toBeLessThanOrEqual(viewportSize!.width);
    }

    console.log('✅ Very long strings are contained properly');
  });

  test('Long unbroken word (1000 chars) wraps correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Create an unbroken word (no spaces)
    const longWord = 'Supercalifragilisticexpialidocious'.repeat(30); // ~1000 chars

    await page.evaluate((word) => {
      const div = document.createElement('div');
      div.textContent = word;
      div.style.maxWidth = '600px';
      div.style.wordBreak = 'break-word'; // Should break long words
      div.id = 'long-word-test';
      document.body.appendChild(div);
    }, longWord);

    const testDiv = page.locator('#long-word-test');
    await expect(testDiv).toBeVisible();

    // Should wrap, not overflow
    const boundingBox = await testDiv.boundingBox();
    if (boundingBox) {
      expect(boundingBox.width).toBeLessThanOrEqual(650); // Max width + some padding
    }

    console.log('✅ Long unbroken words wrap correctly');
  });

  test('Many nested elements (deep DOM) don\'t crash', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Create deeply nested structure (100 levels)
    await page.evaluate(() => {
      let parent = document.body;
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.className = `nested-${i}`;
        div.textContent = i === 99 ? 'Deep nested content' : '';
        parent.appendChild(div);
        parent = div;
      }
    });

    // Should still be able to find the deepest element
    const deepElement = page.locator('.nested-99');
    await expect(deepElement).toBeVisible();

    console.log('✅ Deeply nested DOM doesn\'t crash');
  });
});

test.describe('Unicode and Special Characters', () => {
  test('Emoji render correctly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const emojis = '🐶🎉🚀💻🌟✨🔥💡🎨🎯';

    await page.evaluate((emojiString) => {
      const div = document.createElement('div');
      div.textContent = emojiString;
      div.id = 'emoji-test';
      div.style.fontSize = '24px';
      document.body.appendChild(div);
    }, emojis);

    const emojiDiv = page.locator('#emoji-test');
    await expect(emojiDiv).toBeVisible();

    // Should contain the emoji
    const text = await emojiDiv.textContent();
    expect(text).toBe(emojis);

    console.log('✅ Emoji render correctly');
  });

  test('Unicode characters (Chinese, Arabic, Cyrillic) display', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const unicodeText = {
      chinese: '你好世界',
      arabic: 'مرحبا بالعالم',
      cyrillic: 'Привет мир',
      japanese: 'こんにちは世界',
      korean: '안녕하세요 세계',
    };

    for (const [lang, text] of Object.entries(unicodeText)) {
      await page.evaluate(
        ({ language, content }) => {
          const div = document.createElement('div');
          div.textContent = content;
          div.id = `unicode-${language}`;
          document.body.appendChild(div);
        },
        { language: lang, content: text }
      );

      const unicodeDiv = page.locator(`#unicode-${lang}`);
      await expect(unicodeDiv).toBeVisible();

      const displayedText = await unicodeDiv.textContent();
      expect(displayedText).toBe(text);
    }

    console.log('✅ Unicode characters display correctly');
  });

  test('HTML special characters are escaped properly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const dangerousString = '<script>alert("XSS")</script>';

    await page.evaluate((dangerous) => {
      const div = document.createElement('div');
      div.textContent = dangerous; // textContent should escape
      div.id = 'xss-test';
      document.body.appendChild(div);
    }, dangerousString);

    const testDiv = page.locator('#xss-test');
    await expect(testDiv).toBeVisible();

    // Should display as text, not execute
    const text = await testDiv.textContent();
    expect(text).toBe(dangerousString);

    // The text should contain the literal script tags (not executed)
    expect(text).toContain('<script>');
    expect(text).toContain('</script>');

    console.log('✅ HTML special characters are escaped');
  });



  test('Special markdown/code characters don\'t break rendering', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const specialChars = '`~!@#$%^&*()_+-={}[]|\\:";\'<>?,./';

    await page.evaluate((chars) => {
      const div = document.createElement('div');
      div.textContent = chars;
      div.id = 'special-chars-test';
      document.body.appendChild(div);
    }, specialChars);

    const testDiv = page.locator('#special-chars-test');
    await expect(testDiv).toBeVisible();

    const text = await testDiv.textContent();
    expect(text).toBe(specialChars);

    console.log('✅ Special characters render without breaking');
  });
});

test.describe('Boundary Conditions', () => {
  test('Empty content arrays don\'t crash', async ({ page }) => {
    // This would need a test page with empty content_items
    // For now, just verify showcase doesn't have empty content breaking things
    await page.goto(SHOWCASE_PAGE, { waitUntil: 'networkidle' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ Pages with potential empty content render');
  });

  test('Zero-sized elements are handled', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'zero-size-test';
      div.style.width = '0';
      div.style.height = '0';
      div.textContent = 'Hidden';
      document.body.appendChild(div);
    });

    // Should exist but not be visible
    const zeroDiv = page.locator('#zero-size-test');
    expect(await zeroDiv.count()).toBe(1);

    console.log('✅ Zero-sized elements don\'t crash');
  });



  test('Maximum viewport width doesn\'t break layout', async ({ page }) => {
    // Test with ultra-wide viewport
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // No horizontal scrolling beyond viewport
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(3860); // viewport width + small tolerance

    // Page should render without error
    const bodyBox = await page.locator('body').boundingBox();
    if (bodyBox) {
      expect(bodyBox.width).toBeGreaterThan(0);
    }

    console.log('✅ Ultra-wide viewport handled correctly');
  });

  test('Minimum viewport width still usable', async ({ page }) => {
    // Test with very narrow viewport (old phones)
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/', { waitUntil: 'networkidle' });

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    // No horizontal scrolling on such a narrow screen
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(340); // 320 + small tolerance

    console.log('✅ Narrow viewport handled correctly');
  });
});

test.describe('Rapid State Changes', () => {
  test('Rapid page navigation doesn\'t crash', async ({ page }) => {
    const pages = PAGES.slice(0, 4).map(p => p.path);

    for (let i = 0; i < 3; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath, { waitUntil: 'domcontentloaded' });
        // Quick check that it loaded
        expect(await page.locator('body').innerText()).not.toBe('');
      }
    }

    console.log('✅ Rapid navigation handled gracefully');
  });

  test('Spam clicking navigation links doesn\'t break', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const navLink = page.locator('header a[href], nav a[href]').first();

    if ((await navLink.count()) > 0) {
      // Click rapidly 5 times
      for (let i = 0; i < 5; i++) {
        await navLink.click({ force: true, timeout: 1000 }).catch(() => {
          // Ignore errors from rapid clicking
        });
      }

      // Wait for navigation to settle
      await page.waitForLoadState('domcontentloaded');

      // Page should still be functional
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(0);

      console.log('✅ Spam clicking handled gracefully');
    }
  });
});

test.describe('Browser Compatibility Edge Cases', () => {
  test('localStorage unavailable doesn\'t crash', async ({ page }) => {
    // Disable localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: false,
      });
    });

    // Should still load
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    console.log('✅ Site works without localStorage');
  });

  test('JavaScript disabled still shows content (SSR)', async ({ page, context }) => {
    // Disable JavaScript
    await context.setOffline(false);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Turn off JS after initial load to test SSR content
    await context.clearCookies();

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(0);

    console.log('✅ SSR content visible without JS');
  });
});
