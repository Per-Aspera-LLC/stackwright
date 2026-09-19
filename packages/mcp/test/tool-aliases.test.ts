import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWithAlias, _warnedAliases } from '../src/tool-aliases';

// ---------------------------------------------------------------------------
// swp-ndvv: legacy `stackwright_*` aliases should nudge callers toward the
// canonical `sw_*` name the first time they're actually hit, without being
// noisy on every call, and — since this is an MCP stdio server — without
// EVER touching stdout (stdout is reserved for JSON-RPC framing; see
// swp-w00k / render-stdout.test.ts for the sibling bug this would cause).
// ---------------------------------------------------------------------------

describe('registerWithAlias — one-time-per-alias deprecation warning', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    _warnedAliases.clear();
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function registerFixture(server: McpServer) {
    registerWithAlias(
      server,
      'sw_get_page',
      'stackwright_get_page',
      'Get a page',
      { slug: z.string() },
      async (_args: { slug: string }) => ({ content: [{ type: 'text', text: 'ok' }] })
    );
  }

  it('warns to stderr on first legacy hit, naming the canonical replacement', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerFixture(server);
    const legacyTool = (server as any)._registeredTools['stackwright_get_page'];

    await legacyTool.handler({ slug: '/' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('stackwright_get_page'));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('sw_get_page'));
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('removed after the next release')
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('does not warn again on subsequent hits of the same alias', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerFixture(server);
    const legacyTool = (server as any)._registeredTools['stackwright_get_page'];

    await legacyTool.handler({ slug: '/' });
    await legacyTool.handler({ slug: '/about' });
    await legacyTool.handler({ slug: '/contact' });

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('never warns for the canonical name, only the legacy alias', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerFixture(server);
    const canonicalTool = (server as any)._registeredTools['sw_get_page'];

    await canonicalTool.handler({ slug: '/' });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('still calls through to the shared handler and returns its result', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerFixture(server);
    const legacyTool = (server as any)._registeredTools['stackwright_get_page'];

    const result = await legacyTool.handler({ slug: '/' });

    expect(result).toEqual({ content: [{ type: 'text', text: 'ok' }] });
  });

  it('tracks each distinct alias name independently', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerFixture(server);
    registerWithAlias(
      server,
      'sw_write_page',
      'stackwright_write_page',
      'Write a page',
      { slug: z.string() },
      async () => ({ content: [{ type: 'text', text: 'ok' }] })
    );

    await (server as any)._registeredTools['stackwright_get_page'].handler({ slug: '/' });
    await (server as any)._registeredTools['stackwright_write_page'].handler({ slug: '/' });

    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
