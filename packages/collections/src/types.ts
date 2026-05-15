/**
 * CollectionProvider — the core abstraction for Stackwright collections.
 *
 * Interface contracts have moved to @stackwright/types so they are accessible
 * to Pro packages and other consumers without a dependency on this package.
 * This file re-exports them for any internal consumers that import from ./types.
 *
 * Do NOT re-add type definitions here — edit @stackwright/types instead.
 */
export type {
  CollectionProvider,
  CollectionEntry,
  CollectionListOptions,
  CollectionListResult,
} from '@stackwright/types';
