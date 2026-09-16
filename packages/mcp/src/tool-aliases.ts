/**
 * Tool naming convention + compat-alias machinery for the OSS MCP server.
 *
 * See docs/TOOL-NAMING.md at the repo root for the full rationale (R12
 * first-call-fumble measurements, the code-puppy/Claude Code wire-prefixing
 * behavior that motivated dropping the redundant `stackwright_` prefix, and
 * the one-release compat policy).
 *
 * Convention: OSS tools are named `sw_<verb>_<object>`. The old
 * `stackwright_<verb>_<object>` names are kept registered for one release as
 * aliases that call the identical handler, so existing callers (pro wrapper,
 * harness, otter-viz, telemetry, in-flight agent sessions) don't break mid-air.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShape } from 'zod';

/**
 * Legacy `stackwright_*` tool name -> canonical `sw_*` tool name.
 * Exhaustive for every tool this package registers. Consumers (pro wrapper,
 * harness, otter-viz, telemetry) should use `canonicalToolName()` rather than
 * reading this map directly, since wire-level names are also prefixed by
 * code-puppy/Claude Code (`cp_<server>_...`).
 */
export const SW_TOOL_ALIASES: Record<string, string> = {
  // content-types.ts
  stackwright_get_content_types: 'sw_get_content_types',
  stackwright_preview_component: 'sw_preview_component',
  // pages.ts
  stackwright_list_pages: 'sw_list_pages',
  stackwright_get_page: 'sw_get_page',
  stackwright_write_page: 'sw_write_page',
  stackwright_add_page: 'sw_add_page',
  stackwright_validate_pages: 'sw_validate_pages',
  // site.ts
  stackwright_get_site_config: 'sw_get_site_config',
  stackwright_write_site_config: 'sw_write_site_config',
  stackwright_list_themes: 'sw_list_themes',
  stackwright_validate_site: 'sw_validate_site',
  // project.ts
  stackwright_get_project_info: 'sw_get_project_info',
  stackwright_scaffold_project: 'sw_scaffold_project',
  // git-ops.ts
  stackwright_stage_changes: 'sw_stage_changes',
  stackwright_open_pr: 'sw_open_pr',
  // board.ts
  stackwright_get_board: 'sw_get_board',
  // collections.ts
  stackwright_list_collections: 'sw_list_collections',
  stackwright_create_collection: 'sw_create_collection',
  // integrations.ts
  stackwright_list_integrations: 'sw_list_integrations',
  stackwright_get_integration: 'sw_get_integration',
  stackwright_add_integration: 'sw_add_integration',
  // compose.ts
  stackwright_compose_site: 'sw_compose_site',
  // render.ts
  stackwright_check_dev_server: 'sw_check_dev_server',
  stackwright_render_page: 'sw_render_page',
  stackwright_render_diff: 'sw_render_diff',
  stackwright_render_yaml: 'sw_render_yaml',
  // a11y.ts
  stackwright_test_a11y: 'sw_test_a11y',
};

/**
 * Known MCP server names whose prefix should be stripped before alias
 * lookup. Two independent things wrap a registered tool name in a
 * `<server>_` layer, and only one of them also adds a `cp_` layer on top:
 *
 *   - code-puppy/Claude Code OAuth: `cp_<server>_<tool>` (see
 *     `puppy/code_puppy/pydantic_patches.py`).
 *   - MCP clients that aggregate multiple servers (e.g. raft-puppy) may
 *     qualify tool names by server on their own, with no `cp_` layer:
 *     `<server>_<tool>` directly, as seen in real event fixtures like
 *     `stackwright-pro-mcp_stackwright_pro_get_pipeline_state`.
 *
 * `stackwright-mcp` and `stackwright-pro-mcp` are unambiguous prefixes — no
 * real tool name starts with those (hyphens don't appear in tool names), so
 * they're stripped unconditionally. `sw` is different: the composed server
 * is ALSO named `sw`, and canonical OSS tool names ALSO start with `sw_`, so
 * `sw_render_page` is ambiguous on its own — it could be a bare canonical
 * tool name, or `<server 'sw'>_<tool 'render_page'>`. That ambiguity only
 * resolves once a `cp_` layer confirms wire-wrapping actually happened, so
 * `sw` is only stripped when `cp_` was present.
 */
const UNAMBIGUOUS_SERVER_NAMES = ['stackwright-pro-mcp', 'stackwright-mcp'];
const AMBIGUOUS_SERVER_NAMES = ['sw'];

/**
 * Resolve any tool name — wire-prefixed or bare, legacy or current — to its
 * canonical `sw_*` (or, for other servers, `swp_*` / `sws_*`) name.
 *
 * Handles, in order:
 *   1. A leading `cp_` (code-puppy's wire prefix), if present.
 *   2. A leading `<server>_` for a known server name — always for
 *      unambiguous server names, only after a `cp_` strip for `sw` (see
 *      `AMBIGUOUS_SERVER_NAMES` above).
 *   3. A legacy alias lookup (`stackwright_render_page` -> `sw_render_page`).
 *
 * Names that are already canonical, or unrecognized entirely, are returned
 * unchanged (minus any stripped prefixes) — this function never throws.
 */
export function canonicalToolName(name: string): string {
  let n = name;

  const hadCpPrefix = n.startsWith('cp_');
  if (hadCpPrefix) {
    n = n.slice('cp_'.length);
  }

  const strippableServerNames = hadCpPrefix
    ? [...UNAMBIGUOUS_SERVER_NAMES, ...AMBIGUOUS_SERVER_NAMES]
    : UNAMBIGUOUS_SERVER_NAMES;

  for (const server of strippableServerNames) {
    const prefix = `${server}_`;
    if (n.startsWith(prefix)) {
      n = n.slice(prefix.length);
      break;
    }
  }

  return SW_TOOL_ALIASES[n] ?? n;
}

/** Handler shape accepted by `McpServer#tool(name, description, schema, cb)`. */
type ToolCallback = (...args: any[]) => any;

/**
 * Register a tool under its canonical name, plus a legacy alias name that
 * calls the exact same handler. The legacy registration gets a one-line
 * deprecation note appended to its description so it's visible in tool
 * listings without needing to consult docs.
 *
 * Both registrations are real, independent MCP tools (the SDK has no notion
 * of "the same tool under two names") — they just happen to share a handler
 * function, so behavior can never drift between canonical and legacy.
 */
export function registerWithAlias(
  server: McpServer,
  canonical: string,
  legacy: string,
  description: string,
  schema: ZodRawShape,
  handler: ToolCallback
): void {
  server.tool(canonical, description, schema, handler);
  server.tool(
    legacy,
    `${description}\n\nDEPRECATED: this tool has been renamed to '${canonical}'. '${legacy}' is kept as a compat alias for one release and will be removed after that.`,
    schema,
    handler
  );
}
