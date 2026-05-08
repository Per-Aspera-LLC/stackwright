import { Command } from 'commander';
import { runPrebuild } from '@stackwright/build-scripts';
import { outputResult, outputError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export interface PrebuildResult {
  success: boolean;
  // runPrebuild() doesn't currently return counts — tracked as a follow-up
  // to contribute a return value upstream to @stackwright/build-scripts.
  processed: number;
  images: number;
}

export function runPrebuildCommand(projectRoot = process.cwd()): PrebuildResult {
  runPrebuild(projectRoot);
  return { success: true, processed: -1, images: -1 };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerPrebuild(program: Command): void {
  program
    .command('prebuild')
    .description('Process YAML content and co-located images for Next.js')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const result = runPrebuildCommand(process.cwd());
        outputResult(result, { json }, () => {
          // runPrebuild() writes its own human-readable output to stdout
        });
      } catch (err) {
        outputError(String(err), 'PREBUILD_FAILED', { json }, 2);
      }
    });
}
