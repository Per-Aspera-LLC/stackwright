/**
 * Scaffold hook type re-exports.
 *
 * These types are now canonical in @stackwright/types. This file re-exports
 * them so existing imports from @stackwright/hooks-registry continue to work
 * unchanged.
 *
 * Do NOT re-add type definitions here — edit @stackwright/types instead.
 */
export type {
  ScaffoldHookType,
  HookHandler,
  ScaffoldHook,
  ScaffoldHookContext,
} from '@stackwright/types';
