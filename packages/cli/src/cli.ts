#!/usr/bin/env node
import { Command } from 'commander';
import { loadPlugins } from './utils/plugin-loader';
import { registerScaffold } from './commands/scaffold';
import { registerPage } from './commands/page';
import { registerSite } from './commands/site';
import { registerTypes } from './commands/types';
import { registerPrebuild } from './commands/prebuild';
import { registerTheme } from './commands/theme';
import { registerInfo } from './commands/info';
import { registerGenerateAgentDocs } from './commands/generate-agent-docs';
import { registerGitOps } from './commands/git-ops';
import { registerBoard } from './commands/board';
import { registerCollection } from './commands/collection';
import { registerCompose } from './commands/compose';
import { registerPreview } from './commands/preview';

const { version } = require('../package.json') as { version: string };

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('stackwright')
    .description('CLI for the Stackwright framework')
    .version(version)
    .option('--plugin-dir <path>', 'Load additional commands from a plugin directory');

  // Register built-in commands
  registerScaffold(program);
  registerPage(program);
  registerSite(program);
  registerTypes(program);
  registerPrebuild(program);
  registerTheme(program);
  registerInfo(program);
  registerGenerateAgentDocs(program);
  registerGitOps(program);
  registerBoard(program);
  registerCollection(program);
  registerCompose(program);
  registerPreview(program);

  // Pre-parse to extract global options (including --plugin-dir) before full dispatch.
  // parseOptions() does NOT dispatch commands — it only extracts options.
  program.parseOptions(process.argv.slice(2));
  const globalOpts = program.opts<{ pluginDir?: string }>();

  if (globalOpts.pluginDir) {
    await loadPlugins(globalOpts.pluginDir, program);
  }

  // Show help if no command provided
  if (process.argv.slice(2).length === 0) {
    program.outputHelp();
    process.exit(0);
  }

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  process.stderr.write(`Internal error: ${String(err)}\n`);
  process.exit(2);
});
