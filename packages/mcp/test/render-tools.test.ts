import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock playwright before importing modules that use it
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

import { probeServer, closeBrowser } from '../src/renderer/page-renderer';

describe('probeServer', () => {
  it('returns false for unreachable server', async () => {
    const result = await probeServer('http://localhost:19999');
    expect(result).toBe(false);
  });

  it('returns true for reachable server', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    try {
      const result = await probeServer('http://localhost:3000');
      expect(result).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns true for 404 (server is running but page not found)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    try {
      const result = await probeServer('http://localhost:3000');
      expect(result).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('closeBrowser', () => {
  it('can be called safely when no browser is open', async () => {
    await expect(closeBrowser()).resolves.not.toThrow();
  });
});
