import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerRenderTools } from '../src/tools/render';

// ---------------------------------------------------------------------------
// swp-w00k: oss `sw_render_page` (and siblings) call build-scripts'
// runPrebuild() in-process whenever a projectRoot is supplied. MCP stdio
// transport reserves stdout exclusively for JSON-RPC framing, so any
// plain-text progress line build-scripts writes to stdout corrupts message
// framing for the client ("Failed to parse JSONRPC message from server").
//
// This proves the WIRING fix: sw_render_page's handler must invoke
// runPrebuild with `{ logSink: 'stderr' }`. The build-scripts module is
// aliased to test/__mocks__/build-scripts.ts in this package's
// vitest.config.ts (a pre-existing constraint, documented there — Vite
// can't resolve the real CJS-only package during static import analysis).
// The mock mirrors the real log.ts's behavior (console.log for 'stdout',
// console.error for 'stderr') so this test exercises the actual option
// threading in src/tools/render.ts, not just a call-argument assertion.
// ---------------------------------------------------------------------------

describe('sw_render_page — stdout must stay byte-clean (swp-w00k)', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // probeServer() does a plain fetch — make it look like a dev server is up.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function getRenderPageTool() {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerRenderTools(server);
    return (server as any)._registeredTools['sw_render_page'];
  }

  it('never calls console.log when projectRoot is supplied (runPrebuild routed to stderr)', async () => {
    const tool = getRenderPageTool();

    await tool.handler({
      baseUrl: 'http://localhost:3000',
      slug: '/',
      fullPage: true,
      format: 'png',
      projectRoot: '/tmp/does-not-need-to-exist-for-this-test',
    });

    // The build-scripts stub's prebuild progress line must have gone to
    // stderr, never stdout — proving render.ts passed logSink: 'stderr'.
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Stackwright prebuild starting'));
  });

  it('sw_render_diff also never writes to console.log when projectRoot is supplied', async () => {
    const server = new McpServer({ name: 'test', version: '0.0.0' });
    registerRenderTools(server);
    const tool = (server as any)._registeredTools['sw_render_diff'];

    await tool.handler({
      baseUrl: 'http://localhost:3000',
      slug: '/',
      fullPage: true,
      projectRoot: '/tmp/does-not-need-to-exist-for-this-test',
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('without projectRoot, runPrebuild is never invoked (no stub output on either stream)', async () => {
    const tool = getRenderPageTool();

    await tool.handler({
      baseUrl: 'http://localhost:3000',
      slug: '/',
      fullPage: true,
      format: 'png',
    });

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Stackwright prebuild starting')
    );
  });
});
