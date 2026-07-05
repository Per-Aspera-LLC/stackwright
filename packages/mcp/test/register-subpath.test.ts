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
} from '../src/register';

// ---------------------------------------------------------------------------
// All tool names that must be present on the composed server.
// Sourced by reading every tools/*.ts file — update here when adding new tools.
// ---------------------------------------------------------------------------

const EXPECTED_TOOLS = [
  // content-types.ts
  'stackwright_get_content_types',
  'stackwright_preview_component',
  // pages.ts
  'stackwright_list_pages',
  'stackwright_get_page',
  'stackwright_write_page',
  'stackwright_add_page',
  'stackwright_validate_pages',
  // site.ts
  'stackwright_get_site_config',
  'stackwright_write_site_config',
  'stackwright_list_themes',
  'stackwright_validate_site',
  // project.ts
  'stackwright_get_project_info',
  'stackwright_scaffold_project',
  // git-ops.ts
  'stackwright_stage_changes',
  'stackwright_open_pr',
  // board.ts
  'stackwright_get_board',
  // collections.ts
  'stackwright_list_collections',
  'stackwright_create_collection',
  // integrations.ts
  'stackwright_list_integrations',
  'stackwright_get_integration',
  'stackwright_add_integration',
  // compose.ts
  'stackwright_compose_site',
  // render.ts
  'stackwright_check_dev_server',
  'stackwright_render_page',
  'stackwright_render_diff',
  'stackwright_render_yaml',
  // a11y.ts
  'stackwright_test_a11y',
] as const;

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
});
