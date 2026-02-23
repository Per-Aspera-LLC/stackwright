# @stackwright/cli - AI Guide for Agents

Welcome to the Stackwright CLI package! This package provides command-line tools and utilities for working with Stackwright projects.

## Key Concepts
- **CLI Commands**: Command-line interface for Stackwright operations
- **Project Scaffolding**: Tools for creating and managing Stackwright projects
- **AI Pipeline**: AI-powered content generation and analysis

## Package Structure
- `src/cli.ts`: Main CLI entry point
- `src/commands/`: CLI command implementations
- `src/ai-pipeline.ts`: AI-powered content generation
- `src/test-analyzer.ts`: Test analysis utilities
- `src/types/`: CLI-specific types
- `src/utils/`: Utility functions
- `src/index.ts`: Main exports

## Developer Workflows
- **Build**: Run `pnpm build` from the package root or project root
- **CLI Usage**: Use `stackwright` command after installation
- **Development**: Run specific commands with `ts-node` during development

## Project Conventions
- **File Organization**: Commands organized by functionality
- **Naming Conventions**: 
  - Kebab-case for command names (e.g., `generate-content`)
  - PascalCase for command classes (e.g., `GenerateContentCommand`)

## Integration Points
- **Dependencies**: 
  - `@stackwright/core`: Core framework components
  - `@stackwright/themes`: Theme management
  - commander: CLI framework
  - inquirer: Interactive prompts
  - openai: AI content generation
  - ts-morph: TypeScript AST manipulation

## Key Components
- **CLI Commands**: 
  - Project initialization
  - Content generation
  - Theme management
  - Build and deployment utilities
- **AI Pipeline**: Content generation using OpenAI API
- **Test Analyzer**: Test result analysis and reporting

## Troubleshooting
- **Common Issues**:
  - Command not found: Ensure CLI is properly installed and in PATH
  - Permission errors: Check file system permissions
  - API errors: Verify OpenAI API key and network connectivity
  - Build failures: Run `pnpm install` to resolve dependencies

## References
- **Core Files**:
  - `src/cli.ts`: Main CLI implementation
  - `src/commands/`: Command implementations
  - `src/ai-pipeline.ts`: AI content generation

## Best Practices
- Use commander for consistent command structure
- Provide clear help text and examples for all commands
- Handle errors gracefully with user-friendly messages
- Use inquirer for interactive user input when appropriate
- Follow semantic versioning for CLI tool releases

## Command Structure
- **Global Options**: 
  - `--help`: Show help information
  - `--version`: Show version information
  - `--verbose`: Enable verbose output
  - `--debug`: Enable debug mode

## AI Integration
- **Content Generation**: Use OpenAI API for generating content
- **Prompt Engineering**: Carefully craft prompts for consistent results
- **Error Handling**: Handle API rate limits and errors gracefully
- **Caching**: Cache generated content to avoid redundant API calls