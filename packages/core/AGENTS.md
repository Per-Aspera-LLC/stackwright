# @stackwright/core Rules & Architecture

## Purpose

The `@stackwright/core` package is the foundational framework for building applications from YAML configuration. It provides the runtime components, rendering engine, and component system that transforms declarative YAML content into fully functional React applications.

## Core Architecture

### Component System

- **Base Components**: Pre-built React components for common UI elements (Graphic, etc.)
- **Structural Components**: Layout and page structure components (PageLayout, DefaultPageLayout)
- **Component Registry**: Dynamic component resolution system for both built-in and external components
- **Stackwright Components**: Framework-specific components that require runtime registration (Image, Link, Router, etc.)

### Content Rendering

- **Content Renderer**: Core engine that transforms YAML content definitions into React component trees
- **Type Safety**: Full TypeScript integration with `@stackwright/types` for content validation
- **Dynamic Resolution**: Runtime component lookup and instantiation

### Configuration Management

- **Site Configuration**: Centralized site-wide settings (theme, navigation, app bar, footer)
- **Default Configuration**: Sensible defaults for rapid prototyping
- **Context System**: React context for sharing configuration across components

## Key Features

### 1. YAML-to-React Transformation

- Declarative content definition through YAML
- Type-safe content parsing with js-yaml
- Dynamic component instantiation from content types

### 2. Theme System Integration

- Material-UI theming with `@stackwright/themes`
- Custom theme support with background images
- Emotion-based styling system

### 3. Component Registration

- Built-in component registry for framework components  
- Stackwright component registry for framework-specific components (Image, Link, Router)
- Error handling for missing components
- Debug utilities for component inspection

### 4. Layout Management

- Flexible page layout system
- App bar and footer integration
- Responsive design with Material-UI Grid2
- Background image support

## Dependencies & Integration

### Required Dependencies

- **React & React-DOM**: ^18.0.0 (peer dependency)
- **Material-UI**: Complete UI component library
- **Emotion**: CSS-in-JS styling system
- **js-yaml**: YAML parsing
- **@stackwright/types**: Type definitions
- **@stackwright/themes**: Theme system

### Framework Integration

- Designed for Next.js integration via `@stackwright/nextjs`
- CLI support through `@stackwright/cli`
- Extensible component system for custom implementations

## Component Registry Rules

### Built-in Components

- Must be registered in `componentRegistry.ts`
- Should follow naming convention: lowercase with hyphens
- Must accept content properties as props

### Stackwright Components

- Must be registered via `stackwrightRegistry.register()`
- Required components: Image, Link, Router, Route, StaticGeneration
- Factory function pattern for dynamic resolution
- Clear error messages for missing registrations

## Development Guidelines

### Type Safety

- All content interfaces must extend types from `@stackwright/types`
- Use TypeScript strict mode
- Provide comprehensive type definitions for all public APIs

### Error Handling

- Graceful degradation for missing components
- Clear error messages with actionable guidance
- Debug utilities for development environments

### Performance

- Lazy loading for non-critical components
- Efficient re-rendering through proper React patterns
- Image optimization with blur placeholders

### Testing

- Unit tests with Vitest
- React Testing Library for component tests
- Coverage reporting enabled
- JSDOM environment for DOM testing

## Build & Distribution

### Build System

- **tsup**: Primary build tool for TypeScript compilation
- **Multiple formats**: ESM, CJS, and TypeScript definitions
- **Watch mode**: Development with hot reloading

### Package Exports

```json
{
  ".": "Main package entry",
  "./DynamicPage": "Direct component access",
  "./pages/slug": "Page-specific components"
}
```

### Versioning

- Follows Semantic Versioning (SemVer)
- dev branch for active development, autopublishes alpha versions to NPM
- changeset-based release management

### Usage Patterns

#### Basic implementation

```typescript
import { renderContent, stackwrightRegistry } from '@stackwright/core';
import { SiteConfigProvider } from '@stackwright/core/hooks/useSiteConfig';

// Register framework components
stackwrightRegistry.register({
  Image: NextImage,
  Link: NextLink,
  Router: NextRouter
});

// Render YAML content
function MyPage({ content, siteConfig }) {
  return (
    <SiteConfigProvider value={siteConfig}>
      {renderContent(content)}
    </SiteConfigProvider>
  );
}
```

#### Custom component Registration

```typescript
import { registerComponent } from '@stackwright/core';

registerComponent('my-custom-component', MyCustomComponent);
```

###  Framework Extensions

The core package is designed to be extended by:

- Framework packages (@stackwright/nextjs)
- Custom component libraries
- Theme packages
- Plugin systems

All extensions should follow the component registration patterns and maintain type safety with the shared type system.
