# @stackwright/icons - AI Guide for Agents

Welcome to the Stackwright Icons package! This package provides icon components and utilities for Stackwright applications.

## Key Concepts
- **Icon Components**: Pre-built icon components using Material-UI icons
- **Icon Registry**: Dynamic icon registration and resolution
- **Icon Presets**: Predefined icon sets for common use cases

## Package Structure
- `src/components/`: Icon component implementations
- `src/hooks/`: Custom hooks for icon management
- `src/icons/`: Individual icon components
- `src/presets/`: Predefined icon presets
- `src/registry/`: Icon registration utilities
- `src/index.ts`: Main exports

## Developer Workflows
- **Build**: Run `pnpm build` from the package root or project root
- **Watch Mode**: Run `pnpm dev` for development with hot-reloading

## Project Conventions
- **File Organization**: Icons organized by category and usage
- **Naming Conventions**: 
  - Kebab-case for file names (e.g., `social-icon.tsx`)
  - PascalCase for icon components (e.g., `SocialIcon`)

## Integration Points
- **Dependencies**: 
  - `@mui/icons-material`: Material-UI icon library
  - `@mui/material`: Material-UI core components
  - React: For component integration

## Key Components
- **Icon Components**: Individual icon components wrapping Material-UI icons
- **Icon Registry**: System for registering and resolving icons dynamically
- **Icon Presets**: Predefined sets of icons for common scenarios

## Troubleshooting
- **Common Issues**:
  - Icon not rendering: Verify icon is properly registered
  - Missing icon: Check icon name and import path
  - Styling issues: Ensure proper Material-UI theme context

## References
- **Core Files**:
  - `src/registry/`: Icon registration system
  - `src/presets/`: Predefined icon sets
  - `src/icons/`: Individual icon components

## Best Practices
- Use the icon registry for dynamic icon resolution
- Follow Material-UI icon naming conventions
- Group related icons into presets for easier management
- Ensure proper icon sizing and accessibility attributes