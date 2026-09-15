/**
 * Build-time guard: stackwright.yml's appBar/footer/sidebar textColor and
 * backgroundColor fields must reference a color the runtime can actually
 * resolve. Before stackwright-819 / swp-rlih, an unrecognized token (e.g.
 * `primary-foreground`, which colorsSchema's old 7-key .strip()'d away)
 * would silently reach the browser as a literal, unparseable CSS value —
 * this guard turns that into a loud, build-fatal error with the offending
 * config path, the bad value, and the full list of accepted tokens.
 *
 * Runs from `compileSite()`, so it covers both `stackwright-prebuild` and
 * `stackwright-prebuild --watch` (watch.ts's rebuild loop calls
 * `runPrebuild` -> `compileAll` -> `compileSite` on every change, same as
 * the initial build — no separate code path to fall out of sync, unlike
 * the plugin-bypass gap fixed for swp-ah1o).
 */

import fs from 'fs';
import path from 'path';
import { THEME_COLOR_KEYS, KEBAB_COLOR_ALIASES } from '@stackwright/themes';

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Fields on appBar/footer/sidebar that carry a color reference. */
const COLOR_FIELDS = ['textColor', 'backgroundColor'] as const;

/** Top-level siteConfig sections this guard checks. */
const CHECKED_SECTIONS = ['appBar', 'footer', 'sidebar'] as const;

/**
 * Parses `--sw-color-<name>: ...` custom property declarations out of a
 * compiled theme CSS file, returning the `<name>` portion (kebab-case,
 * prefix already stripped) for each. Used to extend the allowed vocabulary
 * with whatever a Pro (or other) plugin actually emitted for this project
 * — e.g. `@stackwright-pro/build-scripts-plugins` emits a richer token set
 * than the OSS 12 (7 base + 5 foreground) via `_theme-tokens.css`.
 */
export function extractThemeCssTokenNames(cssContent: string): string[] {
  const names = new Set<string>();
  const pattern = /--sw-color-([a-z0-9-]+)\s*:/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(cssContent)) !== null) {
    names.add(match[1].toLowerCase());
  }
  return [...names];
}

/**
 * Reads the project's compiled theme CSS, if present, and returns the set
 * of `--sw-color-*` token names it declares (kebab, prefix stripped).
 * Returns an empty array when the file doesn't exist (e.g. OSS-only
 * project, or first build before any plugin has run).
 */
function readExtendedThemeCssVocabulary(projectRoot: string): string[] {
  const cssPath = path.join(projectRoot, 'public', 'stackwright-content', '_theme-tokens.css');
  if (!fs.existsSync(cssPath)) return [];
  try {
    return extractThemeCssTokenNames(fs.readFileSync(cssPath, 'utf8'));
  } catch {
    // Unreadable/malformed file — don't let a vocabulary-extension read
    // fail the build; the base OSS vocabulary is still fully enforced.
    return [];
  }
}

/** Builds the full set of non-hex color tokens this project's build accepts. */
function buildAllowedTokenSet(projectRoot: string): Set<string> {
  const allowed = new Set<string>();
  for (const key of THEME_COLOR_KEYS) allowed.add(key);
  for (const kebabAlias of Object.keys(KEBAB_COLOR_ALIASES)) allowed.add(kebabAlias);
  for (const cssToken of readExtendedThemeCssVocabulary(projectRoot)) allowed.add(cssToken);
  return allowed;
}

interface ColorRef {
  /** Dot path for the error message, e.g. "appBar.textColor". */
  configPath: string;
  value: string;
}

function collectColorRefs(config: Record<string, unknown>): ColorRef[] {
  const refs: ColorRef[] = [];
  for (const section of CHECKED_SECTIONS) {
    const sectionValue = config[section];
    if (!sectionValue || typeof sectionValue !== 'object') continue;
    const sectionObj = sectionValue as Record<string, unknown>;
    for (const field of COLOR_FIELDS) {
      const value = sectionObj[field];
      if (typeof value === 'string' && value.length > 0) {
        refs.push({ configPath: `${section}.${field}`, value });
      }
    }
  }
  return refs;
}

/**
 * Validates every `textColor`/`backgroundColor` reference under
 * `appBar`/`footer`/`sidebar` in a processed site config. Throws a
 * BUILD-FATAL error (never a warning) on the first unrecognized token.
 */
export function validateSiteColorRefs(config: Record<string, unknown>, projectRoot: string): void {
  const refs = collectColorRefs(config);
  if (refs.length === 0) return;

  const allowedTokens = buildAllowedTokenSet(projectRoot);

  for (const { configPath, value } of refs) {
    if (HEX_COLOR_PATTERN.test(value)) continue;
    if (allowedTokens.has(value)) continue;

    const allowedList = [...allowedTokens].sort().join(', ');
    throw new Error(
      `BUILD-FATAL: siteConfig.${configPath} references unknown color token "${value}".\n` +
        `Allowed: <hex color> (e.g. #1a365d), ${allowedList}`
    );
  }
}
