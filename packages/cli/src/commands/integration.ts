import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { outputResult, outputError, formatError } from '../utils/json-output';
import { readSiteConfig, writeSiteConfig } from './site';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntegrationEntry {
  type: 'openapi' | 'graphql' | 'rest';
  name: string;
  [key: string]: unknown;
}

export interface ListIntegrationsResult {
  integrations: IntegrationEntry[];
  path: string;
}

export interface GetIntegrationResult {
  integration: IntegrationEntry | null;
  path: string;
}

export interface AddIntegrationResult {
  path: string;
  created: boolean;
  updated: boolean;
}

// ---------------------------------------------------------------------------
// Pure functions (exported for programmatic use and MCP)
// ---------------------------------------------------------------------------

export function listIntegrations(siteConfigPath: string): ListIntegrationsResult {
  const { content, path: resolvedPath } = readSiteConfig(siteConfigPath);
  const raw = yaml.load(content) as Record<string, unknown>;
  const integrations = (raw?.integrations as IntegrationEntry[] | undefined) ?? [];
  return { integrations, path: resolvedPath };
}

export function getIntegration(siteConfigPath: string, name: string): GetIntegrationResult {
  const { integrations, path: resolvedPath } = listIntegrations(siteConfigPath);
  const integration = integrations.find((i) => i.name === name) ?? null;
  return { integration, path: resolvedPath };
}

export function addIntegration(
  siteConfigPath: string,
  entry: IntegrationEntry
): AddIntegrationResult {
  const { content, path: resolvedPath } = readSiteConfig(siteConfigPath);
  const raw = yaml.load(content) as Record<string, unknown>;
  const integrations = (raw?.integrations as IntegrationEntry[] | undefined) ?? [];

  const existingIdx = integrations.findIndex((i) => i.name === entry.name);
  const updated = existingIdx >= 0;
  if (updated) {
    integrations[existingIdx] = entry;
  } else {
    integrations.push(entry);
  }

  raw.integrations = integrations;
  const newContent = yaml.dump(raw, { lineWidth: 120 });
  writeSiteConfig(resolvedPath, newContent);
  return { path: resolvedPath, created: !updated, updated };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveSiteConfig(projectRoot: string): string {
  const candidates = ['stackwright.yml', 'stackwright.yaml'];
  for (const name of candidates) {
    const p = path.join(projectRoot, name);
    if (fs.existsSync(p)) return p;
  }
  return path.join(projectRoot, 'stackwright.yml');
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerIntegration(program: Command): void {
  const integration = program
    .command('integrations')
    .description('Manage Stackwright integrations (OpenAPI, GraphQL, REST)');

  integration
    .command('list')
    .description('List all configured integrations')
    .option('--project-root <path>', 'Path to project root', process.cwd())
    .option('--json', 'Output as JSON')
    .action((opts: { projectRoot: string; json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const siteConfigPath = resolveSiteConfig(opts.projectRoot);
        const result = listIntegrations(siteConfigPath);
        outputResult(result, { json }, () => {
          if (result.integrations.length === 0) {
            console.log(chalk.dim('No integrations configured.'));
            return;
          }
          console.log(chalk.bold(`Integrations (${result.integrations.length}):`));
          for (const i of result.integrations) {
            console.log(`  ${chalk.cyan(i.name)} ${chalk.dim(`[${i.type}]`)}`);
          }
        });
      } catch (err) {
        outputError(formatError(err), 'LIST_INTEGRATIONS_FAILED', { json });
      }
    });

  integration
    .command('get <name>')
    .description('Show details for a specific integration')
    .option('--project-root <path>', 'Path to project root', process.cwd())
    .option('--json', 'Output as JSON')
    .action((name: string, opts: { projectRoot: string; json?: boolean }) => {
      const json = Boolean(opts.json);
      try {
        const siteConfigPath = resolveSiteConfig(opts.projectRoot);
        const result = getIntegration(siteConfigPath, name);
        if (!result.integration) {
          outputError(`Integration "${name}" not found.`, 'NOT_FOUND', { json });
        }
        outputResult(result.integration, { json }, () => {
          console.log(chalk.bold(`Integration: ${result.integration!.name}`));
          console.log(yaml.dump(result.integration, { indent: 2 }));
        });
      } catch (err) {
        outputError(formatError(err), 'GET_INTEGRATION_FAILED', { json });
      }
    });

  integration
    .command('add')
    .description('Add or update an integration in stackwright.yml')
    .requiredOption('--name <name>', 'Integration name (kebab-case)')
    .requiredOption('--type <type>', 'Integration type: openapi, graphql, or rest')
    .option('--spec <path>', 'Path to OpenAPI spec file (for openapi type)')
    .option('--endpoint <url>', 'API endpoint URL (for graphql/rest type)')
    .option('--project-root <path>', 'Path to project root', process.cwd())
    .option('--json', 'Output as JSON')
    .action(
      (opts: {
        name: string;
        type: string;
        spec?: string;
        endpoint?: string;
        projectRoot: string;
        json?: boolean;
      }) => {
        const json = Boolean(opts.json);
        const { type } = opts;
        if (!['openapi', 'graphql', 'rest'].includes(type)) {
          outputError(`Invalid type "${type}". Must be: openapi, graphql, rest`, 'INVALID_TYPE', {
            json,
          });
        }
        try {
          const entry: IntegrationEntry = {
            type: type as 'openapi' | 'graphql' | 'rest',
            name: opts.name,
            ...(opts.spec ? { spec: opts.spec } : {}),
            ...(opts.endpoint ? { endpoint: opts.endpoint } : {}),
          };
          const siteConfigPath = resolveSiteConfig(opts.projectRoot);
          const result = addIntegration(siteConfigPath, entry);
          const verb = result.updated ? 'Updated' : 'Added';
          outputResult({ verb, path: result.path, integration: entry }, { json }, () => {
            console.log(
              chalk.green(`✓ ${verb} integration "${entry.name}" [${entry.type}] in ${result.path}`)
            );
          });
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code;
          outputError(
            formatError(err),
            code === 'VALIDATION_FAILED' ? 'VALIDATION_FAILED' : 'ADD_INTEGRATION_FAILED',
            { json },
            2
          );
        }
      }
    );
}
