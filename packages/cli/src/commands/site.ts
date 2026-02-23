import { Command } from 'commander';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import { detectProject } from '../utils/project-detector';
import { loadSiteConfigSchema } from '../utils/schema-loader';
import { outputResult, outputError } from '../utils/json-output';

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
  const schema = loadSiteConfigSchema();
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  let raw: unknown;
  try {
    raw = yaml.load(fs.readFileSync(siteConfigPath, 'utf8'));
  } catch (err) {
    return {
      valid: false,
      errors: [{ field: '(root)', message: `Failed to parse YAML: ${String(err)}` }],
    };
  }

  const valid = validate(raw);
  if (valid) return { valid: true, errors: [] };

  const errors: SiteValidationError[] = (validate.errors ?? []).map((e) => ({
    field: e.instancePath || '(root)',
    message: e.message ?? 'invalid',
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
        const e = err as NodeJS.ErrnoException;
        if (e.code === 'NOT_A_PROJECT') {
          outputError(e.message, 'NOT_A_PROJECT', { json });
        }
        outputError(String(err), 'VALIDATE_FAILED', { json }, 2);
      }
    });
}
