/**
 * Configurable stdout/stderr sink for build-scripts progress output.
 *
 * Context: `runPrebuild()` and the `compile*` primitives print human-readable
 * progress lines (e.g. "  [OK] _site.json") via `console.log`, which writes
 * to `process.stdout` by default. That's correct behavior for the
 * `stackwright-prebuild` CLI binary, where a human (or a log collector) is
 * watching stdout. It is NOT safe when these functions are called
 * in-process by an MCP stdio server (e.g. oss `sw_render_page` / pro
 * `swp_compile_site`), because MCP stdio transport reserves stdout
 * exclusively for newline-delimited JSON-RPC frames -- any plain-text line
 * on that stream corrupts message framing for the client.
 *
 * Fix: route all progress output through `log()` below instead of calling
 * `console.log` directly. Callers that share a process with an MCP stdio
 * transport (any MCP tool handler that invokes build-scripts in-process)
 * MUST call `setLogSink('stderr')` before invoking build-scripts entry
 * points -- MCP stdio servers may write freely to stderr.
 *
 * Selection mechanism (in priority order):
 *   1. Explicit `setLogSink()` call (preferred -- what MCP tool handlers use).
 *   2. `STACKWRIGHT_LOG_STREAM` env var (`stdout` | `stderr` | `silent`) --
 *      belt-and-braces fallback for environments that can't call the API
 *      directly.
 *   3. Default: `stdout` (preserves existing CLI behavior).
 *
 * Zero dependencies by design -- this package must stay lean.
 */

export type LogSink = 'stdout' | 'stderr' | 'silent';

const VALID_SINKS: readonly LogSink[] = ['stdout', 'stderr', 'silent'];

function resolveEnvSink(): LogSink | undefined {
  const raw = process.env.STACKWRIGHT_LOG_STREAM;
  return raw && (VALID_SINKS as readonly string[]).includes(raw) ? (raw as LogSink) : undefined;
}

let currentSink: LogSink = resolveEnvSink() ?? 'stdout';

/**
 * Explicitly select where build-scripts progress output goes.
 * MCP tool handlers that call runPrebuild/compile* in-process should call
 * `setLogSink('stderr')` before doing so.
 */
export function setLogSink(sink: LogSink): void {
  currentSink = sink;
}

/** Read the currently selected sink (mainly useful for tests). */
export function getLogSink(): LogSink {
  return currentSink;
}

/**
 * Drop-in replacement for `console.log(message)` that respects the
 * configured sink. Message text is never altered -- only the destination
 * stream changes.
 *
 * Deliberately routes through `console.log`/`console.error` rather than
 * writing to `process.stdout`/`process.stderr` directly: those are Node's
 * own stdout/stderr-writing primitives (console.log -> stdout, console.error
 * -> stderr), so this preserves exact prior behavior for the default
 * ('stdout') sink -- including for any test suite that spies on `console.log`
 * -- while giving `setLogSink('stderr')` callers a real move to stderr.
 */
export function log(message: string): void {
  switch (currentSink) {
    case 'silent':
      return;
    case 'stderr':
      console.error(message);
      return;
    case 'stdout':
    default:
      console.log(message);
      return;
  }
}
