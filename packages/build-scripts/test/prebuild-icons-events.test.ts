/**
 * prebuild-icons-events.test.ts
 *
 * Integration tests for structured NDJSON events emitted by generateIconManifest.
 * Kept separate from prebuild-icons.test.ts to keep each file focused.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { generateIconManifest } from '../src/prebuild';
import { __resetSeqForTests } from '../src/lib/prebuild-events';
import type { PrebuildEvent } from '../src/lib/prebuild-events';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readNdjson(sinkPath: string): PrebuildEvent[] {
  if (!fs.existsSync(sinkPath)) return [];
  return fs
    .readFileSync(sinkPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PrebuildEvent);
}

function sinkFor(projectRoot: string): string {
  return path.join(projectRoot, '.stackwright', 'prebuild-events.ndjson');
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let contentOutDir: string;
let projectRoot: string;

beforeEach(() => {
  __resetSeqForTests();
  contentOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icon-ev-content-'));
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-icon-ev-root-'));
  // Make sure telemetry is active (override any stray env from outer shell)
  delete process.env['STACKWRIGHT_TELEMETRY_DISABLED'];
});

afterEach(() => {
  vi.restoreAllMocks();
  fs.rmSync(contentOutDir, { recursive: true, force: true });
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

function writeContentJson(data: unknown): void {
  fs.writeFileSync(path.join(contentOutDir, 'content.json'), JSON.stringify(data), 'utf8');
}

// ---------------------------------------------------------------------------
// scan_with_invalid_icon_emits_events
// ---------------------------------------------------------------------------

describe('scan_with_invalid_icon_emits_events', () => {
  it('emits prebuild_start, icon_fallback, icons_summary, file_generated, prebuild_complete for a scan with Bridge', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    writeContentJson({ icon: 'Bridge' });
    generateIconManifest(contentOutDir, projectRoot);

    const events = readNdjson(sinkFor(projectRoot));
    const types = events.map((e) => e.type);

    // All five event types must be present
    expect(types).toContain('prebuild_start');
    expect(types).toContain('icon_fallback');
    expect(types).toContain('icons_summary');
    expect(types).toContain('file_generated');
    expect(types).toContain('prebuild_complete');

    // prebuild_start must come first
    expect(types[0]).toBe('prebuild_start');
    const startEvent = events[0];
    if (startEvent.type === 'prebuild_start') {
      expect(startEvent.step).toBe('icon-scan');
    }

    // icon_fallback must mention 'Bridge'
    const fallbackEvents = events.filter((e) => e.type === 'icon_fallback');
    expect(fallbackEvents.length).toBeGreaterThanOrEqual(1);
    const bridgeFallback = fallbackEvents.find(
      (e) => e.type === 'icon_fallback' && e.src === 'Bridge'
    );
    expect(bridgeFallback).toBeDefined();
    if (bridgeFallback?.type === 'icon_fallback') {
      expect(bridgeFallback.fallback).toBe('HelpCircle');
    }

    // icons_summary must list Bridge as unknown
    const summaryEvent = events.find((e) => e.type === 'icons_summary');
    expect(summaryEvent).toBeDefined();
    if (summaryEvent?.type === 'icons_summary') {
      expect(summaryEvent.unknownIcons).toContain('Bridge');
      expect(summaryEvent.unknownCount).toBeGreaterThanOrEqual(1);
    }

    // file_generated must point at the stackwright-generated/icons.ts
    const fileEvent = events.find((e) => e.type === 'file_generated');
    expect(fileEvent).toBeDefined();
    if (fileEvent?.type === 'file_generated') {
      expect(fileEvent.path).toContain('icons.ts');
    }

    // prebuild_complete must come last and have a durationMs
    const completeEvent = events[events.length - 1];
    expect(completeEvent.type).toBe('prebuild_complete');
    if (completeEvent.type === 'prebuild_complete') {
      expect(completeEvent.step).toBe('icon-scan');
      expect(typeof completeEvent.durationMs).toBe('number');
      expect(completeEvent.durationMs).toBeGreaterThanOrEqual(0);
    }

    // All events share base fields
    for (const event of events) {
      expect(event.schemaVersion).toBe(1);
      expect(event.phase).toBe('prebuild');
      expect(new Date(event.ts).toISOString()).toBe(event.ts);
    }

    warnSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// clean_scan_emits_summary_with_zero_unknowns
// ---------------------------------------------------------------------------

describe('clean_scan_emits_summary_with_zero_unknowns', () => {
  it('emits icons_summary with unknownCount: 0 and no icon_fallback events for a clean scan', () => {
    writeContentJson([{ icon: 'Truck' }, { icon: 'Users' }]);
    generateIconManifest(contentOutDir, projectRoot);

    const events = readNdjson(sinkFor(projectRoot));
    const types = events.map((e) => e.type);

    // No fallback events on a clean scan
    expect(types).not.toContain('icon_fallback');

    // Summary must show zero unknowns
    const summaryEvent = events.find((e) => e.type === 'icons_summary');
    expect(summaryEvent).toBeDefined();
    if (summaryEvent?.type === 'icons_summary') {
      expect(summaryEvent.unknownCount).toBe(0);
      expect(summaryEvent.unknownIcons).toEqual([]);
    }

    // Lifecycle events still present
    expect(types).toContain('prebuild_start');
    expect(types).toContain('file_generated');
    expect(types).toContain('prebuild_complete');
  });
});
