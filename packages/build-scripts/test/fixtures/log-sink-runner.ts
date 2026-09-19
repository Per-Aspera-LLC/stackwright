/**
 * Child-process runner for test/log-sink.test.ts.
 *
 * Runs a real runPrebuild() pass against a temp project and prints nothing
 * itself. Invoked via `tsx` in a subprocess so the test can inspect the
 * *actual* OS-level process.stdout of a separate process -- vitest's own
 * console interception makes in-process stdout assertions unreliable, so
 * this is the honest way to prove "zero bytes reach process.stdout".
 *
 * argv[2]: project root
 * argv[3]: log sink ('stdout' | 'stderr' | 'silent') or 'default' to skip
 *          calling setLogSink() entirely
 */
import { runPrebuild } from '../../src/prebuild';
import { setLogSink } from '../../src/log';

async function main(): Promise<void> {
  const [, , projectRoot, sinkArg] = process.argv;
  if (!projectRoot) {
    throw new Error('usage: log-sink-runner.ts <projectRoot> <sink>');
  }
  if (sinkArg && sinkArg !== 'default') {
    setLogSink(sinkArg as 'stdout' | 'stderr' | 'silent');
  }
  await runPrebuild(projectRoot);
}

main().catch((err) => {
  // Deliberately console.error (stderr) -- a runner-script failure, not a
  // build-scripts log line under test.
  console.error('log-sink-runner failed:', err);
  process.exit(1);
});
