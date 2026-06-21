import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { stackwrightThemeFileSchema } from '@stackwright/types';
import type { CompileContext } from './context';

/**
 * Names we scan for when looking for a dedicated theme file.
 * Checked in order — first match wins.
 */
const THEME_FILE_CANDIDATES = ['stackwright.theme.yml', 'stackwright.theme.yaml'] as const;

/**
 * Top-level keys from `stackwright.yml` that represent theme configuration.
 * Used when extracting a fallback `_theme.json` from the main site config.
 */
const THEME_KEYS_FROM_SITE_CONFIG = ['themeName', 'customTheme', 'fonts'] as const;

/**
 * Find `stackwright.theme.yml` / `.yaml` in the project root.
 * Returns the absolute path if found, otherwise `null`.
 */
function findThemeFile(projectRoot: string): string | null {
  for (const name of THEME_FILE_CANDIDATES) {
    const candidate = path.join(projectRoot, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Compile theme configuration and write `_theme.json`.
 *
 * Resolution order:
 * 1. If `stackwright.theme.yml` / `.yaml` exists → validate against
 *    `stackwrightThemeFileSchema` and write as `_theme.json`.
 * 2. Otherwise → read `stackwright.yml`, extract the theme-relevant keys
 *    (`themeName`, `customTheme`, `fonts`), validate, and write.
 * 3. If neither source has any theme info → write `{}` so consumers can
 *    always read one JSON shape unconditionally and fall through to defaults.
 *
 * `_theme.json` is ALWAYS written, even when empty.
 */
/**
 * Synchronous: all operations are YAML parsing and file writes.
 */
export function compileTheme(ctx: CompileContext): void {
  const { projectRoot, contentOutDir } = ctx;

  fs.mkdirSync(contentOutDir, { recursive: true });

  const themeFilePath = findThemeFile(projectRoot);

  if (themeFilePath) {
    // --- Path 1: dedicated stackwright.theme.yml -------------------------
    console.log('\nCompiling theme (stackwright.theme.yml)...');

    let rawTheme: unknown;
    try {
      rawTheme = yaml.load(fs.readFileSync(themeFilePath, 'utf8'));
    } catch (err) {
      throw new Error(
        `Failed to parse ${path.basename(themeFilePath)}: ${(err as Error).message}`
      );
    }

    const validation = stackwrightThemeFileSchema.safeParse(rawTheme ?? {});
    if (!validation.success) {
      const details = validation.error.issues
        .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      throw new Error(`${path.basename(themeFilePath)} is invalid:\n${details}`);
    }

    fs.writeFileSync(
      path.join(contentOutDir, '_theme.json'),
      JSON.stringify(validation.data, null, 2)
    );
    console.log('  OK _theme.json (from stackwright.theme.yml)');
    return;
  }

  // --- Path 2: extract from stackwright.yml --------------------------------
  const siteConfigCandidates = [
    path.join(projectRoot, 'stackwright.yml'),
    path.join(projectRoot, 'stackwright.yaml'),
  ];
  const siteConfigFile = siteConfigCandidates.find((p) => fs.existsSync(p));

  if (siteConfigFile) {
    console.log('\nCompiling theme (extracted from stackwright.yml)...');

    let rawSite: unknown;
    try {
      rawSite = yaml.load(fs.readFileSync(siteConfigFile, 'utf8'));
    } catch (err) {
      throw new Error(`Failed to parse stackwright.yml: ${(err as Error).message}`);
    }

    const siteObj = (rawSite ?? {}) as Record<string, unknown>;
    const extracted: Record<string, unknown> = {};
    for (const key of THEME_KEYS_FROM_SITE_CONFIG) {
      if (siteObj[key] !== undefined) {
        extracted[key] = siteObj[key];
      }
    }

    const validation = stackwrightThemeFileSchema.safeParse(extracted);
    if (!validation.success) {
      // Inline theme keys in stackwright.yml failed the theme schema — warn and emit empty
      const details = validation.error.issues
        .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');
      console.warn(
        `  WARNING: Theme keys in stackwright.yml failed validation — emitting empty _theme.json:\n${details}`
      );
      fs.writeFileSync(path.join(contentOutDir, '_theme.json'), JSON.stringify({}, null, 2));
      return;
    }

    fs.writeFileSync(
      path.join(contentOutDir, '_theme.json'),
      JSON.stringify(validation.data, null, 2)
    );
    console.log('  OK _theme.json (extracted from stackwright.yml)');
    return;
  }

  // --- Path 3: nothing to work with ----------------------------------------
  fs.writeFileSync(path.join(contentOutDir, '_theme.json'), JSON.stringify({}, null, 2));
  console.log('  OK _theme.json (empty — no theme config found)');
}
