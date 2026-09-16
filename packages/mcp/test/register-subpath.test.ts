/**
 * Integration test for the /register subpath public API (swp-hbdx).
 *
 * Instantiates a real McpServer (no mocking), calls every registrar imported
 * from src/register.ts, then introspects the server's internal tool registry
 * to assert the full expected tool surface is present.
 *
 * If anyone adds a new tool to an OSS tools file and forgets to update
 * register.ts, this test fails immediately. That's the whole point.
 */

/**
 * Two mocks are required before imports:
 *
 * 1. `playwright` — render.ts → page-renderer.ts → playwright. No Chromium
 *    in a fast registration test.
 * 2. `@stackwright/build-scripts` — render.ts imports `runPrebuild` from it.
 *    That package only publishes a CJS `require` condition; Vite's default
 *    resolver looks for `import` and fails at module-graph time (not at call
 *    time). Mocking it here prevents the resolution failure. We are testing
 *    tool *registration*, not prebuild execution.
 */
import { vi, describe, it, expect, beforeAll } from 'vitest';

vi.mock('playwright', () => ({
  chromium: { launch: vi.fn() },
}));

vi.mock('@stackwright/build-scripts', () => ({
  runPrebuild: vi.fn().mockResolvedValue(undefined),
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  registerContentTypeTools,
  registerPageTools,
  registerSiteTools,
  registerProjectTools,
  registerGitOpsTools,
  registerBoardTools,
  registerCollectionTools,
  registerIntegrationTools,
  registerComposeTools,
  registerRenderTools,
  registerA11yTools,
  closeBrowser,
  SW_TOOL_ALIASES,
  canonicalToolName,
} from '../src/register';

// ---------------------------------------------------------------------------
// Expected tool surface, derived from SW_TOOL_ALIASES (src/tool-aliases.ts)
// rather than hardcoded here a second time. Each tool is registered twice —
// once under its canonical `sw_*` name, once under its legacy `stackwright_*`
// alias — via `registerWithAlias()` inside the individual tools/*.ts files.
// Those call sites hand-type both name strings independently of this map, so
// comparing against SW_TOOL_ALIASES still catches drift (a new tool added to
// a tools file but forgotten in the alias map, or vice versa).
// ---------------------------------------------------------------------------

const LEGACY_TOOLS = Object.keys(SW_TOOL_ALIASES);
const CANONICAL_TOOLS = Object.values(SW_TOOL_ALIASES);
const EXPECTED_TOOLS = [...CANONICAL_TOOLS, ...LEGACY_TOOLS] as const;

// ---------------------------------------------------------------------------

describe('register subpath — tool surface integration', () => {
  let server: McpServer;
  let registeredToolNames: string[];

  beforeAll(() => {
    server = new McpServer({ name: 'test-stackwright', version: '0.0.0-test' });

    // Register all OSS tools — same order as server.ts
    registerContentTypeTools(server);
    registerPageTools(server);
    registerSiteTools(server);
    registerProjectTools(server);
    registerGitOpsTools(server);
    registerBoardTools(server);
    registerCollectionTools(server);
    registerIntegrationTools(server);
    registerComposeTools(server);
    registerRenderTools(server);
    registerA11yTools(server);

    // Introspect via the internal registry (plain object, keys = tool names).

    registeredToolNames = Object.keys((server as any)._registeredTools);
  });

  it('registers every expected tool', () => {
    for (const toolName of EXPECTED_TOOLS) {
      expect(registeredToolNames, `missing tool: ${toolName}`).toContain(toolName);
    }
  });

  it('registers no unexpected tools (catches forgotten register.ts entries)', () => {
    // If a tool appears in the server but not in EXPECTED_TOOLS, this test
    // forces the author to add it to EXPECTED_TOOLS — keeping the list honest.
    const unexpected = registeredToolNames.filter(
      (name) => !(EXPECTED_TOOLS as readonly string[]).includes(name)
    );
    expect(
      unexpected,
      `unexpected tools found (add them to EXPECTED_TOOLS): ${unexpected.join(', ')}`
    ).toHaveLength(0);
  });

  it('exports closeBrowser as a callable function', () => {
    expect(typeof closeBrowser).toBe('function');
  });

  it('total tool count matches expected list', () => {
    expect(registeredToolNames).toHaveLength(EXPECTED_TOOLS.length);
  });

  it('every legacy alias shares its handler with the canonical tool', () => {
    const registry = (server as any)._registeredTools;
    for (const [legacy, canonical] of Object.entries(SW_TOOL_ALIASES)) {
      expect(registry[legacy].handler, `${legacy} handler !== ${canonical} handler`).toBe(
        registry[canonical].handler
      );
    }
  });

  it('every legacy alias description carries a deprecation note', () => {
    const registry = (server as any)._registeredTools;
    for (const legacy of LEGACY_TOOLS) {
      expect(registry[legacy].description, `${legacy} missing deprecation note`).toMatch(
        /deprecated/i
      );
    }
  });
});

describe('canonicalToolName()', () => {
  it('resolves a bare legacy name to its canonical name', () => {
    expect(canonicalToolName('stackwright_render_page')).toBe('sw_render_page');
  });

  it('leaves an already-canonical name unchanged', () => {
    expect(canonicalToolName('sw_render_page')).toBe('sw_render_page');
  });

  it('strips a leading cp_ wire prefix', () => {
    expect(canonicalToolName('cp_stackwright_render_page')).toBe('sw_render_page');
  });

  it('strips a leading cp_<server>_ wire prefix for a known server name', () => {
    expect(canonicalToolName('cp_stackwright-mcp_stackwright_render_page')).toBe('sw_render_page');
  });

  it('strips a leading cp_sw_ wire prefix for an already-canonical tool', () => {
    // The composed server is itself named 'sw', so canonical OSS tool names
    // collide with the server-name prefix on the wire (cp_sw_sw_render_page).
    expect(canonicalToolName('cp_sw_sw_render_page')).toBe('sw_render_page');
  });

  it('does not mangle a pro-prefixed tool name that merely starts with sw', () => {
    expect(canonicalToolName('cp_sw_swp_write_page')).toBe('swp_write_page');
  });

  it('returns unrecognized names unchanged', () => {
    expect(canonicalToolName('totally_unknown_tool')).toBe('totally_unknown_tool');
  });

  it('strips an unambiguous bare server prefix with no cp_ layer', () => {
    // Real-world shape from otter-viz fixtures: some MCP clients (e.g.
    // raft-puppy) qualify tool names by server without a cp_ wire layer.
    // 'stackwright-pro-mcp' is unambiguous (no real tool name starts with
    // it), so it strips even without cp_. The pro tool name underneath
    // (stackwright_pro_get_pipeline_state) isn't in this package's alias
    // map — pro's own rename is a separate task — so it comes back
    // unchanged past the server-prefix strip.
    expect(canonicalToolName('stackwright-pro-mcp_stackwright_pro_get_pipeline_state')).toBe(
      'stackwright_pro_get_pipeline_state'
    );
  });

  it('does not strip the ambiguous sw server prefix without a cp_ layer', () => {
    expect(canonicalToolName('sw_sw_render_page')).toBe('sw_sw_render_page');
  });
});
