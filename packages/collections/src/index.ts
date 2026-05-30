/**
 * @stackwright/collections
 *
 * CollectionProvider interface and file-backed implementation.
 * The interface contract lives in @stackwright/types so Pro providers
 * (OpenAPI, Contentful, Sanity, etc.) can implement it without depending
 * on this package.
 *
 * Pro providers (Contentful, Sanity, etc.) implement the same interface
 * in separate packages.
 */
export type {
  CollectionProvider,
  CollectionEntry,
  CollectionListOptions,
  CollectionListResult,
} from '@stackwright/types';
export { FileCollectionProvider } from './file-collection-provider';
export { S3CollectionProvider } from './s3-collection-provider';
export type { S3CollectionProviderOptions } from './s3-collection-provider';
