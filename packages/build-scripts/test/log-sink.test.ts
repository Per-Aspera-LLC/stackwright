import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync, spawnSync } from 'child_process';
import { setLogSink, getLogSink } from '../src/log';

// ---------------------------------------------------------------------------
// swp-w00k: MCP stdio transport reserves stdout exclusively for JSON-RPC
// frames. Any plain-text progress line on stdout during an in-process
// runPrebuild()/compile* call corrupts message framing for the client
// ("Failed to parse JSONRPC message from server" -- 552x in the R14 gate
// run). This test proves the fix at the source: with the stderr sink
// selected, ZERO bytes reach the real OS-level process.stdout during a full
// runPrebuild() pass against a real (temp-dir) fixture.
//
// Run via a real subprocess (not a mock, not a vitest console spy) so the
// assertion is against the actual stdout stream a downstream MCP client
// would be reading -- vitest's own console interception makes in-process
// stdout byte-counting unreliable.
// ---------------------------------------------------------------------------

const RUNNER = path.join(__dirname, 'fixtures', 'log-sink-runner.ts');
const TSX_BIN = path.join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'tsx');

function makeTmpProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sw-log-sink-test-'));
  fs.writeFileSync(
    path.join(root, 'stackwright.yml'),
    `
title: Test Site
navigation: []
appBar:
  titleText: Test Site
`
  );
  const aboutDir = path.join(root, 'pages', 'about');
  fs.mkdirSync(aboutDir, { recursive: true });
  fs.writeFileSync(path.join(aboutDir, 'content.yml'), 'content:\n  content_items: []\n');
  return root;
}

function runInSubprocess(root: string, sink: 'default' | 'stdout' | 'stderr' | 'silent') {
  const result = execFileSync(TSX_BIN, [RUNNER, root, sink], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result;
}

function runInSubprocessCapturingBoth(
  root: string,
  sink: 'default' | 'stdout' | 'stderr' | 'silent'
): { stdout: string; stderr: string } {
  const proc = spawnSync(TSX_BIN, [RUNNER, root, sink], { encoding: 'utf8' });
  if (proc.status !== 0) {
    throw new Error(`log-sink-runner exited ${proc.status}: ${proc.stderr}`);
  }
  return { stdout: proc.stdout, stderr: proc.stderr };
}

describe('log sink — swp-w00k (MCP stdio stdout corruption)', () => {
  let root: string;

  beforeEach(() => {
    root = makeTmpProject();
  });

  it('setLogSink defaults to stdout', () => {
    expect(getLogSink()).toBe('stdout');
    setLogSink('stdout'); // no-op, keeps default sane for other test files
  });

  it('with the default sink, a real subprocess DOES write to stdout', () => {
    const stdout = runInSubprocess(root, 'default');
    expect(stdout.length).toBeGreaterThan(0);
    expect(stdout).toContain('Stackwright prebuild starting...');
  });

  it('with setLogSink("stderr"), a full runPrebuild() pass writes ZERO bytes to stdout', () => {
    const { stdout, stderr } = runInSubprocessCapturingBoth(root, 'stderr');
    expect(stdout).toBe('');
    expect(stdout.length).toBe(0);
    // The progress lines still exist -- just on the correct stream.
    expect(stderr).toContain('Stackwright prebuild starting...');
  });

  it('with setLogSink("silent"), no progress output reaches either stream', () => {
    const { stdout, stderr } = runInSubprocessCapturingBoth(root, 'silent');
    expect(stdout).toBe('');
    expect(stderr).not.toContain('Stackwright prebuild starting...');
  });
});
