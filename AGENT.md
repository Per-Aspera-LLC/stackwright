# Stackwright Development Guide

## Commands
- `pnpm build` - Build all packages (excluding examples)
- `pnpm build:all` - Build everything including examples
- `pnpm build:core` - Build stackwright-core package only
- `pnpm build:cli` - Build stackwright-cli package only  
- `pnpm build:themes` - Build stackwright-themes package only
- `pnpm dev` - Start development mode for all packages
- `pnpm dev:example` - Run per-aspera-site example in dev mode
- To test individual packages: `cd packages/<package-name> && npm test`

## Architecture
- **stackwright-core**: React/MUI framework for building sites from YAML config
- **stackwright-cli**: CLI tool with OpenAI integration for site generation
- **stackwright-themes**: Theme system for consistent styling
- **Workspace**: pnpm monorepo with packages/ and examples/ directories
- **Config-driven**: Sites built from YAML page definitions and content markdown

## Code Style
- TypeScript with strict type checking enabled
- React JSX for core/themes, Node.js for CLI
- Import from workspace packages using `workspace:` prefix
- Use MUI components and emotion styling in React code
- Follow existing patterns in each package for consistency
