import fs from 'fs-extra';
import path from 'path';
import { Command } from 'commander';
import type { PluginRegistrar } from '../types';

/**
 * Loads CLI plugins from a directory. Each .js / .cjs file that exports
 * `registerCommands` will have that function called with the Commander program.
 *
 * Note: ESM (.mjs) plugins are not supported in v1. Plugins must be CJS.
 * The function is async so the call site is future-proof for dynamic import().
 */
export async function loadPlugins(pluginDir: string, program: Command): Promise<void> {
  if (!fs.existsSync(pluginDir)) {
    throw new Error(`Plugin directory not found: ${pluginDir}`);
  }

  const entries = fs
    .readdirSync(pluginDir)
    .filter((f) => /\.(js|cjs)$/.test(f))
    .sort();

  for (const file of entries) {
    const fullPath = path.join(pluginDir, file);
    try {
      const mod = require(fullPath) as { registerCommands?: PluginRegistrar };
      if (typeof mod.registerCommands === 'function') {
        mod.registerCommands(program);
      }
    } catch (err) {
      process.stderr.write(`Warning: Failed to load plugin ${file}: ${String(err)}\n`);
    }
  }
}
