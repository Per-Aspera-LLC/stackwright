/**
 * SBOM Hook Registry
 *
 * Singleton registry for SBOM hooks. Pro packages auto-register by importing.
 * Consistent with Stackwright's registerXxx() pattern:
 * - @stackwright/icons → registerDefaultIcons()
 * - @stackwright/nextjs → registerNextJSComponents()
 * - @stackwright/maplibre → registerMapLibreProvider()
 */

import type { SBOMHook, SBOMHookContext, SBOMHookType } from './types/hooks';

// Internal storage
let hooks: SBOMHook[] = [];

/**
 * Register a hook to run during SBOM generation
 *
 * @example
 * import { registerSBOMHook } from '@stackwright/sbom-generator';
 *
 * registerSBOMHook({
 *   type: 'postAnalyze',
 *   name: 'cve-enrichment',
 *   priority: 10,
 *   handler: enrichWithCVEs,
 * });
 */
export function registerSBOMHook(hook: SBOMHook): void {
  hooks.push({
    ...hook,
    priority: hook.priority ?? 50,
    critical: hook.critical ?? false,
  });
  // Sort by priority (lower = runs first)
  hooks.sort((a, b) => a.priority! - b.priority!);
}

/**
 * Get all registered hooks
 */
export function getSBOMHooks(): ReadonlyArray<SBOMHook> {
  return [...hooks];
}

/**
 * Get hooks for a specific lifecycle point
 */
export function getHooksForType(type: SBOMHookType): ReadonlyArray<SBOMHook> {
  return hooks.filter((h) => h.type === type);
}

/**
 * Clear all registered hooks (useful for testing)
 */
export function clearSBOMHooks(): void {
  hooks = [];
}

/**
 * Run all hooks of a given type
 *
 * @param type - Lifecycle point
 * @param context - Context passed to hooks
 * @throws If a critical hook fails
 */
export async function runSBOMHooks(type: SBOMHookType, context: SBOMHookContext): Promise<void> {
  const relevantHooks = getHooksForType(type);

  for (const hook of relevantHooks) {
    try {
      await hook.handler(context);
    } catch (error) {
      if (hook.critical) {
        throw new Error(`Critical SBOM hook "${hook.name}" failed: ${(error as Error).message}`);
      }
      // Non-critical: warn but continue
      console.warn(
        `[SBOM Hook] Non-critical hook "${hook.name}" failed: ${(error as Error).message}`
      );
    }
  }
}
