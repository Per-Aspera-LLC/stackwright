import chalk from 'chalk';

export interface JsonErrorPayload {
  error: string;
  code: string;
}

/** Safely extracts a `.code` property from an unknown caught value. */
export function getErrorCode(err: unknown): string | undefined {
  if (err instanceof Error && 'code' in err) {
    return (err as NodeJS.ErrnoException).code;
  }
  return undefined;
}

/** Formats an unknown error as a human-readable string. */
export function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function outputResult(data: unknown, opts: { json: boolean }, humanFn: () => void): void {
  if (opts.json) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    humanFn();
  }
}

export function outputError(
  message: string,
  code: string,
  opts: { json: boolean },
  exitCode: 1 | 2 = 1
): never {
  if (opts.json) {
    console.log(JSON.stringify({ error: message, code } satisfies JsonErrorPayload, null, 2));
  } else {
    process.stderr.write(chalk.red(`Error [${code}]: ${message}\n`));
  }
  process.exit(exitCode);
}
