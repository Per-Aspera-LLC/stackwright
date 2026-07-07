/**
 * prebuild-events.ts
 *
 * Structured NDJSON event emitter for stackwright prebuild steps.
 * Writes to .stackwright/prebuild-events.ndjson in the project root.
 *
 * Intentionally zero external dependencies — stdlib only.
 * Telemetry failure must NEVER fail the prebuild.
 *
 * Env vars:
 *   STACKWRIGHT_TELEMETRY_DISABLED=1  → all emits are no-ops
 *   STACKWRIGHT_TELEMETRY_DEBUG=1     → emit errors are written to stderr
 *   STACKWRIGHT_PROJECT_ROOT          → fallback when opts.projectRoot not supplied
 */

import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Schema types
// ---------------------------------------------------------------------------

const SCHEMA_VERSION = 1;

type PrebuildEventBase = {
  schemaVersion: 1;
  ts: string; // ISO-8601
  seq: number; // monotonic, per-process, starts at 0
  phase: 'prebuild';
};

export type PrebuildEvent =
  | (PrebuildEventBase & { type: 'prebuild_start'; step: string })
  | (PrebuildEventBase & { type: 'prebuild_complete'; step: string; durationMs: number })
  | (PrebuildEventBase & { type: 'icon_fallback'; src: string; resolved: string; fallback: string })
  | (PrebuildEventBase & {
      type: 'icons_summary';
      totalIcons: number;
      unknownCount: number;
      unknownIcons: string[];
    })
  | (PrebuildEventBase & { type: 'file_generated'; path: string });

// Named variants for Pro / QA consumers that want type-only imports
export type PrebuildStartEvent = Extract<PrebuildEvent, { type: 'prebuild_start' }>;
export type PrebuildCompleteEvent = Extract<PrebuildEvent, { type: 'prebuild_complete' }>;
export type IconFallbackEvent = Extract<PrebuildEvent, { type: 'icon_fallback' }>;
export type IconsSummaryEvent = Extract<PrebuildEvent, { type: 'icons_summary' }>;
export type FileGeneratedEvent = Extract<PrebuildEvent, { type: 'file_generated' }>;

/**
 * Distributive Omit — applies Omit to each member of a union individually.
 * TypeScript's built-in Omit<A | B, K> collapses the union; this preserves it.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// ---------------------------------------------------------------------------
// Per-process state
// ---------------------------------------------------------------------------

let seq = 0;

/**
 * Tracks which sink paths have been truncated this process.
 * First emit to a path truncates the file so stale runs don't accrete.
 */
const truncated = new Set<string>();

// ---------------------------------------------------------------------------
// Sink resolver
// ---------------------------------------------------------------------------

function resolveSinkPath(projectRoot?: string): string {
  const root = projectRoot ?? process.env['STACKWRIGHT_PROJECT_ROOT'] ?? process.cwd();
  return path.join(root, '.stackwright', 'prebuild-events.ndjson');
}

// ---------------------------------------------------------------------------
// emit
// ---------------------------------------------------------------------------

export function emit(
  event: DistributiveOmit<PrebuildEvent, 'schemaVersion' | 'ts' | 'seq' | 'phase'>,
  opts?: { projectRoot?: string }
): void {
  if (process.env['STACKWRIGHT_TELEMETRY_DISABLED'] === '1') return;
  try {
    const sinkPath = resolveSinkPath(opts?.projectRoot);

    // Ensure .stackwright/ dir exists
    fs.mkdirSync(path.dirname(sinkPath), { recursive: true });

    // Truncate on first emit per process per sink path
    if (!truncated.has(sinkPath)) {
      fs.writeFileSync(sinkPath, '');
      truncated.add(sinkPath);
    }

    const enriched: PrebuildEvent = {
      schemaVersion: SCHEMA_VERSION,
      ts: new Date().toISOString(),
      seq: seq++,
      phase: 'prebuild',
      ...event,
    } as PrebuildEvent;

    fs.appendFileSync(sinkPath, JSON.stringify(enriched) + '\n');
  } catch (err) {
    if (process.env['STACKWRIGHT_TELEMETRY_DEBUG'] === '1') {
      process.stderr.write(`[prebuild-events] emit failed: ${err}\n`);
    }
    // Never throw — telemetry failure must not fail prebuild
  }
}

// ---------------------------------------------------------------------------
// Test utilities
// ---------------------------------------------------------------------------

/**
 * Reset the per-process sequence counter and truncation tracker.
 *
 * @internal — for use in tests only. The underscore prefix is intentional;
 * do not call this from production code paths.
 */
export function __resetSeqForTests(): void {
  seq = 0;
  truncated.clear();
}
