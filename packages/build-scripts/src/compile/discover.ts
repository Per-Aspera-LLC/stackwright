/**
 * Plugin auto-discovery for the stackwright-prebuild CLI.
 *
 * Resolves plugins in tier order using synchronous CJS require():
 *   Tier A — Convention: @stackwright-pro/build-scripts-plugins (soft-fail if absent)
 *   Tier B — Config: `prebuild.plugins` in stackwright.yml (hard-fail on typos)
 *
 * Tier C (explicit `plugins` array in PrebuildOptions) is handled by the
 * caller — if `plugins` is set, discovery is skipped entirely.
 *
 * ### Why synchronous require() instead of dynamic import()?
 *
 * `runWatch()` calls `runPrebuild()` without `await`, relying on the
 * invariant that all synchronous file writes happen BEFORE the first
 * `await` inside `runPrebuild`. Using `await import()` for discovery would
 * break that invariant. Since all current plugin packages are CJS (built with
 * tsup, never add `"type": "module"` per project rules), synchronous require()
 * covers all production cases. ESM-only plugins can be added as a follow-up.
 *
 * ### Resolution anchor
 *
 * `createRequire` is anchored to `projectRoot/noop.js`, so resolution
 * uses the PROJECT's node_modules, not build-scripts' own — correct in
 * both local development and monorepo setups.
 */

import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import yaml from 'js-yaml';
import type { PrebuildPlugin } from '@stackwright/types';

// ---------------------------------------------------------------------------
// Well-known names (exported for tests + AGENTS.md docs)
// ---------------------------------------------------------------------------

/**
 * The canonical Pro plugin bundle package name.
 * Intentional soft-coupling: the OSS package never has a hard dep on this —
 * it's resolved dynamically from the project's node_modules at runtime.
 */
export const CANONICAL_PRO_BUNDLE = '@stackwright-pro/build-scripts-plugins';

// ---------------------------------------------------------------------------
// Discovery options
// ---------------------------------------------------------------------------

export interface DiscoverPluginsOptions {
  /**
   * When `false`, skip all discovery and return [].
   * Mirrors the `--no-plugin-discovery` CLI flag.
   */
  enabled?: boolean;

  /**
   * When provided, skip Tier A + Tier B entirely and load only these
   * package names (Tier B resolution logic, hard-fail on missing packages).
   * Mirrors the `--plugins pkg-a,pkg-b` CLI flag.
   */
  overrideList?: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a require() resolver anchored to `projectRoot/noop.js`.
 * This makes module resolution use the project's node_modules, not ours.
 */
function makeProjectRequire(projectRoot: string): NodeRequire {
  return createRequire(pathToFileURL(path.join(projectRoot, 'noop.js')).href);
}

/**
 * Extract a plugin array from a CJS `module.exports` value.
 *
 * Accepts (in priority order):
 *   - `exports.proPlugins`  (array)  — Pro bundle convention
 *   - `exports.plugins`     (array)  — generic naming
 *   - `exports`             (array)  — module.exports IS the array
 *   - `exports.plugin`      (object) — single plugin, wrapped in array
 *   - `exports`             (object with .name) — single plugin as default export
 *
 * Returns null and warns if nothing recognizable was found.
 */
function extractPluginsFromCJS(
  mod: Record<string, any>,
  packageName: string
): PrebuildPlugin[] | null {
  const candidates = [
    mod.proPlugins,
    mod.plugins,
    Array.isArray(mod) ? mod : null, // module.exports = [plugin1, plugin2]
    mod.plugin,
    mod.default?.proPlugins, // unusual but defensive
    mod.default?.plugins,
    typeof mod.name === 'string' ? mod : null, // module.exports = { name: '...', ... }
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) return candidate as PrebuildPlugin[];
    if (typeof candidate === 'object' && typeof candidate.name === 'string') {
      return [candidate as PrebuildPlugin];
    }
  }

  console.warn(
    `  [WARN] Plugin package "${packageName}" was resolved but no recognized export found.\n` +
      `         Expected: proPlugins, plugins, plugin, or the default export (array or plugin object).`
  );
  return null;
}

/**
 * Synchronously load a plugin package from the project's node_modules.
 *
 * @param packageName   - e.g. '@stackwright-pro/build-scripts-plugins'
 * @param projectRequire - createRequire'd to the project root
 * @param hardFail      - if true, throw on resolution failure (config tier behavior)
 */
function loadPackageSync(
  packageName: string,
  projectRequire: NodeRequire,
  hardFail: boolean
): PrebuildPlugin[] | null {
  let mod: unknown;
  try {
    mod = projectRequire(packageName);
  } catch {
    if (hardFail) {
      throw new Error(
        `[prebuild] Plugin package "${packageName}" could not be resolved from the project's node_modules.\n` +
          `  Make sure it is listed in your project's dependencies and installed.`
      );
    }
    return null; // Soft fail — normal OSS case when Pro bundle is absent
  }

  if (!mod || typeof mod !== 'object') {
    console.warn(`  [WARN] Plugin package "${packageName}" exported a non-object value.`);
    return null;
  }

  return extractPluginsFromCJS(mod as Record<string, any>, packageName);
}

/**
 * Read `prebuild.plugins` from stackwright.yml (Tier B config).
 * Returns [] if the file or the section is absent (silent skip).
 */
function readConfigPluginNames(projectRoot: string): string[] {
  const candidates = ['stackwright.yml', 'stackwright.yaml'];
  for (const filename of candidates) {
    const filePath = path.join(projectRoot, filename);
    if (!fs.existsSync(filePath)) continue;

    let raw: unknown;
    try {
      raw = yaml.load(fs.readFileSync(filePath, 'utf8'));
    } catch {
      return [];
    }

    if (!raw || typeof raw !== 'object') return [];
    const config = raw as Record<string, unknown>;
    const prebuild = config.prebuild as Record<string, unknown> | undefined;
    if (!prebuild || !Array.isArray(prebuild.plugins)) return [];
    return (prebuild.plugins as unknown[]).filter((p) => typeof p === 'string') as string[];
  }
  return [];
}

// ---------------------------------------------------------------------------
// De-duplication
// ---------------------------------------------------------------------------

/**
 * Merge plugin arrays, keeping the first occurrence when plugin.name collides.
 */
function deduplicatePlugins(plugins: PrebuildPlugin[]): PrebuildPlugin[] {
  const seen = new Set<string>();
  const result: PrebuildPlugin[] = [];
  for (const plugin of plugins) {
    if (seen.has(plugin.name)) {
      console.log(`  [DEBUG] Skipping duplicate plugin: ${plugin.name}`);
      continue;
    }
    seen.add(plugin.name);
    result.push(plugin);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Discover prebuild plugins for the given project root.
 *
 * Fully synchronous — uses CJS require() so it doesn't introduce an async
 * yield point before the synchronous file-write phase of runPrebuild.
 *
 * Resolution order:
 *   1. If `options.enabled === false` → return [] immediately.
 *   2. If `options.overrideList` is provided → load exactly those packages
 *      (hard-fail on any missing), skip Tier A/B.
 *   3. Tier A: try to load CANONICAL_PRO_BUNDLE from project node_modules (soft-fail).
 *   4. Tier B: read `prebuild.plugins` from stackwright.yml, load each (hard-fail on missing).
 *   5. De-duplicate by plugin.name (first wins).
 *
 * @param projectRoot - Absolute path to the project (where stackwright.yml lives).
 * @param options     - Discovery behavior overrides.
 */
export function discoverPlugins(
  projectRoot: string,
  options: DiscoverPluginsOptions = {}
): PrebuildPlugin[] {
  if (options.enabled === false) {
    return [];
  }

  const projectRequire = makeProjectRequire(projectRoot);
  const discovered: PrebuildPlugin[] = [];

  // --- Override list (mirrors --plugins CLI flag) --------------------------
  if (options.overrideList && options.overrideList.length > 0) {
    for (const packageName of options.overrideList) {
      const loaded = loadPackageSync(packageName, projectRequire, /* hardFail */ true);
      if (loaded) {
        console.log(`  [OK] Discovered plugin: ${packageName} (override)`);
        discovered.push(...loaded);
      }
    }
    return deduplicatePlugins(discovered);
  }

  // --- Tier A: Convention --------------------------------------------------
  const tierAPlugins = loadPackageSync(CANONICAL_PRO_BUNDLE, projectRequire, /* hardFail */ false);
  if (tierAPlugins) {
    console.log(`  [OK] Discovered plugins: ${CANONICAL_PRO_BUNDLE} (convention)`);
    discovered.push(...tierAPlugins);
  }

  // --- Tier B: Config -------------------------------------------------------
  const configPluginNames = readConfigPluginNames(projectRoot);
  for (const packageName of configPluginNames) {
    const loaded = loadPackageSync(packageName, projectRequire, /* hardFail */ true);
    if (loaded) {
      console.log(`  [OK] Discovered plugin: ${packageName} (config)`);
      discovered.push(...loaded);
    }
  }

  return deduplicatePlugins(discovered);
}
