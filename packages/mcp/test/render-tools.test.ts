import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock playwright before importing modules that use it
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import { probeServer, closeBrowser } from '../src/renderer/page-renderer';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('probeServer', () => {
  it('returns false for unreachable server', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    const result = await probeServer('http://localhost:19999');
    expect(result).toBe(false);
  });

  it('returns true for reachable server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as Response);
    const result = await probeServer('http://localhost:3000');
    expect(result).toBe(true);
  });

  it('returns true for 404 (server is running but page not found)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response);
    const result = await probeServer('http://localhost:3000');
    expect(result).toBe(true);
  });
});

describe('closeBrowser', () => {
  it('can be called safely when no browser is open', async () => {
    await expect(closeBrowser()).resolves.not.toThrow();
  });
});

describe('getBrowser() rejection recovery (swp-nqqp)', () => {
  it('retries after a rejected launch rather than caching the rejection', async () => {
    const { chromium } = await import('playwright');

    const launchError = new Error('Chromium binary not found — run npx playwright install');
    const screenshotBuffer = Buffer.from('fake-png');
    const mockPage = {
      setViewportSize: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      close: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn(),
      screenshot: vi.fn().mockResolvedValue(screenshotBuffer),
    };
    const mockBrowser = {
      isConnected: vi.fn().mockReturnValue(false),
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // First launch rejects, second resolves
    vi.mocked(chromium.launch)
      .mockRejectedValueOnce(launchError)
      .mockResolvedValueOnce(mockBrowser as any);

    // Start clean
    await closeBrowser();

    const { renderPage } = await import('../src/renderer/page-renderer');

    // First call must reject with the original error
    await expect(renderPage({ baseUrl: 'http://localhost:3000', slug: '/' })).rejects.toThrow(
      'Chromium binary not found'
    );

    // Second call must retry fresh — without the fix this returns the cached rejection
    const result = await renderPage({ baseUrl: 'http://localhost:3000', slug: '/' });
    expect(result.image).toBe(screenshotBuffer.toString('base64'));
  });
});

describe('renderPage', () => {
  it('throws when server returns error status', async () => {
    const { chromium } = await import('playwright');
    const mockPage = {
      setViewportSize: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 500 }),
      close: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn(),
      screenshot: vi.fn(),
    };
    const mockBrowser = {
      isConnected: vi.fn().mockReturnValue(false),
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    // Reset cached browser so our mock gets used
    await closeBrowser();

    const { renderPage } = await import('../src/renderer/page-renderer');
    await expect(renderPage({ baseUrl: 'http://localhost:3000', slug: '/broken' })).rejects.toThrow(
      'HTTP 500'
    );
  });

  it('returns base64 image on success', async () => {
    const { chromium } = await import('playwright');
    const screenshotBuffer = Buffer.from('fake-png-data');
    const mockPage = {
      setViewportSize: vi.fn(),
      goto: vi.fn().mockResolvedValue({ status: () => 200 }),
      close: vi.fn().mockResolvedValue(undefined),
      waitForTimeout: vi.fn(),
      screenshot: vi.fn().mockResolvedValue(screenshotBuffer),
    };
    const mockBrowser = {
      isConnected: vi.fn().mockReturnValue(false),
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(chromium.launch).mockResolvedValue(mockBrowser as any);

    // Reset cached browser so our mock gets used
    await closeBrowser();

    const { renderPage } = await import('../src/renderer/page-renderer');
    const result = await renderPage({
      baseUrl: 'http://localhost:3000',
      slug: '/',
      viewport: { width: 1280, height: 720 },
    });

    expect(result.image).toBe(screenshotBuffer.toString('base64'));
    expect(result.mimeType).toBe('image/png');
    expect(result.viewport).toEqual({ width: 1280, height: 720 });
    expect(typeof result.renderTimeMs).toBe('number');
  });
});
