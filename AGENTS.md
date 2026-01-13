## Stackwright Framework - AI Guide for Agents

Welcome to Stackwright! This is a YAML-driven React application framework that enables rapid development of professional websites and applications through a "content as code" approach. In this guide, you'll find essential knowledge required to be productive in the Stackwright project.

### Key Concepts
- **Framework Architecture**: To understand the big picture, read:
  - `packages/core/src/index.ts`: Core framework initialization
  - `packages/nextjs/src/components/NextDocument.tsx`: Next.js integration
  - `packages/themes/src/ThemesProvider.tsx`: Theme provider for theme handling
- **Developer Workflows**
  - Build: Run `pnpm build` from the project root
  - Test (currently not implemented): See [Troubleshooting](#troubleshooting) section below
- **Project Conventions**: Note these important patterns that differ from common practices
  - **File Organization**
    - All source code is in `packages` directory
    - Core framework components are in `src/components` of `@stackwright/core` package
    - Themes are defined in YAML files within the `themes` directory of the same package
  - **Naming Conventions**
    - Kebab-case for file names (e.g., `dynamicPage.tsx`)
    - PascalCase for components (e.g., `DynamicPage`)

### Integration Points and Cross-Component Communication
- **Service Boundaries**: No obvious service boundaries, all code resides within the project's monorepo
- **Data Flows**: Data primarily flows from configuration files to React components via the core framework
- **External Dependencies**
  - Material-UI: Provides pre-built UI components and styles
  - Emotion: Allows for dynamic styling of components
- **Cross-Component Communication**
  - Themes can be changed dynamically using the `ThemesProvider` component
  - Custom events (e.g., `onChange`) can be registered by child components to interact with parents

### Troubleshooting
- **Common Issues**
  - "Cannot find module" ESM Errors: Missing `.js` extensions in ESM imports. Ensure all imports include file extensions in built output.
  - Schema Generation Fails: TypeScript compilation errors in source files. Fix TypeScript errors before running `pnpm generate-schemas`.
  - Changeset Validation Fails: Modified packages without changeset. Run `pnpm changeset` and commit the generated file.
  - Build Fails After Dependencies Update: Version mismatches in monorepo. Run `pnpm install` from root to resolve dependencies.
- **Debugging Tips**
  - Check package versions: Use `pnpm list` to verify installations
  - Clear build cache: Delete `packages/*/dist` directories
  - Regenerate schemas: Run `pnpm generate-schemas` after changes
  - Reference [Troubleshooting](#troubleshooting) section in the main documentation for additional tips.

### References
- **Framework Documentation**
  - [React Documentation](https://react.dev/)
  - [Material-UI Documentation](https://mui.com/)
  - [Next.js Documentation](https://nextjs.org/docs)
- **Development Tools**
  - [PNPM Documentation](https://pnpm.io/)
  - [Changesets Documentation](https://github.com/changesets/changesets)
  - [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- **Monorepo Management**
  - [PNPM Workspaces](https://pnpm.io/workspaces)
  - [Turborepo Guide](https://turbo.build/repo/docs) (potential future enhancement)