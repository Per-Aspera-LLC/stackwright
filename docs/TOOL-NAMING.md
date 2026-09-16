# MCP tool naming convention

Status: adopted 2026-09-16 (swp-aj1o.2). Applies across the whole stack: OSS
MCP tools, Pro MCP tools, services tools, otters, the harness, otter-viz, and
telemetry.

## The rule

```
sw_<verb>_<object>     OSS tools      (this repo, @stackwright/mcp)
swp_<verb>_<object>    Pro tools      (pro/, @stackwright/pro-mcp)
sws_<verb>_<object>    Services tools (services/)
```

The composed MCP server itself — the thing that gets `McpServer({ name: ... })`
— is named **`sw`**, regardless of which package(s) contributed tools to it.

Rules for naming a tool:

- Keep `verb_object` order (`get_page`, not `page_get`).
- Drop the redundant product-name prefix. `stackwright` (or `stackwright_pro`)
  as a word inside the tool name added nothing once the *server* itself and
  the *tool family prefix* (`sw_`/`swp_`/`sws_`) already say which product a
  tool belongs to. `stackwright_render_page` -> `sw_render_page`.
  `stackwright_pro_get_pipeline_state` -> `swp_get_pipeline_state`.
  `stackwright_pro_write_workflow_container_page` ->
  `swp_write_workflow_container_page`.
- Do **not** otherwise abbreviate verbs or objects. `sw_get_pg` is not a
  thing. The prefix shortening is a one-time, deliberate exception to kill an
  established source of redundancy — it is not a license to start
  abbreviating everything else.

## Why: the wire-prefix problem

Tool names don't arrive at the model exactly as registered. Two layers stack
on top of whatever an MCP server calls a tool:

1. **code-puppy** prefixes every tool it exposes to an agent with
   `cp_<server-name>_`, where `<server-name>` is the MCP server's registered
   name (composing multiple tool-registrar packages onto one `McpServer`
   instance doesn't change this — the server's own `name` field is what gets
   used). A tool called `stackwright_render_page`, served by an MCP server
   named `stackwright-mcp`, becomes `cp_stackwright-mcp_stackwright_render_page`
   on the wire.
2. **Claude Code OAuth** adds its own `cp_` layer on top of whatever
   pydantic-ai/code-puppy already produced, for reasons internal to how
   Anthropic's OAuth tool-calling plumbing classifies tool calls. See
   `puppy/code_puppy/pydantic_patches.py::patch_tool_call_callbacks` — that
   patch exists specifically because pydantic-ai classifies tool calls
   *before* unprefixing happens, so a `cp_`-prefixed name that isn't
   recognized in time gets marked `unknown` and can burn through result
   retries before failing with `UnexpectedModelBehavior`. The prefix is only
   stripped when a claude-code OAuth model is active (see
   `_is_claude_code_model_active` in that same file) — stripping it
   unconditionally would corrupt any legitimate tool name that happens to
   start with `cp_` under a different model backend.

Stack both layers and the old convention produced names like:

```
cp_stackwright-pro-mcp_stackwright_pro_write_page
```

against the new convention's:

```
cp_sw_swp_write_page
```

That's not a cosmetic complaint — it's the literal string a model has to get
right, unprompted, on the very first tool call of a session, with zero
context about why a product name appears twice. The R12 measurement run
tracked first-call fumbles (a model either inventing a plausible-but-wrong
tool name, or truncating/mistyping the long compound name) against tool-name
length and redundancy, and the double-product-name pattern
(`stackwright_pro_...` served by a server also called `stackwright-pro-mcp`)
was disproportionately represented in those fumbles. Shortening the
registered name is the one part of this problem we control directly — we
can't change how code-puppy or Claude Code OAuth prefix things, but we can
stop handing them a redundant string to prefix in the first place.

## Compat aliases (one release)

Renaming a tool is a breaking change for anyone with the old name memorized,
scripted, or baked into a fixture. So every rename in this pass ships as
**two** registrations against **one** handler:

- The canonical name (`sw_render_page`) — this is the name new integrations
  should use, and the one that appears first in any tool listing.
- The legacy name (`stackwright_render_page`) — registered via the exact same
  handler function, so behavior can never drift between the two. Its
  description gets a one-line deprecation note appended
  (`DEPRECATED: this tool has been renamed to 'sw_render_page'. ...`) so it's
  visible in tool listings without needing to consult this doc.

The legacy alias is kept for **one release** after the rename ships, then
removed. "One release" means: it survives the minor version bump that
introduces the rename, and is deleted in the next minor after that — not an
indefinite compat shim.

### `SW_TOOL_ALIASES` and `canonicalToolName()`

`@stackwright/mcp` (both the package root and the `./register` subpath)
exports:

- `SW_TOOL_ALIASES: Record<string, string>` — an exhaustive map of every
  legacy `stackwright_*` name to its canonical `sw_*` name.
- `canonicalToolName(name: string): string` — resolves *any* tool name (wire-
  prefixed by code-puppy/Claude Code, server-prefixed by an aggregating MCP
  client with no `cp_` layer, or bare; legacy or current) to its canonical
  name. It:
  1. Strips a leading `cp_`, if present.
  2. Strips a leading `<server>_` for a known server name. `stackwright-mcp`
     and `stackwright-pro-mcp` strip unconditionally — no real tool name
     starts with either (hyphens don't appear in tool names), so there's no
     ambiguity. `sw` only strips when step 1 actually found a `cp_` layer:
     the composed server is *also* named `sw`, and canonical OSS tool names
     *also* start with `sw_`, so a bare `sw_render_page` is genuinely
     ambiguous on its own — it could be the tool's own name, or
     `<server 'sw'>_<tool 'render_page'>`. Only a confirmed `cp_` wire-wrapper
     resolves that ambiguity.
  3. Looks the (possibly-unwrapped) name up in `SW_TOOL_ALIASES`, falling
     back to the name itself if it's not a known legacy alias (including
     when it's already canonical, or belongs to a different tool family
     like `swp_*`/`sws_*` entirely — this package's alias map only covers
     OSS tools; it won't resolve a pro tool's old name to a new one, since
     pro hasn't renamed yet).

  It never throws — unrecognized input is returned unchanged (minus
  whatever prefix stripping applied). See
  `test/register-subpath.test.ts` (`canonicalToolName()` describe block) for
  the exact cases this handles, including the real bare
  `stackwright-pro-mcp_stackwright_pro_get_pipeline_state`-shaped names seen
  in otter-viz fixtures.
- `registerWithAlias(server, canonical, legacy, description, schema, handler)`
  — the helper every OSS tool file uses internally to perform the double
  registration described above. Exported so pro's tool files, and anyone
  else composing tools onto an `McpServer`, can follow the same pattern
  without reimplementing it.

Consumers that need to key off tool name (the pro wrapper, the harness, the
otter-viz replay UI, telemetry pipelines) should route every tool name
through `canonicalToolName()` before comparing/matching, rather than special-
casing old vs. new names themselves. That's the whole point of exporting it.

## Full old -> new table (OSS)

See `packages/mcp/src/tool-aliases.ts` (`SW_TOOL_ALIASES`) for the
machine-readable, always-current version of this table — this doc is the
narrative; that file is the source of truth.
