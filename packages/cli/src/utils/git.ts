import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/** Run a git command in the given working directory. */
export async function git(args: string[], cwd: string): Promise<ExecResult> {
  try {
    return await execFileAsync('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 });
  } catch (err: unknown) {
    const execErr = err as { stderr?: string; message?: string };
    const msg = execErr.stderr?.trim() || execErr.message || 'Unknown git error';
    const error = new Error(`git ${args[0]} failed: ${msg}`);
    (error as NodeJS.ErrnoException).code = 'GIT_ERROR';
    throw error;
  }
}

/** Run a gh CLI command in the given working directory. */
export async function gh(args: string[], cwd: string): Promise<ExecResult> {
  try {
    return await execFileAsync('gh', args, { cwd, maxBuffer: 10 * 1024 * 1024 });
  } catch (err: unknown) {
    const execErr = err as { stderr?: string; message?: string };
    const msg = execErr.stderr?.trim() || execErr.message || 'Unknown gh error';
    const error = new Error(`gh ${args[0]} failed: ${msg}`);
    (error as NodeJS.ErrnoException).code = 'GH_ERROR';
    throw error;
  }
}
