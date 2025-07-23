#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './commands/create';
import chalk from 'chalk';

const program = new Command();

program
  .name('Stackwright')
  .description('CLI for Stackwright - craft websites with structured content')
  .version('0.2.1');

program
  .command('create <project-name>')
  .description('Create a new Stackwright project')
  .action(async (projectName: string) => {
    try {
      await createProject(projectName);
    } catch (error) {
      console.error(chalk.red('❌ Error creating project:'), error);
      process.exit(1);
    }
  });

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse();