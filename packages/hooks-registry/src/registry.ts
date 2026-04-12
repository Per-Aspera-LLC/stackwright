/**
 * Scaffold Hook Registry
 *
 * Singleton registry using Symbol.for() to survive module boundary crossings.
 * This allows the registry to work correctly even when multiple copies of this
 * package are loaded by different parts of the monorepo.
 */

import type { ScaffoldHook, ScaffoldHookType, ScaffoldHookContext } from './hooks';

/**
 * Singleton key for cross-module registry sharing
 */
const REGISTRY_KEY = Symbol.for('@stackwright/hooks-registry:hooks');

/**
 * Get or create the shared registry
 * Uses Symbol.for() so multiple module instances share the same storage
 */
function getRegistry(): Map<string, HookEntry> {
  const global = globalThis as typeof globalThis & {
    [REGISTRY_KEY]?: Map<string, HookEntry>;
  };
  if (!global[REGISTRY_KEY]) {
    global[REGISTRY_KEY] = new Map();
  }
  return global[REGISTRY_KEY]!;
}

/**
 * Hook entry stored in registry
 */
interface HookEntry {
  type: ScaffoldHookType;
  name: string;
  priority: number;
  critical: boolean;
  handler: (context: any) => Promise<void> | void;
}

/**
 * Register a hook to run during scaffolding
 *
 * @example
 * import { registerScaffoldHook } from '@stackwright/hooks-registry';
 *
 * registerScaffoldHook({
 *   type: 'preInstall',
 *   name: 'enterprise-license',
 *   priority: 10,
 *   handler: addEnterpriseLicense,
 * });
 */
export function registerScaffoldHook(hook: ScaffoldHook): void {
  const registry = getRegistry();
  registry.set(hook.name, {
    type: hook.type,
    name: hook.name,
    priority: hook.priority ?? 50,
    critical: hook.critical ?? false,
    handler: hook.handler,
  });
}

/**
 * Get all registered hooks, sorted by priority
 */
export function getScaffoldHooks(): ReadonlyArray<ScaffoldHook> {
  const registry = getRegistry();
  const entries = Array.from(registry.values());
  return entries
    .sort((a, b) => a.priority - b.priority)
    .map((entry) => ({
      type: entry.type,
      name: entry.name,
      priority: entry.priority,
      critical: entry.critical,
      handler: entry.handler,
    }));
}

/**
 * Get hooks for a specific lifecycle point, sorted by priority
 */
export function getScaffoldHooksForType(type: ScaffoldHookType): ReadonlyArray<ScaffoldHook> {
  return getScaffoldHooks().filter((h) => h.type === type);
}

/**
 * Clear all registered hooks
 */
export function clearScaffoldHooks(): void {
  getRegistry().clear();
}

/**
 * Reset registry for testing isolation.
 * Combines clearing hooks with resetting global state.
 */
export function resetForTesting(): void {
  clearScaffoldHooks();
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

// Re-export types from hooks.ts
export type { ScaffoldHook, ScaffoldHookType, ScaffoldHookContext } from './hooks';
