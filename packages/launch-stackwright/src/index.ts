#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { execSync } from 'child_process';

import { scaffold, ScaffoldOptions } from '@stackwright/cli';
import {
  registerScaffoldHook,
  clearScaffoldHooks,
  type ScaffoldHookContext,
} from '@stackwright/scaffold-core';

const { version } = require('../package.json') as { version: string };

interface LaunchOptions {
  name?: string;
  title?: string;
  theme?: string;
  force?: boolean;
  skipOtters?: boolean;
  otterRaft?: boolean;
  yes?: boolean;
}

/**
 * Register the MCP config hook for Code Puppy integration.
 * This hook runs during scaffold's preInstall phase and populates
 * ctx.codePuppyConfig, which processTemplate writes to .code-puppy.json.
 */
function registerLaunchHooks(): void {
  registerScaffoldHook({
    type: 'preInstall',
    name: 'code-puppy-mcp-config',
    priority: 10, // Run early
    handler: async (ctx: ScaffoldHookContext) => {
      ctx.codePuppyConfig = {
        mcp_servers: {
          stackwright: {
            command: 'node',
            args: ['node_modules/@stackwright/mcp/dist/server.js'],
            env: {
              NODE_ENV: 'development',
            },
          },
        },
        agents_path: 'node_modules/@stackwright/otters',
      };
    },
  });
}

function _setupOtterRaft(targetDir: string): void {
  console.log(chalk.cyan('\n🦦 Installing the otter raft...\n'));

  try {
    execSync('pnpm install', {
      cwd: targetDir,
      stdio: 'inherit',
    });
    console.log(chalk.green('\n✅ Otter raft is ready!'));
  } catch {
    console.log(chalk.yellow('\n⚠️  Could not run pnpm install automatically.'));
    console.log(chalk.white(`\nPlease run these commands manually:`));
    console.log(chalk.cyan(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`));
    console.log(chalk.cyan(`  pnpm install`));
    throw new Error('Otter raft setup failed');
  }
}

async function launch(targetDir: string, options: LaunchOptions): Promise<void> {
  const dirName = path.basename(targetDir);

  console.log(chalk.cyan.bold('\n🚢 Launching Stackwright...\n'));

  // Use the scaffold function from @stackwright/cli
  const scaffoldOptions: ScaffoldOptions = {
    name: options.name || dirName,
    title: options.title,
    theme: options.theme,
    force: options.force,
    noInteractive: options.yes,
  };

  try {
    // Register launch-specific hooks BEFORE scaffold runs
    if (!options.skipOtters) {
      console.log(chalk.cyan('\n🦪 Setting up the otter raft...\n'));
      registerLaunchHooks();
    }

    // Scaffold with install=true so preInstall/postInstall hooks run
    const result = await scaffold(targetDir, {
      ...scaffoldOptions,
      install: true,
    });

    console.log(chalk.green(`\n✅ Project scaffolded successfully!`));
    console.log(chalk.dim(`   Location: ${result.path}`));
    console.log(chalk.dim(`   Theme: ${result.theme}`));
    console.log(chalk.dim(`   Pages: ${result.pages.join(', ')}`));

    // Confirm MCP config was written
    if (!options.skipOtters) {
      console.log(chalk.green('✅ @stackwright/otters installed as dependency! 🦪🦪🦪🦪'));
      console.log(chalk.dim('   MCP auto-config written to .code-puppy.json'));
    }

    // Clean up hooks after use
    clearScaffoldHooks();

    // Print next steps
    console.log(chalk.cyan.bold("\n🎉 All set! Here's what to do next:\n"));
    if (!options.skipOtters) {
      console.log(chalk.green.bold('Your project is ready for the otter raft!\n'));
      console.log(chalk.white(`  cd ${path.relative(process.cwd(), targetDir) || '.'}`));
      console.log(chalk.white(`  pnpm dev`));
      console.log(chalk.cyan.bold('\n🦦 Start building:'));
      console.log(chalk.white(`  code-puppy invoke stackwright-foreman-otter`));
      console.log(chalk.dim(`  Then say: "Build me a [type] website for [name]"\n`));
    } else {
      console.log(chalk.white(`  1. cd ${path.relative(process.cwd(), targetDir) || '.'}`));
      console.log(chalk.white(`  2. pnpm install`));
      console.log(chalk.white(`  3. pnpm dev`));
      console.log(chalk.cyan.bold('\n🦦 Want the otter raft too? Run with --skip-otters=false'));
      console.log(chalk.dim('   or manually install @stackwright/otters later.\n'));
    }
  } catch (err) {
    clearScaffoldHooks(); // Clean up on error too
    console.error(chalk.red('\n❌ Launch failed:'), err);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('launch-stackwright')
    .description('🚢 Launch a new Stackwright project with the otter raft ready to build')
    .version(version)
    .argument('[directory]', 'Project directory', '.')
    .option('--name <name>', 'Project name (used in package.json)')
    .option('--title <title>', 'Site title shown in the app bar and browser tab')
    .option('--theme <themeId>', 'Theme ID (e.g., corporate, creative, minimal)')
    .option('--force', 'Launch even if the target directory is not empty')
    .option('--skip-otters', 'Skip setting up Code Puppy MCP config')
    .option('--otter-raft', 'Setup the otter raft AI agents and install all dependencies')
    .option('-y, --yes', 'Skip all prompts, use defaults')
    .action(async (directory: string, options: LaunchOptions) => {
      const targetDir = path.resolve(directory);
      await launch(targetDir, options);
    });

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  console.error(chalk.red('Internal error:'), err);
  process.exit(2);
});
