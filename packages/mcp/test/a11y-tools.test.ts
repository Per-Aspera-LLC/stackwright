/**
 * sw_test_a11y MCP formatter (swp-kwv8 / stackwright-8v2).
 *
 * The underlying CLI runner used to report a login-bounce scan as a clean
 * pass — structurally indistinguishable from a real audit. Once the runner
 * carries finalUrl/status, this formatter must surface it: redirected scans
 * print distinctly (never a pass mark), violations carry selector targets, and a
 * machine-readable trailer lets wrapper/otter callers parse per-scan status
 * without regexing prose.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { A11yAuditResult } from '@stackwright/cli';

const { mockTestA11y } = vi.hoisted(() => ({ mockTestA11y: vi.fn() }));

vi.mock('@stackwright/cli', () => ({
  testA11y: mockTestA11y,
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerA11yTools } from '../src/tools/a11y';

// ---------------------------------------------------------------------------
// Harness: register against a fake server, capture the callback
// ---------------------------------------------------------------------------

type ToolCb = (args: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

function registerAndCapture(): ToolCb {
  let captured: ToolCb | undefined;
  const fakeServer = {
    tool: (...args: unknown[]) => {
      captured = args[args.length - 1] as ToolCb;
    },
  } as unknown as McpServer;
  registerA11yTools(fakeServer);
  if (!captured) throw new Error('sw_test_a11y was not registered');
  return captured;
}

function textOf(result: { content: Array<{ type: string; text: string }> }): string {
  return result.content.map((c) => c.text).join('\n');
}

function baseResult(overrides: Partial<A11yAuditResult> = {}): A11yAuditResult {
  return {
    pass: true,
    baseUrl: 'http://localhost:3000',
    slugs: ['/leads'],
    modes: ['light'],
    results: [],
    summary: { total: 0, passed: 0, failed: 0, redirected: 0, violations: 0 },
    ...overrides,
  };
}

describe('sw_test_a11y — redirected scan formatting', () => {
  beforeEach(() => {
    mockTestA11y.mockReset();
  });

  it('prints a redirected scan as REDIRECTED, never a pass mark, and marks isError', async () => {
    const result = baseResult({
      pass: false,
      results: [
        {
          slug: '/leads',
          url: 'http://localhost:3000/leads',
          requestedUrl: 'http://localhost:3000/leads',
          finalUrl: 'http://localhost:3000/login?redirect=%2Fleads',
          mode: 'light',
          status: 'redirected',
          pass: false,
          redirected: true,
          redirectedToLogin: true,
          violations: [],
          failingViolations: [],
        },
      ],
      summary: { total: 1, passed: 0, failed: 0, redirected: 1, violations: 0 },
    });
    mockTestA11y.mockResolvedValue(result);

    const tool = registerAndCapture();
    const output = await tool({ projectRoot: '/fake' });

    const text = textOf(output);
    expect(text).toContain(
      '↪ /leads [light] REDIRECTED → http://localhost:3000/login?redirect=%2Fleads (not audited — auth coverage only)'
    );
    const passMark = '\u2713'; // avoid a literal glyph in source for tooling reasons
    expect(text).not.toContain(`${passMark} /leads`);
    expect(output.isError).toBe(true);
  });

  it('allowRedirects is forwarded to testA11y', async () => {
    mockTestA11y.mockResolvedValue(baseResult());
    const tool = registerAndCapture();
    await tool({ projectRoot: '/fake', allowRedirects: true });
    expect(mockTestA11y).toHaveBeenCalledWith(
      '/fake',
      expect.objectContaining({ allowRedirects: true })
    );
  });

  // swp-0k73: cookies/extraHTTPHeaders let a caller authenticate the scan's
  // browser context directly (context.addCookies) instead of rewriting
  // slugs through an app's own login route, which the runner's own
  // requestedUrl-vs-finalUrl check would otherwise classify as 'redirected'
  // even though the scan landed on the intended route.
  it('cookies are forwarded to testA11y', async () => {
    mockTestA11y.mockResolvedValue(baseResult());
    const tool = registerAndCapture();
    const cookies = [{ name: 'stackwright_mock_persona', value: 'team', path: '/' }];
    await tool({ projectRoot: '/fake', cookies });
    expect(mockTestA11y).toHaveBeenCalledWith('/fake', expect.objectContaining({ cookies }));
  });

  it('extraHTTPHeaders are forwarded to testA11y', async () => {
    mockTestA11y.mockResolvedValue(baseResult());
    const tool = registerAndCapture();
    const extraHTTPHeaders = { 'x-mock-auth': 'team' };
    await tool({ projectRoot: '/fake', extraHTTPHeaders });
    expect(mockTestA11y).toHaveBeenCalledWith(
      '/fake',
      expect.objectContaining({ extraHTTPHeaders })
    );
  });

  it('a passing audited scan prints finalUrl on the scan line', async () => {
    const result = baseResult({
      pass: true,
      results: [
        {
          slug: '/leads',
          url: 'http://localhost:3000/leads',
          requestedUrl: 'http://localhost:3000/leads',
          finalUrl: 'http://localhost:3000/leads',
          mode: 'light',
          status: 'audited',
          pass: true,
          redirected: false,
          redirectedToLogin: false,
          violations: [],
          failingViolations: [],
        },
      ],
      summary: { total: 1, passed: 1, failed: 0, redirected: 0, violations: 0 },
    });
    mockTestA11y.mockResolvedValue(result);

    const tool = registerAndCapture();
    const output = await tool({ projectRoot: '/fake' });
    expect(textOf(output)).toContain('\u2713 /leads [light] \u2192 http://localhost:3000/leads');
    expect(output.isError).toBe(false);
  });

  it('failing violations print up to 3 target selectors', async () => {
    const manyTargets = Array.from({ length: 5 }, (_, i) => `.node-${i}`);
    const result = baseResult({
      pass: false,
      results: [
        {
          slug: '/leads',
          url: 'http://localhost:3000/leads',
          requestedUrl: 'http://localhost:3000/leads',
          finalUrl: 'http://localhost:3000/leads',
          mode: 'light',
          status: 'audited',
          pass: false,
          redirected: false,
          redirectedToLogin: false,
          violations: [
            {
              id: 'color-contrast',
              impact: 'serious',
              description: 'contrast',
              help: 'Fix contrast',
              helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
              nodeCount: manyTargets.length,
              nodes: manyTargets.map((t) => ({ target: [t], failureSummary: `fix ${t}` })),
            },
          ],
          failingViolations: [
            {
              id: 'color-contrast',
              impact: 'serious',
              description: 'contrast',
              help: 'Fix contrast',
              helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
              nodeCount: manyTargets.length,
              nodes: manyTargets.map((t) => ({ target: [t], failureSummary: `fix ${t}` })),
            },
          ],
        },
      ],
      summary: { total: 1, passed: 0, failed: 1, redirected: 0, violations: 1 },
    });
    mockTestA11y.mockResolvedValue(result);

    const tool = registerAndCapture();
    const text = textOf(await tool({ projectRoot: '/fake' }));
    expect(text).toContain('· .node-0');
    expect(text).toContain('· .node-1');
    expect(text).toContain('· .node-2');
    expect(text).not.toContain('· .node-3');
  });

  it('emits a machine-readable JSON trailer with per-scan status and a summary', async () => {
    const result = baseResult({
      pass: false,
      results: [
        {
          slug: '/leads',
          url: 'http://localhost:3000/leads',
          requestedUrl: 'http://localhost:3000/leads',
          finalUrl: 'http://localhost:3000/login?redirect=%2Fleads',
          mode: 'light',
          status: 'redirected',
          pass: false,
          redirected: true,
          redirectedToLogin: true,
          violations: [],
          failingViolations: [],
        },
        {
          slug: '/contacts',
          url: 'http://localhost:3000/contacts',
          requestedUrl: 'http://localhost:3000/contacts',
          finalUrl: 'http://localhost:3000/contacts',
          mode: 'light',
          status: 'audited',
          pass: true,
          redirected: false,
          redirectedToLogin: false,
          violations: [],
          failingViolations: [],
        },
      ],
      summary: { total: 2, passed: 1, failed: 0, redirected: 1, violations: 0 },
    });
    mockTestA11y.mockResolvedValue(result);

    const tool = registerAndCapture();
    const text = textOf(await tool({ projectRoot: '/fake' }));

    const match = text.match(/```json\n([\s\S]*?)\n```/);
    expect(match).not.toBeNull();
    const trailer = JSON.parse(match![1]);
    expect(trailer).toEqual({
      scans: [
        {
          slug: '/leads',
          mode: 'light',
          status: 'redirected',
          finalUrl: 'http://localhost:3000/login?redirect=%2Fleads',
          violations: 0,
        },
        {
          slug: '/contacts',
          mode: 'light',
          status: 'audited',
          finalUrl: 'http://localhost:3000/contacts',
          violations: 0,
        },
      ],
      summary: { audited: 1, redirected: 1, failed: 0 },
    });
  });

  it('bubbles NO_DEV_SERVER / MISSING_PLAYWRIGHT errors as before', async () => {
    const err = new Error('No dev server detected') as NodeJS.ErrnoException;
    err.code = 'NO_DEV_SERVER';
    mockTestA11y.mockRejectedValue(err);

    const tool = registerAndCapture();
    const output = await tool({ projectRoot: '/fake' });
    expect(output.isError).toBe(true);
    expect(textOf(output)).toContain('No dev server running');
  });
});
