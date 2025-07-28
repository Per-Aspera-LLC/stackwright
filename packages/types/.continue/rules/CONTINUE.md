# @stackwright/types Package

## Purpose
The `@stackwright/types` package serves as the foundational type system for the Stackwright framework. It provides shared TypeScript types, interfaces, and JSON schemas that ensure type safety and consistency across all framework packages.

## Key Features

### TypeScript Type Definitions
- **Core Types**: Fundamental interfaces for pages, content, themes, and site configuration
- **Component Types**: Type definitions for all supported UI components and their properties
- **Schema Validation**: Runtime type checking and validation utilities
- **Cross-Package Consistency**: Shared types used by core, nextjs, themes, and cli packages

### JSON Schema Generation
- **Automated Schema Creation**: Generates JSON schemas from TypeScript interfaces using `typescript-json-schema`
- **YAML Validation**: Enables IDE support and validation for YAML configuration files
- **Multiple Schema Exports**: 
  - `theme-schema.json` - Theme configuration validation
  - `content-schema.json` - Page content structure validation  
  - `siteconfig-schema.json` - Site-wide configuration validation

### Build Process
- **Schema Generation**: `pnpm generate-schemas` creates JSON schemas from TypeScript types
- **Dual Export Format**: Supports both ESM (`.mjs`) and CommonJS (`.js`) for compatibility
- **Type Declarations**: Generates `.d.ts` files for full TypeScript support

## Architecture Integration

### Dependencies
- **@stackwright/themes**: Workspace dependency for theme-related types
- **js-yaml**: YAML parsing and validation support

### Package Exports
The package provides multiple entry points:
```json
{
  ".": "./dist/index.js|mjs", // Main type definitions
  "./schemas/theme-schema.json": "./dist/schemas/theme-schema.json",
  "./schemas/content-schema.json": "./dist/schemas/content-schema.json", 
  "./schemas/siteconfig-schema.json": "./dist/schemas/siteconfig-schema.json"
}
```

### Development Workflow
1. **Type Definitions**: Define interfaces in TypeScript source files
2. **Schema Generation**: Run `tsx src/generate-schemas.ts` to create JSON schemas
3. **Build Output**: `tsup` compiles TypeScript and copies schema files to `dist/`
4. **Validation**: Generated schemas enable YAML validation in IDEs and runtime

## Usage Patterns

### In Framework Packages
```typescript
import { PageContent, SiteConfig, ThemeConfig } from '@stackwright/types';
```

### Schema Validation
```typescript
import themeSchema from '@stackwright/types/schemas/theme-schema.json';
// Use for YAML validation and IDE support
```

### Development Commands
- `pnpm build` - Full build including schema generation
- `pnpm generate-schemas` - Generate JSON schemas only  
- `pnpm dev` - Watch mode for development

## Best Practices

### Type Design
- Keep interfaces focused and composable
- Use generic types for reusable patterns
- Provide clear JSDoc comments for complex types
- Follow strict TypeScript conventions

### Schema Management
- Regenerate schemas after type changes
- Validate schema compatibility across versions
- Test schema validation with example YAML files

### Version Management
- Use changesets for type-breaking changes
- Consider backwards compatibility impact
- Document migration paths for major changes