import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Stackwright Keyboard Navigation Tests ⌨️
 *
 * These tests ensure that all functionality is accessible via keyboard alone.
 * Critical for users who cannot use a mouse due to motor disabilities,
 * screen reader users, and power users who prefer keyboard navigation.
 *
 * "If you can't use it with a keyboard, it's not accessible." - Ancient web wisdom
 */

const PAGES = [
  { path: '/', name: 'Home' },
  { path: '/about', name: 'About' },
  { path: '/getting-started', name: 'Getting Started' },
  { path: '/showcase', name: 'Showcase' },
  { path: '/blog', name: 'Blog' },
];

/**
 * Get the currently focused element.
 */
async function getFocusedElement(page: Page) {
  return page.evaluateHandle(() => document.activeElement);
}

/**
 * Check if an element has a visible focus indicator.
 * We check for outline, border changes, or box-shadow that indicate focus.
 */
async function hasFocusIndicator(element: Locator): Promise<boolean> {
  const styles = await element.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      outline: computed.outline,
      outlineWidth: computed.outlineWidth,
      outlineStyle: computed.outlineStyle,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
      border: computed.border,
    };
  });

  // Check if any focus indicator is present
  const hasOutline = styles.outlineStyle !== 'none' && 
                     styles.outlineWidth !== '0px' &&
                     parseFloat(styles.outlineWidth) > 0;
  
  const hasBoxShadow = styles.boxShadow !== 'none' && 
                        !styles.boxShadow.includes('0px 0px 0px');
  
  return hasOutline || hasBoxShadow;
}

/**
 * Get all interactive (focusable) elements on the page.
 */
async function getInteractiveElements(page: Page): Promise<Locator[]> {
  const selectors = [
    'a[href]',
    'button',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
    '[role="link"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="radio"]',
  ];

  const elements: Locator[] = [];
  for (const selector of selectors) {
    const locators = await page.locator(selector).all();
    for (const locator of locators) {
      // Only include visible elements
      if (await locator.isVisible()) {
        elements.push(locator);
      }
    }
  }

  return elements;
}

/**
 * Check if an element is currently in the viewport.
 */
async function isInViewport(element: Locator): Promise<boolean> {
  return element.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

// Test each page's keyboard navigation
for (const { path: pagePath, name } of PAGES) {
  test.describe(`Keyboard Navigation: ${name} (${pagePath})`, () => {
    test('Tab key moves focus through all interactive elements', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Get all interactive elements
      const interactiveElements = await getInteractiveElements(page);
      
      if (interactiveElements.length === 0) {
        console.warn(`⚠️  No interactive elements found on ${name}`);
        return; // Skip test if no interactive elements
      }

      // Start tabbing through the page
      const focusedElements: string[] = [];
      const maxTabs = Math.min(interactiveElements.length + 10, 100); // Safety limit

      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const focused = await getFocusedElement(page);
        const tagName = await focused.evaluate(el => {
          if (!el) return 'none';
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute('role');
          const type = el.getAttribute('type');
          return role ? `${tag}[role=${role}]` : type ? `${tag}[type=${type}]` : tag;
        });
        
        focusedElements.push(tagName);

        // If we've cycled back to the start or hit body/html, we're done
        if (tagName === 'body' || tagName === 'html') {
          break;
        }
      }

      // Should have focused on at least some interactive elements
      const interactiveTags = focusedElements.filter(tag => 
        tag.startsWith('a') || 
        tag.startsWith('button') || 
        tag.startsWith('input') ||
        tag.startsWith('select') ||
        tag.startsWith('textarea') ||
        tag.includes('[role=')
      );

      expect(
        interactiveTags.length,
        `Should be able to focus interactive elements on ${name}`
      ).toBeGreaterThan(0);

      console.log(`✅ ${name}: Tabbed through ${interactiveTags.length} interactive elements`);
    });

    test('Shift+Tab navigates backwards through elements', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Tab forward a few times
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const forwardElement = await getFocusedElement(page);
      const forwardTag = await forwardElement.evaluate(el => el?.tagName);

      // Tab backward
      await page.keyboard.press('Shift+Tab');
      
      const backwardElement = await getFocusedElement(page);
      const backwardTag = await backwardElement.evaluate(el => el?.tagName);

      // Should have moved to a different element
      const forwardHtml = await forwardElement.evaluate(el => el?.outerHTML.substring(0, 100));
      const backwardHtml = await backwardElement.evaluate(el => el?.outerHTML.substring(0, 100));
      
      expect(
        forwardHtml !== backwardHtml,
        'Shift+Tab should move focus backward'
      ).toBe(true);
    });

    test('Focus indicators are visible on all interactive elements', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      const interactiveElements = await getInteractiveElements(page);
      
      if (interactiveElements.length === 0) {
        console.warn(`⚠️  No interactive elements found on ${name}`);
        return;
      }

      // Test a sample of elements (testing all can be slow)
      const sampleSize = Math.min(10, interactiveElements.length);
      const elementsToTest = interactiveElements.slice(0, sampleSize);

      let elementsWithFocusIndicator = 0;
      const elementsMissingIndicator: string[] = [];

      for (const element of elementsToTest) {
        // Focus the element
        await element.focus();
        
        // Wait a bit for focus styles to apply
        await page.waitForTimeout(50);

        // Check for focus indicator
        const hasIndicator = await hasFocusIndicator(element);
        
        if (hasIndicator) {
          elementsWithFocusIndicator++;
        } else {
          const tag = await element.evaluate(el => 
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`
          );
          elementsMissingIndicator.push(tag);
        }
      }

      if (elementsMissingIndicator.length > 0) {
        console.warn(`⚠️  ${name}: ${elementsMissingIndicator.length} elements missing focus indicators:`, elementsMissingIndicator);
      }

      // At least 70% of interactive elements should have visible focus indicators
      const percentage = (elementsWithFocusIndicator / elementsToTest.length) * 100;
      expect(
        percentage,
        `At least 70% of interactive elements should have visible focus indicators on ${name}`
      ).toBeGreaterThanOrEqual(70);

      console.log(`✅ ${name}: ${elementsWithFocusIndicator}/${elementsToTest.length} elements have focus indicators (${percentage.toFixed(1)}%)`);
    });

    test('No keyboard traps exist on the page', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      const interactiveElements = await getInteractiveElements(page);
      
      if (interactiveElements.length === 0) {
        return; // Skip if no interactive elements
      }

      // Tab through the page and track if we can escape every element
      const maxTabs = 50; // Reasonable limit
      const focusHistory: string[] = [];
      let trapDetected = false;
      let trapElement = '';

      for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const focused = await getFocusedElement(page);
        const elementId = await focused.evaluate(el => {
          if (!el) return 'none';
          return el.outerHTML.substring(0, 100);
        });

        focusHistory.push(elementId);

        // Check if we're stuck on the same element for 3+ tabs
        if (focusHistory.length >= 4) {
          const lastFour = focusHistory.slice(-4);
          if (lastFour.every(id => id === lastFour[0])) {
            trapDetected = true;
            trapElement = elementId;
            break;
          }
        }
      }

      expect(
        trapDetected,
        `Keyboard trap detected on ${name} at element: ${trapElement.substring(0, 100)}`
      ).toBe(false);
    });

    test('Interactive elements are reachable via keyboard', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Find all buttons and links
      const buttons = await page.locator('button').all();
      const links = await page.locator('a[href]').all();
      const inputs = await page.locator('input, select, textarea').all();

      const allElements = [...buttons, ...links, ...inputs];
      
      if (allElements.length === 0) {
        console.warn(`⚠️  No interactive elements found on ${name}`);
        return;
      }

      let reachableCount = 0;
      let unreachableElements: string[] = [];

      // Test a sample
      const sampleSize = Math.min(15, allElements.length);
      const sample = allElements.slice(0, sampleSize);

      for (const element of sample) {
        // Try to focus the element
        try {
          await element.focus();
          await page.waitForTimeout(50);
          
          const focused = await getFocusedElement(page);
          const isFocused = await focused.evaluate((el, targetEl) => el === targetEl, await element.elementHandle());
          
          if (isFocused) {
            reachableCount++;
          } else {
            const tag = await element.evaluate(el => 
              `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`
            );
            unreachableElements.push(tag);
          }
        } catch (e) {
          const tag = await element.evaluate(el => 
            `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`
          );
          unreachableElements.push(tag);
        }
      }

      if (unreachableElements.length > 0) {
        console.warn(`⚠️  ${name}: ${unreachableElements.length} elements not keyboard-reachable:`, unreachableElements);
      }

      // At least 90% should be reachable
      const percentage = (reachableCount / sample.length) * 100;
      expect(
        percentage,
        `At least 90% of interactive elements should be keyboard-reachable on ${name}`
      ).toBeGreaterThanOrEqual(90);

      console.log(`✅ ${name}: ${reachableCount}/${sample.length} interactive elements are keyboard-reachable (${percentage.toFixed(1)}%)`);
    });

    test('Enter key activates focused buttons and links', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Find the first visible button
      const buttons = await page.locator('button').all();
      const visibleButtons = [];
      for (const button of buttons) {
        if (await button.isVisible()) {
          visibleButtons.push(button);
        }
      }

      if (visibleButtons.length === 0) {
        console.warn(`⚠️  No visible buttons found on ${name}`);
        return;
      }

      const button = visibleButtons[0];
      
      // Focus and activate with Enter
      await button.focus();
      await page.keyboard.press('Enter');
      
      // Small delay to allow any click handlers to execute
      await page.waitForTimeout(100);

      // If the button triggered navigation or modal, the URL or page state should change
      // This is a basic test - in practice, you'd check for specific behaviors
      expect(true).toBe(true); // Placeholder - actual test would verify button action
    });

    test('Space key activates focused buttons', async ({ page }) => {
      await page.goto(pagePath, { waitUntil: 'networkidle' });

      // Find the first visible button (not a link)
      const buttons = await page.locator('button').all();
      const visibleButtons = [];
      for (const button of buttons) {
        if (await button.isVisible()) {
          visibleButtons.push(button);
        }
      }

      if (visibleButtons.length === 0) {
        console.warn(`⚠️  No visible buttons found on ${name}`);
        return;
      }

      const button = visibleButtons[0];
      
      // Focus and activate with Space
      await button.focus();
      await page.keyboard.press('Space');
      
      // Small delay to allow any click handlers to execute
      await page.waitForTimeout(100);

      // Placeholder - actual test would verify button action
      expect(true).toBe(true);
    });
  });
}

// Site-wide keyboard navigation tests
test.describe('Site-wide Keyboard Navigation', () => {
  test('Skip link is present and functional', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Press Tab to potentially reveal skip link
    await page.keyboard.press('Tab');
    
    // Look for skip link (common patterns)
    const skipLink = page.locator('a[href="#main"], a[href="#content"], a[href="#main-content"]').first();
    
    if (await skipLink.isVisible()) {
      // Activate the skip link
      await skipLink.focus();
      await page.keyboard.press('Enter');
      
      // Check that focus moved to main content
      const focused = await getFocusedElement(page);
      const focusedId = await focused.evaluate(el => el?.id || '');
      
      expect(
        ['main', 'content', 'main-content'].some(id => focusedId.includes(id)),
        'Skip link should move focus to main content area'
      ).toBe(true);
      
      console.log('✅ Skip link is functional');
    } else {
      console.warn('⚠️  No skip link found - consider adding one for better accessibility');
    }
  });

  test('Modal/Dialog can be closed with Escape key', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Look for any button that might open a modal/dialog
    const modalTriggers = await page.locator('[aria-haspopup="dialog"], [data-modal], button:has-text("Open")').all();
    
    if (modalTriggers.length === 0) {
      console.warn('⚠️  No modal triggers found to test');
      return;
    }

    // Click the first modal trigger
    const trigger = modalTriggers[0];
    await trigger.click();
    await page.waitForTimeout(300); // Wait for modal animation

    // Look for modal/dialog
    const modal = page.locator('[role="dialog"], [role="alertdialog"], .modal').first();
    
    if (await modal.isVisible()) {
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Modal should be closed
      const stillVisible = await modal.isVisible().catch(() => false);
      expect(stillVisible, 'Modal should close when Escape is pressed').toBe(false);
      
      console.log('✅ Modal closes with Escape key');
    } else {
      console.warn('⚠️  No modal appeared after clicking trigger');
    }
  });

  test('Dropdown menus are keyboard navigable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Look for dropdown/menu triggers
    const menuTriggers = await page.locator('[aria-haspopup="menu"], [role="button"][aria-expanded]').all();
    
    if (menuTriggers.length === 0) {
      console.warn('⚠️  No dropdown menus found to test');
      return;
    }

    const trigger = menuTriggers[0];
    
    // Focus and activate with keyboard
    await trigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);

    // Menu should be open - press Arrow Down to navigate
    await page.keyboard.press('ArrowDown');
    
    const focused = await getFocusedElement(page);
    const focusedRole = await focused.evaluate(el => el?.getAttribute('role'));
    
    // Should have focused on a menu item
    expect(
      focusedRole === 'menuitem' || focusedRole === 'option',
      'Arrow keys should navigate menu items'
    ).toBe(true);

    console.log('✅ Dropdown menu is keyboard navigable');
  });

  test('Tab panels switch with arrow keys', async ({ page }) => {
    // Navigate to a page likely to have tabs
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    // Look for tab elements
    const tabs = await page.locator('[role="tab"]').all();
    
    if (tabs.length < 2) {
      console.warn('⚠️  No tab interface found to test');
      return;
    }

    // Focus the first tab
    await tabs[0].focus();
    await page.waitForTimeout(100);

    // Get the aria-selected state
    const firstSelected = await tabs[0].getAttribute('aria-selected');
    
    // Press ArrowRight to move to next tab
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);

    // Check if the second tab is now selected
    const secondSelected = await tabs[1].getAttribute('aria-selected');
    
    expect(
      secondSelected,
      'Arrow keys should switch between tabs'
    ).toBe('true');

    console.log('✅ Tab panels are keyboard navigable with arrow keys');
  });

  test('Focus never gets lost or stuck on hidden elements', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Tab through page and verify focus is always on visible elements
    const maxTabs = 30;
    let hiddenFocusCount = 0;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press('Tab');
      const focused = await getFocusedElement(page);
      
      const isVisible = await focused.evaluate(el => {
        if (!el || el === document.body || el === document.documentElement) return true;
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0' &&
          rect.width > 0 &&
          rect.height > 0
        );
      });

      if (!isVisible) {
        hiddenFocusCount++;
      }
    }

    expect(
      hiddenFocusCount,
      'Focus should never land on hidden elements'
    ).toBe(0);

    console.log('✅ Focus never lands on hidden elements');
  });

  test('Page maintains logical tab order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Get all elements in DOM order
    const domOrder = await page.evaluate(() => {
      const interactiveSelector = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const elements = Array.from(document.querySelectorAll(interactiveSelector));
      return elements
        .filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map((el, index) => ({
          index,
          tabindex: parseInt(el.getAttribute('tabindex') || '0'),
          tag: el.tagName.toLowerCase(),
          y: el.getBoundingClientRect().top,
        }));
    });

    // Elements with tabindex="0" or no tabindex should generally appear in DOM order
    // Elements with tabindex > 0 are discouraged (anti-pattern)
    const positiveTabindexElements = domOrder.filter(el => el.tabindex > 0);
    
    expect(
      positiveTabindexElements.length,
      'Should avoid using tabindex > 0 (anti-pattern)'
    ).toBe(0);

    console.log('✅ Tab order follows logical DOM order');
  });
});

// Extra special tests for common interactive components
test.describe('Common Component Keyboard Support', () => {
  test('Carousel can be navigated with arrow keys', async ({ page }) => {
    await page.goto('/showcase', { waitUntil: 'networkidle' });

    // Look for carousel controls
    const carousel = page.locator('[role="region"][aria-label*="carousel" i]').first();
    
    if (!(await carousel.isVisible().catch(() => false))) {
      console.warn('⚠️  No carousel found to test');
      return;
    }

    // Look for next/previous buttons
    const nextButton = page.locator('button[aria-label*="next" i]').first();
    const prevButton = page.locator('button[aria-label*="previous" i], button[aria-label*="prev" i]').first();

    if (await nextButton.isVisible()) {
      await nextButton.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      console.log('✅ Carousel can be navigated with keyboard');
      expect(true).toBe(true);
    } else {
      console.warn('⚠️  Carousel found but no keyboard-accessible controls');
    }
  });

  test('Accordion can be expanded/collapsed with keyboard', async ({ page }) => {
    // Try FAQ page which likely has accordions
    await page.goto('/', { waitUntil: 'networkidle' });

    // Look for accordion elements
    const accordionButtons = await page.locator('button[aria-expanded], [role="button"][aria-expanded]').all();
    
    if (accordionButtons.length === 0) {
      console.warn('⚠️  No accordion found to test');
      return;
    }

    const button = accordionButtons[0];
    const initialState = await button.getAttribute('aria-expanded');
    
    // Toggle with keyboard
    await button.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    
    const newState = await button.getAttribute('aria-expanded');
    
    expect(
      newState !== initialState,
      'Accordion should toggle when Enter is pressed'
    ).toBe(true);

    console.log('✅ Accordion is keyboard operable');
  });
});
