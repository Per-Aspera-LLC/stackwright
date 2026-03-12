/**
 * @stackwright/collections
 *
 * CollectionProvider interface and file-backed implementation.
 * Pro providers (Contentful, Sanity, etc.) implement the same interface
 * in separate packages.
 */
export type {
  CollectionProvider,
  CollectionEntry,
  CollectionListOptions,
  CollectionListResult,
} from './types';
export { FileCollectionProvider } from './file-collection-provider';
