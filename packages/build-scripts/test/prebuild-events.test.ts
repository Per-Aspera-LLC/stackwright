import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { emit, __resetSeqForTests } from '../src/lib/prebuild-events';
import type { PrebuildEvent } from '../src/lib/prebuild-events';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readNdjson(sinkPath: string): PrebuildEvent[] {
  return fs
    .readFileSync(sinkPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as PrebuildEvent);
}

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sw-pbe-test-'));
}

function sinkFor(projectRoot: string): string {
  return path.join(projectRoot, '.stackwright', 'prebuild-events.ndjson');
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  __resetSeqForTests();
  tmpDir = makeTmpDir();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// emit_writes_valid_ndjson
// ---------------------------------------------------------------------------

describe('emit_writes_valid_ndjson', () => {
  it('writes two valid NDJSON lines with sequential seq and correct base fields', () => {
    emit({ type: 'prebuild_start', step: 'test-step' }, { projectRoot: tmpDir });
    emit({ type: 'prebuild_complete', step: 'test-step', durationMs: 42 }, { projectRoot: tmpDir });

    const events = readNdjson(sinkFor(tmpDir));
    expect(events).toHaveLength(2);

    const [first, second] = events;

    // seq
    expect(first.seq).toBe(0);
    expect(second.seq).toBe(1);

    // schemaVersion on both
    expect(first.schemaVersion).toBe(1);
    expect(second.schemaVersion).toBe(1);

    // phase on both
    expect(first.phase).toBe('prebuild');
    expect(second.phase).toBe('prebuild');

    // ts must be a valid ISO-8601 date string
    expect(() => new Date(first.ts)).not.toThrow();
    expect(new Date(first.ts).toISOString()).toBe(first.ts);
    expect(new Date(second.ts).toISOString()).toBe(second.ts);

    // type-specific fields
    expect(first.type).toBe('prebuild_start');
    if (first.type === 'prebuild_start') expect(first.step).toBe('test-step');

    expect(second.type).toBe('prebuild_complete');
    if (second.type === 'prebuild_complete') {
      expect(second.step).toBe('test-step');
      expect(second.durationMs).toBe(42);
    }
  });
});

// ---------------------------------------------------------------------------
// disabled_env_no_writes
// ---------------------------------------------------------------------------

describe('disabled_env_no_writes', () => {
  it('does not create the sink file when STACKWRIGHT_TELEMETRY_DISABLED=1', () => {
    vi.stubEnv('STACKWRIGHT_TELEMETRY_DISABLED', '1');

    emit({ type: 'prebuild_start', step: 'should-be-skipped' }, { projectRoot: tmpDir });

    expect(fs.existsSync(sinkFor(tmpDir))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// project_root_override
// ---------------------------------------------------------------------------

describe('project_root_override', () => {
  it('uses STACKWRIGHT_PROJECT_ROOT env var when no opts supplied', () => {
    const envRoot = makeTmpDir();
    vi.stubEnv('STACKWRIGHT_PROJECT_ROOT', envRoot);

    try {
      // No opts → falls back to env var
      emit({ type: 'prebuild_start', step: 'env-test' });

      expect(fs.existsSync(sinkFor(envRoot))).toBe(true);
      const events = readNdjson(sinkFor(envRoot));
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('prebuild_start');
    } finally {
      fs.rmSync(envRoot, { recursive: true, force: true });
    }
  });

  it('opts.projectRoot takes precedence over STACKWRIGHT_PROJECT_ROOT', () => {
    const envRoot = makeTmpDir();
    const optsRoot = makeTmpDir();
    vi.stubEnv('STACKWRIGHT_PROJECT_ROOT', envRoot);

    try {
      // opts.projectRoot overrides env
      emit({ type: 'prebuild_start', step: 'opts-wins' }, { projectRoot: optsRoot });

      // Event must appear in opts dir, not the env dir
      expect(fs.existsSync(sinkFor(optsRoot))).toBe(true);
      expect(fs.existsSync(sinkFor(envRoot))).toBe(false);

      const events = readNdjson(sinkFor(optsRoot));
      expect(events).toHaveLength(1);
    } finally {
      fs.rmSync(envRoot, { recursive: true, force: true });
      fs.rmSync(optsRoot, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// first_emit_truncates
// ---------------------------------------------------------------------------

describe('first_emit_truncates', () => {
  it('truncates a pre-existing sink file on first emit, not on subsequent emits', () => {
    const sinkPath = sinkFor(tmpDir);
    const sinkDir = path.dirname(sinkPath);
    fs.mkdirSync(sinkDir, { recursive: true });

    // Pre-populate with garbage
    fs.writeFileSync(sinkPath, 'this-is-stale-garbage-from-a-previous-run\n');

    emit({ type: 'prebuild_start', step: 'fresh-start' }, { projectRoot: tmpDir });
    emit(
      { type: 'prebuild_complete', step: 'fresh-start', durationMs: 1 },
      { projectRoot: tmpDir }
    );

    const events = readNdjson(sinkPath);

    // Exactly two events — the stale garbage must be gone
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe('prebuild_start');
    expect(events[1].type).toBe('prebuild_complete');
  });
});

// ---------------------------------------------------------------------------
// malformed_path_never_throws
// ---------------------------------------------------------------------------

describe('malformed_path_never_throws', () => {
  it('does not throw when the sink path is unwriteable', () => {
    // Use a regular file as the projectRoot so that
    // mkdirSync(${file}/.stackwright) fails with ENOTDIR
    const notADir = path.join(os.tmpdir(), `sw-pbe-notadir-${Date.now()}-${process.pid}`);
    fs.writeFileSync(notADir, 'i am a regular file, not a directory');

    try {
      expect(() => {
        emit({ type: 'prebuild_start', step: 'bad-path' }, { projectRoot: notADir });
      }).not.toThrow();
    } finally {
      fs.rmSync(notADir, { force: true });
    }
  });

  it('writes to stderr when STACKWRIGHT_TELEMETRY_DEBUG=1 and emit fails', () => {
    const stderrMessages: string[] = [];
    vi.spyOn(process.stderr, 'write').mockImplementation((msg) => {
      stderrMessages.push(String(msg));
      return true;
    });
    vi.stubEnv('STACKWRIGHT_TELEMETRY_DEBUG', '1');

    const notADir = path.join(os.tmpdir(), `sw-pbe-debug-notadir-${Date.now()}-${process.pid}`);
    fs.writeFileSync(notADir, 'also a file');

    try {
      // Should not throw even in debug mode
      expect(() => {
        emit({ type: 'prebuild_start', step: 'debug-bad-path' }, { projectRoot: notADir });
      }).not.toThrow();

      expect(stderrMessages.some((m) => m.includes('[prebuild-events] emit failed'))).toBe(true);
    } finally {
      fs.rmSync(notADir, { force: true });
    }
  });
});
