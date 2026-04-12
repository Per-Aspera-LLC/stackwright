/**
 * @stackwright/hooks-registry
 *
 * Singleton registry for scaffold hooks.
 * Uses Symbol.for() to survive module boundary crossings between different package copies.
 */

// Types re-export
export type { ScaffoldHook, ScaffoldHookType, ScaffoldHookContext } from './hooks';

// Registry functions
export {
  registerScaffoldHook,
  getScaffoldHooks,
  getScaffoldHooksForType,
  clearScaffoldHooks,
  resetForTesting,
  runScaffoldHooks,
} from './registry';
