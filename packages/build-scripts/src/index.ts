/**
 * @stackwright/build-scripts
 *
 * Programmatic API for Stackwright build utilities.
 * For CLI usage, use the `stackwright-prebuild` binary.
 */
export { runPrebuild } from './prebuild';
export { runWatch } from './watch';
export type { PrebuildOptions, PrebuildPlugin, PrebuildPluginContext } from '@stackwright/types';
