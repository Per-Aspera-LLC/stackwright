/**
 * @stackwright/scaffold-core
 *
 * Hook system for extensible scaffold processing.
 * Re-exports from @stackwright/hooks-registry for backward compatibility.
 * Pro packages register hooks that run at lifecycle points.
 */

// Re-export all types from the shared registry
export type {
  ScaffoldHook,
  ScaffoldHookType,
  ScaffoldHookContext,
} from '@stackwright/hooks-registry';

// Re-export all registry functions
export {
  registerScaffoldHook,
  getScaffoldHooks,
  getScaffoldHooksForType,
  clearScaffoldHooks,
  resetForTesting,
  runScaffoldHooks,
} from '@stackwright/hooks-registry';
