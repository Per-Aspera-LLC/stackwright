#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

import { scaffold, ScaffoldOptions } from '@stackwright/cli';

const { version } = require('../package.json') as { version: string };

interface LaunchOptions {
  name?: string;
  title?: string;
  theme?: string;
  force?: boolean;
  skipOtters?: boolean;
  yes?: boolean;
}

async function copyOtterRaft(targetDir: string): Promise<void> {
  // Find the otters directory - it's in the stackwright repo root
  // When published, we'll bundle the otter configs in this package
  const ottersSourceDir = path.resolve(__dirname, '../templates/otters');
  const ottersTargetDir = path.join(targetDir, '.stackwright', 'otters');

  if (!fs.existsSync(ottersSourceDir)) {
    console.warn(
      chalk.yellow(
        '\n⚠️  Could not find otter raft configs. Skipping otter setup.\n' +
          '   You can add them later from: https://github.com/Per-Aspera-LLC/stackwright/tree/main/otters'
      )
    );
    return;
  }

  await fs.ensureDir(ottersTargetDir);

  // Copy all otter JSON files
  const otterFiles = (await fs.readdir(ottersSourceDir)).filter((f) => f.endsWith('.json'));

  for (const file of otterFiles) {
    await fs.copy(path.join(ottersSourceDir, file), path.join(ottersTargetDir, file));
  }

  // Create .code-puppy.json for MCP auto-configuration
  const codePuppyConfig = {
    mcp_servers: {
      stackwright: {
        command: 'node',
        args: [path.join(targetDir, 'node_modules', '@stackwright', 'mcp', 'dist', 'server.js')],
        env: {
          NODE_ENV: 'development',
        },
      },
    },
    agents_path: '.stackwright/otters',
  };

  await fs.writeFile(
    path.join(targetDir, '.code-puppy.json'),
    JSON.stringify(codePuppyConfig, null, 2)
  );

  console.log(chalk.green('✅ Otter raft ready! 🦦🦦🦦🦦'));
  console.log(chalk.dim(`   Configs copied to: ${path.relative(process.cwd(), ottersTargetDir)}`));
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
    const result = await scaffold(targetDir, scaffoldOptions);

    console.log(chalk.green(`\n✅ Project scaffolded successfully!`));
    console.log(chalk.dim(`   Location: ${result.path}`));
    console.log(chalk.dim(`   Theme: ${result.theme}`));
    console.log(chalk.dim(`   Pages: ${result.pages.join(', ')}`));

    // Copy otter raft unless --skip-otters
    if (!options.skipOtters) {
      console.log(chalk.cyan('\n🦦 Setting up the otter raft...\n'));
      await copyOtterRaft(targetDir);
    }

    // Print next steps
    console.log(chalk.cyan.bold("\n🎉 All set! Here's what to do next:\n"));
    console.log(chalk.white(`  1. cd ${path.relative(process.cwd(), targetDir) || '.'}`));
    console.log(chalk.white(`  2. pnpm install`));
    console.log(chalk.white(`  3. pnpm dev`));

    if (!options.skipOtters) {
      console.log(chalk.cyan.bold('\n🦦 Want the otter raft to build your site for you?\n'));
      console.log(chalk.white(`  code-puppy invoke stackwright-foreman-otter`));
      console.log(chalk.dim(`  Then say: "Build me a [type] website for [name]"\n`));
    }
  } catch (err) {
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
    .option('--skip-otters', 'Skip copying otter raft configs')
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
