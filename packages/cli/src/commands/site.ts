import { Command } from 'commander';
import type { ZodIssue } from 'zod';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { detectProject } from '../utils/project-detector';
import { siteConfigSchema } from '../utils/schema-loader';
import { outputResult, outputError, getErrorCode, formatError } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Pure functions
// ---------------------------------------------------------------------------

export interface ReadSiteConfigResult {
  content: string;
  path: string;
}

export function readSiteConfig(siteConfigPath: string): ReadSiteConfigResult {
  if (!fs.existsSync(siteConfigPath)) {
    const err = new Error(`Site config not found: ${siteConfigPath}`);
    (err as NodeJS.ErrnoException).code = 'NOT_A_PROJECT';
    throw err;
  }

  const content = fs.readFileSync(siteConfigPath, 'utf8');
  return { content, path: siteConfigPath };
}

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

export interface WriteSiteConfigResult {
  path: string;
  created: boolean;
}

const MAX_SITE_CONFIG_SIZE = 1_000_000; // 1MB — generous for any site config

export function writeSiteConfig(
  siteConfigPath: string,
  yamlContent: string
): WriteSiteConfigResult {
  if (yamlContent.length > MAX_SITE_CONFIG_SIZE) {
    const err = new Error(
      `Content too large (${yamlContent.length} chars, max ${MAX_SITE_CONFIG_SIZE})`
    );
    (err as NodeJS.ErrnoException).code = 'CONTENT_TOO_LARGE';
    throw err;
  }

  let raw: unknown;
  try {
    raw = yaml.load(yamlContent);
  } catch (parseErr) {
    const err = new Error(`YAML parse error: ${formatError(parseErr)}`);
    (err as NodeJS.ErrnoException).code = 'YAML_PARSE_ERROR';
    throw err;
  }

  const result = siteConfigSchema.safeParse(raw);
  if (!result.success) {
    const fieldErrors = result.error.issues.map((issue: ZodIssue) => {
      const fieldPath = issue.path.length > 0 ? issue.path.join('.') : '(root)';
      return `${fieldPath}: ${issue.message}`;
    });
    const err = new Error(`Validation failed:\n  ${fieldErrors.join('\n  ')}`);
    (err as NodeJS.ErrnoException).code = 'VALIDATION_FAILED';
    throw err;
  }

  const dir = path.dirname(siteConfigPath);
  if (!fs.existsSync(dir)) {
    const err = new Error(`Project directory does not exist: ${dir}`);
    (err as NodeJS.ErrnoException).code = 'INVALID_PROJECT_ROOT';
    throw err;
  }

  const created = !fs.existsSync(siteConfigPath);
  fs.writeFileSync(siteConfigPath, yamlContent, 'utf8');

  return { path: siteConfigPath, created };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerSite(program: Command): void {
  const site = program.command('site').description('Manage site configuration');

  site
    .command('get')
    .description('Read the raw YAML content of stackwright.yml')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const { siteConfig } = detectProject();
        const result = readSiteConfig(siteConfig);
        outputResult(result, { json }, () => {
          console.log(result.content);
        });
      } catch (err: unknown) {
        if (getErrorCode(err) === 'NOT_A_PROJECT') {
          outputError(formatError(err), 'NOT_A_PROJECT', { json });
        } else {
          outputError(formatError(err), 'READ_SITE_FAILED', { json }, 2);
        }
      }
    });

  site
    .command('write')
    .description('Write YAML content to stackwright.yml (validates before writing)')
    .option('--json', 'Output machine-readable JSON')
    .option('--file <path>', 'Read YAML content from a file instead of stdin')
    .action(async (opts: { json?: boolean; file?: string }) => {
      const json = Boolean(opts.json);
      try {
        const { siteConfig } = detectProject();
        let yamlContent: string;
        if (opts.file) {
          yamlContent = fs.readFileSync(opts.file, 'utf8');
        } else {
          const chunks: Buffer[] = [];
          for await (const chunk of process.stdin) {
            chunks.push(chunk);
          }
          yamlContent = Buffer.concat(chunks).toString('utf8');
        }
        const result = writeSiteConfig(siteConfig, yamlContent);
        outputResult(result, { json }, () => {
          const verb = result.created ? 'Created' : 'Updated';
          console.log(chalk.green(`${verb} site config at ${result.path}`));
        });
      } catch (err: unknown) {
        const code = getErrorCode(err);
        if (
          code === 'NOT_A_PROJECT' ||
          code === 'VALIDATION_FAILED' ||
          code === 'YAML_PARSE_ERROR'
        ) {
          outputError(formatError(err), code, { json });
        } else {
          outputError(formatError(err), 'WRITE_SITE_FAILED', { json }, 2);
        }
      }
    });

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
