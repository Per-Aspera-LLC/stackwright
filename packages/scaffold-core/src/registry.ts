/**
 * Scaffold Hook Registry
 *
 * Singleton registry for scaffold hooks. Pro packages auto-register by importing.
 */

import type { ScaffoldHook, ScaffoldHookContext, ScaffoldHookType } from './types/hooks';

// Internal storage
let hooks: ScaffoldHook[] = [];

/**
 * Register a hook to run during scaffolding
 *
 * @example
 * import { registerScaffoldHook } from '@stackwright/scaffold-core';
 *
 * registerScaffoldHook({
 *   type: 'preInstall',
 *   name: 'enterprise-license',
 *   priority: 10,
 *   handler: addEnterpriseLicense,
 * });
 */
export function registerScaffoldHook(hook: ScaffoldHook): void {
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
export function getScaffoldHooks(): ReadonlyArray<ScaffoldHook> {
  return [...hooks];
}

/**
 * Get hooks for a specific lifecycle point
 */
export function getScaffoldHooksForType(type: ScaffoldHookType): ReadonlyArray<ScaffoldHook> {
  return hooks.filter((h) => h.type === type);
}

/**
 * Clear all registered hooks (useful for testing)
 */
export function clearScaffoldHooks(): void {
  hooks = [];
}

/**
 * Run all hooks of a given type
 *
 * @param type - Lifecycle point
 * @param context - Context passed to hooks
 * @throws If a critical hook fails
 */
export async function runScaffoldHooks(
  type: ScaffoldHookType,
  context: ScaffoldHookContext
): Promise<void> {
  const relevantHooks = getScaffoldHooksForType(type);

  for (const hook of relevantHooks) {
    try {
      await hook.handler(context);
    } catch (error) {
      if (hook.critical) {
        throw new Error(
          `Critical scaffold hook "${hook.name}" failed: ${(error as Error).message}`
        );
      }
      // Non-critical: warn but continue
      console.warn(
        `[Scaffold Hook] Non-critical hook "${hook.name}" failed: ${(error as Error).message}`
      );
    }
  }
}
