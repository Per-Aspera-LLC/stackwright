import { test, expect, chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import path from 'path';
import fs from 'fs/promises';

/**
 * Runtime Performance Benchmarks
 * 
 * Measures Core Web Vitals and custom metrics:
 * 1. First Contentful Paint (FCP)
 * 2. Largest Contentful Paint (LCP)
 * 3. Time to Interactive (TTI)
 * 4. Cumulative Layout Shift (CLS)
 * 5. Total Blocking Time (TBT)
 * 6. React Hydration Time (custom)
 * 7. Theme Switch Performance (custom)
 * 
 * Baselines (established 2025-01-27):
 * - FCP: ~800ms
 * - LCP: ~1200ms
 * - TTI: ~2000ms
 * - Hydration: ~300ms
 * - Theme switch: ~50ms
 * 
 * Budgets:
 * - FCP: <1.5s (warn at 1.2s)
 * - LCP: <2.5s (warn at 2s)
 * - TTI: <3s (warn at 2.5s)
 * - Hydration: <500ms (warn at 300ms)
 * - Theme switch: <100ms (warn at 50ms)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface WebVitalsResult {
  fcp: number;
  lcp: number;
  tti: number;
  cls: number;
  tbt: number;
}

async function loadBudgets() {
  const budgetPath = path.join(__dirname, 'performance-budgets.json');
  const content = await fs.readFile(budgetPath, 'utf-8');
  return JSON.parse(content);
}

async function runLighthouse(url: string): Promise<WebVitalsResult> {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const port = new URL(browser.wsEndpoint()).port;
  
  try {
    const result = await lighthouse(url, {
      port: parseInt(port),
      output: 'json',
      onlyCategories: ['performance'],
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1280,
        height: 720,
        deviceScaleFactor: 1,
      },
    });

    if (!result) {
      throw new Error('Lighthouse failed to return results');
    }

    const audits = result.lhr.audits;
    
    return {
      fcp: audits['first-contentful-paint'].numericValue || 0,
      lcp: audits['largest-contentful-paint'].numericValue || 0,
      tti: audits['interactive'].numericValue || 0,
      cls: audits['cumulative-layout-shift'].numericValue || 0,
      tbt: audits['total-blocking-time'].numericValue || 0,
    };
  } finally {
    await browser.close();
  }
}

test.describe('Runtime Performance Benchmarks', () => {
  let budgets: any;

  test.beforeAll(async () => {
    budgets = await loadBudgets();
  });

  test('Core Web Vitals - Homepage', async () => {
    console.log('🔍 Running Lighthouse audit on homepage...');
    const vitals = await runLighthouse(`${BASE_URL}/`);
    
    const budget = budgets.runtime;
    
    console.log(`\n⚡ Core Web Vitals - Homepage:`);
    console.log(`  FCP: ${Math.round(vitals.fcp)}ms (budget: ${budget.fcp.max}ms)`);
    console.log(`  LCP: ${Math.round(vitals.lcp)}ms (budget: ${budget.lcp.max}ms)`);
    console.log(`  TTI: ${Math.round(vitals.tti)}ms (budget: ${budget.tti.max}ms)`);
    console.log(`  CLS: ${vitals.cls.toFixed(3)} (good: <0.1)`);
    console.log(`  TBT: ${Math.round(vitals.tbt)}ms (good: <200ms)`);
    
    // Validate FCP
    const fcpPassed = vitals.fcp <= budget.fcp.max;
    const fcpWarning = vitals.fcp > budget.fcp.warn;
    console.log(`  FCP Status: ${fcpPassed ? '✅ PASS' : '❌ FAIL'} ${fcpWarning ? '⚠️ WARNING' : ''}`);
    expect(vitals.fcp, `FCP is ${Math.round(vitals.fcp)}ms, budget is ${budget.fcp.max}ms`).toBeLessThanOrEqual(budget.fcp.max);
    
    // Validate LCP
    const lcpPassed = vitals.lcp <= budget.lcp.max;
    const lcpWarning = vitals.lcp > budget.lcp.warn;
    console.log(`  LCP Status: ${lcpPassed ? '✅ PASS' : '❌ FAIL'} ${lcpWarning ? '⚠️ WARNING' : ''}`);
    expect(vitals.lcp, `LCP is ${Math.round(vitals.lcp)}ms, budget is ${budget.lcp.max}ms`).toBeLessThanOrEqual(budget.lcp.max);
    
    // Validate TTI
    const ttiPassed = vitals.tti <= budget.tti.max;
    const ttiWarning = vitals.tti > budget.tti.warn;
    console.log(`  TTI Status: ${ttiPassed ? '✅ PASS' : '❌ FAIL'} ${ttiWarning ? '⚠️ WARNING' : ''}`);
    expect(vitals.tti, `TTI is ${Math.round(vitals.tti)}ms, budget is ${budget.tti.max}ms`).toBeLessThanOrEqual(budget.tti.max);
    
    // CLS should be good (< 0.1)
    expect(vitals.cls, `CLS is ${vitals.cls}, should be < 0.1`).toBeLessThan(0.1);
  });

  test('Core Web Vitals - Complex Page (Showcase)', async () => {
    console.log('🔍 Running Lighthouse audit on showcase page...');
    const vitals = await runLighthouse(`${BASE_URL}/showcase`);
    
    console.log(`\n⚡ Core Web Vitals - Showcase Page:`);
    console.log(`  FCP: ${Math.round(vitals.fcp)}ms`);
    console.log(`  LCP: ${Math.round(vitals.lcp)}ms`);
    console.log(`  TTI: ${Math.round(vitals.tti)}ms`);
    console.log(`  CLS: ${vitals.cls.toFixed(3)}`);
    
    // Showcase page may be slightly slower due to more content
    // Use same budgets but be more lenient
    const budget = budgets.runtime;
    const lcpBudget = budget.lcp.max * 1.5; // 50% more lenient for complex pages
    
    expect(vitals.fcp, `FCP on showcase should be reasonable`).toBeLessThan(budget.fcp.max * 1.5);
    expect(vitals.lcp, `LCP on showcase is ${Math.round(vitals.lcp)}ms, budget is ${Math.round(lcpBudget)}ms`).toBeLessThan(lcpBudget);
  });

  test('React Hydration Performance', async ({ page }) => {
    // Inject performance markers
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Measure time from navigation to hydration complete
    const hydrationTime = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        // Wait for React to hydrate
        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          const navStart = timing.navigationStart;
          const domInteractive = timing.domInteractive;
          const loadComplete = timing.loadEventEnd;
          
          // Estimate hydration as the time from domInteractive to loadEventEnd
          const hydration = loadComplete - domInteractive;
          resolve(hydration);
        } else {
          // Fallback: measure time until page is interactive
          const start = Date.now();
          const checkInterval = setInterval(() => {
            if (document.readyState === 'complete') {
              clearInterval(checkInterval);
              resolve(Date.now() - start);
            }
          }, 100);
        }
      });
    });
    
    const budget = budgets.runtime.hydration;
    const passed = hydrationTime <= budget.max;
    const warning = hydrationTime > budget.warn;
    
    console.log(`\n💧 React Hydration Performance:`);
    console.log(`  Time: ${Math.round(hydrationTime)}ms`);
    console.log(`  Budget: ${budget.max}ms (warn at ${budget.warn}ms)`);
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);
    
    expect(hydrationTime, `Hydration took ${Math.round(hydrationTime)}ms, budget is ${budget.max}ms`).toBeLessThanOrEqual(budget.max);
    
    if (warning) {
      console.warn(`⚠️ Warning: Hydration is slower than ${budget.warn}ms threshold`);
    }
  });

  test('Theme Switch Performance', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Find theme toggle button (might be in header, look for common patterns)
    // This is a placeholder - adjust selector based on actual implementation
    const themeButton = page.locator('button').filter({ hasText: /theme|dark|light/i }).first();
    
    // If no explicit button, try to find one in the header
    const headerButton = page.locator('header button, nav button').first();
    const toggleButton = await themeButton.count() > 0 ? themeButton : headerButton;
    
    if (await toggleButton.count() === 0) {
      console.log('⚠️ No theme toggle button found, skipping theme switch test');
      test.skip();
      return;
    }
    
    // Measure theme switch time by observing style changes
    const start = Date.now();
    await toggleButton.click();
    
    // Wait for theme change to propagate (check for body/html attribute or class changes)
    await page.waitForFunction(() => {
      // Theme switch is complete when CSS variables or classes have updated
      const body = document.body;
      const html = document.documentElement;
      return body.className !== '' || html.getAttribute('data-theme') !== null;
    }, { timeout: 1000 }).catch(() => {
      // If theme attributes aren't found, just wait a bit for visual changes
    });
    
    await page.waitForTimeout(50); // Allow any CSS transitions to start
    const switchTime = Date.now() - start;
    
    const budget = budgets.runtime.themeSwitch;
    const passed = switchTime <= budget.max;
    const warning = switchTime > budget.warn;
    
    console.log(`\n🎨 Theme Switch Performance:`);
    console.log(`  Time: ${Math.round(switchTime)}ms`);
    console.log(`  Budget: ${budget.max}ms (warn at ${budget.warn}ms)`);
    console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'} ${warning ? '⚠️ WARNING' : ''}`);
    
    expect(switchTime, `Theme switch took ${Math.round(switchTime)}ms, budget is ${budget.max}ms`).toBeLessThanOrEqual(budget.max);
  });

  test('Mobile Performance', async () => {
    console.log('🔍 Running Lighthouse audit on mobile...');
    
    // Run lighthouse with mobile settings
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const port = new URL(browser.wsEndpoint()).port;
    
    try {
      const result = await lighthouse(`${BASE_URL}/`, {
        port: parseInt(port),
        output: 'json',
        onlyCategories: ['performance'],
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      });

      if (!result) {
        throw new Error('Lighthouse failed to return results');
      }

      const audits = result.lhr.audits;
      const fcp = audits['first-contentful-paint'].numericValue || 0;
      const lcp = audits['largest-contentful-paint'].numericValue || 0;
      
      console.log(`\n📱 Mobile Performance:`);
      console.log(`  FCP: ${Math.round(fcp)}ms`);
      console.log(`  LCP: ${Math.round(lcp)}ms`);
      console.log(`  Performance Score: ${Math.round((result.lhr.categories.performance.score || 0) * 100)}/100`);
      
      // Mobile should still be reasonable (3G speeds assumed)
      expect(fcp, 'Mobile FCP should be < 3s').toBeLessThan(3000);
      expect(lcp, 'Mobile LCP should be < 4s').toBeLessThan(4000);
    } finally {
      await browser.close();
    }
  });
});
