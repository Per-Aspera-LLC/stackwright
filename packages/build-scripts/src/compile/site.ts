import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { siteConfigSchema, resolveEnvVarsDeep, checkForPlaintextSecret } from '@stackwright/types';
import type { PrebuildPlugin } from '@stackwright/types';
import { copyIfNewer, rewritePaths, isColocatablePath } from './path-utils';
import type { CompileContext } from './context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Process site config: copy co-located images to `public/images/config/`
 * and rewrite their paths to absolute public URLs.
 */
export function processSiteConfig(config: unknown, rootDir: string, imagesDir: string): unknown {
  return rewritePaths(config, (str) => {
    const isRelativeDot = str.startsWith('./') && isColocatablePath(str);
    const isBareFile =
      !str.includes('/') &&
      !str.startsWith('http') &&
      !str.startsWith('data:') &&
      isColocatablePath(str);

    if (!isRelativeDot && !isBareFile) return str;

    const srcPath = path.resolve(rootDir, isRelativeDot ? str : `./${str}`);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  WARNING: Config image not found: ${srcPath}`);
      return str;
    }

    const filename = path.basename(str);
    const destPath = path.join(imagesDir, 'config', filename);
    copyIfNewer(srcPath, destPath, rootDir);
    return `/images/config/${filename}`;
  });
}

/**
 * Audit integration auth fields for plaintext secrets before env var resolution.
 */
function auditIntegrationAuthSecrets(config: unknown): void {
  if (!config || typeof config !== 'object') return;
  const { integrations } = config as Record<string, unknown>;
  if (!Array.isArray(integrations)) return;

  for (const integration of integrations) {
    if (!integration || typeof integration !== 'object') continue;
    const { name, auth } = integration as Record<string, unknown>;
    if (!auth || typeof auth !== 'object') continue;

    const integrationLabel = typeof name === 'string' ? name : '(unnamed)';
    const authObj = auth as Record<string, unknown>;

    for (const field of ['token', 'value', 'password'] as const) {
      const fieldValue = authObj[field];
      if (typeof fieldValue !== 'string') continue;
      const warning = checkForPlaintextSecret(
        fieldValue,
        `integrations[${integrationLabel}].auth.${field}`
      );
      if (warning) console.warn(`  ${warning}`);
    }
  }
}

/**
 * Validate integration configs against plugin schemas.
 */
function validateIntegrationConfigs(integrations: unknown[], plugins: PrebuildPlugin[]): void {
  for (const integration of integrations) {
    if (!integration || typeof integration !== 'object') continue;
    const item = integration as Record<string, unknown>;
    const integrationType = item.type as string | undefined;
    if (!integrationType) continue;

    const pluginName = `integration-${integrationType}`;
    const plugin = plugins.find((p) => p.name === pluginName);

    if (!plugin) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `  WARNING: No plugin registered for integration type "${integrationType}". Config will be passed through without validation.`
        );
      }
      continue;
    }

    if (!plugin.configSchema) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `  WARNING: Plugin "${pluginName}" does not declare a configSchema. Config will be passed through without validation.`
        );
      }
      continue;
    }

    const result = plugin.configSchema.safeParse(item);
    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `    - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      throw new Error(
        `Invalid configuration for integration "${item.name}" (${item.type}):\n${details}`
      );
    }
  }
}

/** BCP 47 locale tag pattern. */
const LOCALE_TAG_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

/** Find locale-specific site config files (e.g. stackwright.fr.yml). */
export function findLocaleConfigFiles(
  projectRoot: string
): Array<{ locale: string; filePath: string }> {
  const results: Array<{ locale: string; filePath: string }> = [];
  if (!fs.existsSync(projectRoot)) return results;

  for (const entry of fs.readdirSync(projectRoot, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const localeMatch = entry.name.match(/^stackwright\.([^.]+)\.(yml|yaml)$/);
    if (!localeMatch) continue;
    const locale = localeMatch[1];
    if (LOCALE_TAG_REGEX.test(locale)) {
      results.push({ locale, filePath: path.join(projectRoot, entry.name) });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compile result returned by compileSite — callers that need the processed
 * config downstream (e.g. compileFonts, compileAll) consume this.
 */
export interface SiteCompileResult {
  /** Fully processed + env-resolved site config. Written to `_site.json`. */
  processedConfig: Record<string, unknown>;
}

/**
 * Compile site configuration and write `_site.json` (plus locale variants).
 *
 * Synchronous: all operations are file I/O (no network calls, no image processing).
 *
 * Steps:
 * 1. Parse + validate `stackwright.yml` against `siteConfigSchema`
 * 2. Copy co-located images, rewrite paths (`processSiteConfig`)
 * 3. Audit integration auth fields for plaintext secrets
 * 4. Resolve `$ENV_VAR` references (`resolveEnvVarsDeep`)
 * 5. Validate integration configs against plugin schemas
 * 6. Write `_site.json`
 * 7. Process locale variants (`stackwright.<locale>.yml`)
 *
 * NOTE: Theme merge step (findThemeOverrideFile + mergeThemeOverride) removed.
 * Theme data now lives in `_theme.json` via `compileTheme()`. Inline
 * `themeName`/`customTheme`/`fonts` keys in stackwright.yml pass through
 * unchanged into `_site.json` for this PR (Bead 4 cleans those up).
 */
export function compileSite(ctx: CompileContext): SiteCompileResult {
  const { projectRoot, contentOutDir, imagesDir, plugins } = ctx;

  fs.mkdirSync(contentOutDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });

  const siteConfigCandidates = [
    path.join(projectRoot, 'stackwright.yml'),
    path.join(projectRoot, 'stackwright.yaml'),
  ];
  const siteConfigFile = siteConfigCandidates.find((p) => fs.existsSync(p));
  if (!siteConfigFile) {
    throw new Error(`Site config not found. Expected stackwright.yml in: ${projectRoot}`);
  }

  console.log('\nProcessing site config...');
  const rawSiteConfig = yaml.load(fs.readFileSync(siteConfigFile, 'utf8'));

  const siteValidation = siteConfigSchema.safeParse(rawSiteConfig);
  if (!siteValidation.success) {
    const details = siteValidation.error.issues
      .map((issue) => {
        const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        return `  ${field}: ${issue.message}`;
      })
      .join('\n');
    throw new Error(`stackwright.yml is invalid:\n${details}`);
  }

  const processedConfig = processSiteConfig(rawSiteConfig, projectRoot, imagesDir);

  auditIntegrationAuthSecrets(processedConfig);

  const configWithEnvResolved = resolveEnvVarsDeep(processedConfig) as Record<string, unknown>;
  console.log('  [OK] Resolved environment variable references in integrations');

  if (plugins.length > 0) {
    const integrations = configWithEnvResolved.integrations;
    if (Array.isArray(integrations)) {
      validateIntegrationConfigs(integrations, plugins);
      console.log('  [OK] Validated integration configurations against plugin schemas');
    }
  }

  fs.writeFileSync(
    path.join(contentOutDir, '_site.json'),
    JSON.stringify(configWithEnvResolved, null, 2)
  );
  console.log('  OK _site.json');

  // Locale variants
  const localeConfigFiles = findLocaleConfigFiles(projectRoot);
  for (const { locale, filePath: localeFilePath } of localeConfigFiles) {
    const rawLocaleConfig = yaml.load(fs.readFileSync(localeFilePath, 'utf8'));
    const localeValidation = siteConfigSchema.safeParse(rawLocaleConfig);
    if (!localeValidation.success) {
      const details = localeValidation.error.issues
        .map((issue) => {
          const field = issue.path.length > 0 ? issue.path.join('.') : '(root)';
          return `  ${field}: ${issue.message}`;
        })
        .join('\n');
      console.warn(`  WARNING: stackwright.${locale}.yml is invalid -- skipping:\n${details}`);
      continue;
    }
    const processedLocaleConfig = processSiteConfig(rawLocaleConfig, projectRoot, imagesDir);
    const localeConfigWithEnvResolved = resolveEnvVarsDeep(processedLocaleConfig);
    fs.writeFileSync(
      path.join(contentOutDir, `_site.${locale}.json`),
      JSON.stringify(localeConfigWithEnvResolved, null, 2)
    );
    console.log(`  OK _site.${locale}.json`);
  }

  return { processedConfig: configWithEnvResolved };
}
