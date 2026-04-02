/**
 * @stackwright/scaffold-core
 *
 * Hook system for extensible scaffold processing.
 * Pro packages register hooks that run at lifecycle points.
 */

// Types
export type {
  ScaffoldHookType,
  ScaffoldHook,
  ScaffoldHookOptions,
  ScaffoldHookContext,
} from './types/hooks';

// Registry functions
export {
  registerScaffoldHook,
  getScaffoldHooks,
  getScaffoldHooksForType,
  clearScaffoldHooks,
  runScaffoldHooks,
} from './registry';
