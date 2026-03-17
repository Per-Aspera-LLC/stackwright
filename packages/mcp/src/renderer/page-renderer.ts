/**
 * Page renderer — headless visual rendering for Stackwright pages.
 *
 * Uses Playwright to screenshot pages from a running Next.js dev/prod server.
 * Designed to be used by MCP tools for AI agent visual feedback loops.
 */

import { chromium, Browser, Page } from 'playwright';

export interface RenderOptions {
  /** Base URL of the running Stackwright app (e.g. http://localhost:3000) */
  baseUrl: string;
  /** Page slug to render (e.g. "/" or "/about") */
  slug: string;
  /** Viewport dimensions */
  viewport?: { width: number; height: number };
  /** Capture full scrollable page vs just the viewport */
  fullPage?: boolean;
  /** Image format */
  format?: 'png' | 'jpeg';
  /** JPEG quality (1-100), only used when format is 'jpeg' */
  quality?: number;
  /** Timeout in ms for page load */
  timeout?: number;
}

export interface RenderResult {
  /** Base64-encoded image data */
  image: string;
  /** MIME type of the image */
  mimeType: 'image/png' | 'image/jpeg';
  /** Actual viewport used */
  viewport: { width: number; height: number };
  /** Time taken to render in milliseconds */
  renderTimeMs: number;
}

// Browser instance reuse — avoid cold-starting Chromium on every render
let browserInstance: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
let browserIdleTimer: ReturnType<typeof setTimeout> | null = null;
const BROWSER_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function getBrowser(): Promise<Browser> {
  // Reset idle timer on every use
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
    browserIdleTimer = null;
  }

  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  // Dedup concurrent launches — without this, two simultaneous renderPage()
  // calls would both see browserInstance === null, both call chromium.launch(),
  // and the first resolved browser gets orphaned.
  if (!launchPromise) {
    launchPromise = chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }).then((browser) => {
      browserInstance = browser;
      launchPromise = null;
      return browser;
    });
  }

  return launchPromise;
}

function scheduleBrowserClose(): void {
  if (browserIdleTimer) clearTimeout(browserIdleTimer);
  browserIdleTimer = setTimeout(async () => {
    if (browserInstance) {
      await browserInstance.close().catch(() => {});
      browserInstance = null;
    }
  }, BROWSER_IDLE_TIMEOUT_MS);
}

/**
 * Render a page to a screenshot.
 *
 * Requires a running Stackwright dev/prod server at the given baseUrl.
 * Reuses a Playwright browser instance across calls for performance.
 */
export async function renderPage(options: RenderOptions): Promise<RenderResult> {
  const {
    baseUrl,
    slug,
    viewport = { width: 1280, height: 720 },
    fullPage = true,
    format = 'png',
    quality,
    timeout = 30_000,
  } = options;

  const startTime = Date.now();
  const browser = await getBrowser();
  let page: Page | null = null;

  try {
    page = await browser.newPage();
    await page.setViewportSize(viewport);

    // Navigate to the page
    const url = new URL(slug.startsWith('/') ? slug : `/${slug}`, baseUrl).toString();
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    });

    if (!response || response.status() >= 400) {
      throw new Error(
        `Page returned HTTP ${response?.status() ?? 'no response'} for ${url}`
      );
    }

    // Wait a beat for any client-side hydration / animations to settle
    await page.waitForTimeout(500);

    // Take the screenshot
    const screenshotOptions: Parameters<Page['screenshot']>[0] = {
      fullPage,
      type: format,
    };
    if (format === 'jpeg' && quality != null) {
      screenshotOptions.quality = quality;
    }

    const buffer = await page.screenshot(screenshotOptions);
    const image = buffer.toString('base64');
    const renderTimeMs = Date.now() - startTime;

    return {
      image,
      mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      viewport,
      renderTimeMs,
    };
  } finally {
    if (page) await page.close().catch(() => {});
    scheduleBrowserClose();
  }
}

/**
 * Check if a server is reachable at the given URL.
 */
export async function probeServer(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(baseUrl, { signal: controller.signal });
    return res.ok || res.status === 404; // 404 is fine — server is running
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Shut down the cached browser instance. Call on process exit.
 */
export async function closeBrowser(): Promise<void> {
  if (browserIdleTimer) {
    clearTimeout(browserIdleTimer);
    browserIdleTimer = null;
  }
  launchPromise = null;
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
