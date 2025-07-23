#!/usr/bin/env node
import { Command } from 'commander';
import { createProject } from './commands/create';

const program = new Command();

program
  .name('Stackwright')
  .description('CLI for creating Stackwright projects')
  .version('0.2.1');

program
  .command('create <project-name>')
  .description('Create a new Stackwright project')
  .option('--from-dir <path>', 'Create from content brief directory')
  .option('--ai-pipeline', 'Use AI to generate enhanced content')
  .option('--api-key <key>', 'OpenAI API key (or use OPENAI_API_KEY env var)')
  .action(async (projectName, options) => {
    try {
      const createOptions = {
        projectName,
        fromDir: options.fromDir,
        aiPipeline: options.aiPipeline,
        apiKey: options.apiKey || process.env.OPENAI_API_KEY,
        ...options
      };
      
      await createProject(projectName, createOptions);
    } catch (error) {
      console.error('Error creating project:', error);
      process.exit(1);
    }
  });

program.parse();