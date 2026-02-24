import type { Command } from 'commander';

/** The function shape that every CLI plugin must export as `registerCommands`. */
export type PluginRegistrar = (program: Command) => void;
