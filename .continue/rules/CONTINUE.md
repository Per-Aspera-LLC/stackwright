# Stackwright Framework - Development Guide

## Project Overview

Stackwright is a YAML-driven React application framework that enables rapid development of professional websites and applications through a "content as code" approach. The framework allows developers to build applications by defining structure and behavior in YAML configuration files rather than writing traditional React components for every page.

### Key Technologies
- **TypeScript/React**: Core framework implementation
- **Material-UI + Emotion**: UI component library and styling
- **Next.js**: Framework adapter for static/server-side rendering  
- **PNPM**: Package manager and monorepo management
- **Changesets**: Version management and publishing
- **GitHub Actions**: CI/CD pipeline

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     CLI & Tooling                           │
│  @stackwright/cli - Project scaffolding, AI generation     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Framework Adapters                          │
│     @stackwright/nextjs - Next.js integration              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core Framework                            │
│   @stackwright/core - YAML parsing, dynamic components     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Cross-Cutting Systems                       │
│      @stackwright/themes - Theme definitions               │
│         Root schemas - Type validation                     │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites
- **Node.js**: Version 20+ (check with `node --version`)
- **PNPM**: Version 10+ (install with `npm install -g pnpm`)
- **Git**: For version control and changesets

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd stackwright

# Install dependencies for all packages
pnpm install

# Generate TypeScript schemas (required before building)
pnpm generate-schemas

# Build all packages
pnpm build
```

### Basic Usage
```bash
# Start development mode for all packages
pnpm dev

# Build specific packages
pnpm build:core
pnpm build:nextjs
pnpm build:themes
pnpm build:cli

# Run example site
pnpm dev:example
```

### Running Tests
**Note**: Test infrastructure is currently being implemented. For now:
```bash
pnpm test  # Currently just echoes "No tests yet"
```

## Project Structure

### Monorepo Organization
```
stackwright-workspace/
├── packages/                    # Core framework packages
│   ├── core/                   # @stackwright/core - Main framework
│   ├── nextjs/                 # @stackwright/nextjs - Next.js adapter
│   ├── themes/                 # @stackwright/themes - Theme system
│   └── cli/                    # @stackwright/cli - CLI tools
├── examples/                   # Example applications
├── scripts/                    # Build and utility scripts
├── .github/                    # CI/CD workflows
├── .changeset/                 # Version management
└── www/                        # Developer's own site (gitignored)
```

### Key Packages

#### @stackwright/core
- **Purpose**: Core YAML-to-React transformation engine
- **Key Exports**: `DynamicPage`, `SlugPage`, component system
- **Dependencies**: Material-UI, Emotion, themes package

#### @stackwright/nextjs  
- **Purpose**: Next.js integration and setup utilities
- **Key Exports**: Next.js-specific implementations, setup helpers
- **Dependencies**: Next.js 14+, core package

#### @stackwright/themes
- **Purpose**: YAML-configurable theme system
- **Key Exports**: Theme definitions, styling utilities
- **Dependencies**: React, js-yaml

#### @stackwright/cli
- **Purpose**: Developer tooling and project scaffolding
- **Key Exports**: CLI commands, AI-powered generation
- **Dependencies**: Commander.js, OpenAI, ts-morph

### Important Configuration Files
- `pnpm-workspace.yaml`: Monorepo package definitions
- `scripts/generate-schemas.ts`: TypeScript schema generation
- `.changeset/`: Version management configuration
- `.github/workflows/`: CI/CD pipeline definitions

## Development Workflow

### Branch Strategy
- **`dev`**: Development branch - triggers alpha prereleases
- **`main`**: Production branch - triggers stable releases

### Making Changes
1. **Create feature branch** from `dev`
2. **Make your changes** in relevant packages
3. **Run changeset** if you modified packages:
   ```bash
   pnpm changeset
   ```
4. **Create PR** to `dev` branch
5. **CI validates** changeset presence and runs tests

### Release Process
- **Prerelease**: Push to `dev` → auto-publishes `@next` tagged packages
- **Stable Release**: PR to `main` → auto-publishes stable versions

### Coding Standards
- **TypeScript**: Strict mode enabled across all packages
- **ESM/CJS**: Dual package exports using tsup
- **Linting**: Standard TypeScript/React conventions
- **File Naming**: kebab-case for files, PascalCase for components

## Key Concepts

### YAML-Driven Development
Pages and components are defined declaratively in YAML:
```yaml
content:
  content_items:
    - main:
        heading:
          text: "Welcome to Stackwright"
          size: h1
        buttons:
          - text: "Get Started"
            variant: contained
            href: "/docs"
```

### Dynamic Page Generation
The `DynamicPage` component transforms YAML configurations into React components at runtime, enabling content creators to build UIs without React knowledge.

### Theme System
Themes are defined in YAML and support:
- Custom color palettes
- Typography scales  
- Component styling variants
- Responsive design tokens

### Content as Code
The core philosophy: treat content configuration as code with version control, validation, and collaborative editing.

## Common Tasks

### Adding a New Component Type
1. **Define component** in `packages/core/src/components/`
2. **Add to exports** in `packages/core/src/index.ts`
3. **Update schemas** by running `pnpm generate-schemas`
4. **Test in example** application

### Creating a New Theme
1. **Define theme YAML** in themes package
2. **Add theme exports** in themes index
3. **Test with example** site configuration

### Adding CLI Commands
1. **Create command file** in `packages/cli/src/commands/`
2. **Register command** in CLI entry point
3. **Update help documentation**

### Publishing Changes
1. **Create changeset**: `pnpm changeset`
2. **Push to dev**: Auto-publishes prerelease
3. **Merge to main**: Publishes stable release

## Troubleshooting

### Common Issues

#### "Cannot find module" ESM Errors
- **Cause**: Missing `.js` extensions in ESM imports
- **Solution**: Ensure all imports include file extensions in built output

#### Schema Generation Fails
- **Cause**: TypeScript compilation errors in source files
- **Solution**: Fix TypeScript errors before running `pnpm generate-schemas`

#### Changeset Validation Fails
- **Cause**: Modified packages without changeset
- **Solution**: Run `pnpm changeset` and commit the generated file

#### Build Fails After Dependencies Update
- **Cause**: Version mismatches in monorepo
- **Solution**: Run `pnpm install` from root to resolve dependencies

### Debugging Tips
- **Check package versions**: Use `pnpm list` to verify installations
- **Clear build cache**: Delete `packages/*/dist` directories
- **Regenerate schemas**: Run `pnpm generate-schemas` after changes
- **Check CI logs**: GitHub Actions provide detailed error information

## References

### Framework Documentation
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Next.js Documentation](https://nextjs.org/docs)

### Development Tools
- [PNPM Documentation](https://pnpm.io/)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Monorepo Management
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Turborepo Guide](https://turbo.build/repo/docs) (potential future enhancement)

---

**Note**: This documentation reflects the current state of active development. Some sections may need updates as the framework evolves. The test infrastructure is currently being implemented and will be documented once complete.
