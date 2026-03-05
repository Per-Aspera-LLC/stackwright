import { Command } from 'commander';
import type { ZodIssue } from 'zod';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { detectProject } from '../utils/project-detector';
import { siteConfigSchema } from '../utils/schema-loader';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

export interface SiteValidationError {
  field: string;
  message: string;
}

export interface SiteValidateResult {
  valid: boolean;
  errors: SiteValidationError[];
}

export function validateSite(siteConfigPath: string): SiteValidateResult {
  let raw: unknown;
  try {
    raw = yaml.load(fs.readFileSync(siteConfigPath, 'utf8'));
  } catch (err) {
    return {
      valid: false,
      errors: [{ field: '(root)', message: `Failed to parse YAML: ${String(err)}` }],
    };
  }

  const result = siteConfigSchema.safeParse(raw);
  if (result.success) return { valid: true, errors: [] };

  const errors: SiteValidationError[] = result.error.issues.map((issue: ZodIssue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));

  return { valid: false, errors };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerSite(program: Command): void {
  const site = program.command('site').description('Manage site configuration');

  site
    .command('validate')
    .description('Validate stackwright.yml against the site config schema')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { siteConfig } = detectProject();
        const result = validateSite(siteConfig);
        outputResult(result, { json }, () => {
          if (result.valid) {
            console.log(chalk.green('Site config is valid.'));
          } else {
            for (const e of result.errors) {
              console.log(chalk.red(`  ${e.field}: ${e.message}`));
            }
          }
        });
        if (!result.valid) process.exit(1);
      } catch (err: unknown) {
        if (getErrorCode(err) === 'NOT_A_PROJECT') {
          outputError(formatError(err), 'NOT_A_PROJECT', { json });
        } else {
          outputError(formatError(err), 'VALIDATE_FAILED', { json }, 2);
        }
      }
    });
}
