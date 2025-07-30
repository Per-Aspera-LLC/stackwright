# @stackwright/nextjs - Next.js Adapter Rules

## Package Purpose

The `@stackwright/nextjs` package serves as the framework adapter layer that bridges Stackwright's YAML-driven React components with Next.js applications. It provides Next.js-specific implementations of core Stackwright functionality, enabling static site generation, server-side rendering, and optimized production builds.

## Architecture

### Layer Position
┌─────────────────────────────────────────────────────────────┐ 
│ Next.js Applications                                        │ 
│ (User's Next.js projects)                                   |
└─────────────────────────────────────────────────────────────┘ 
│ ▼
┌─────────────────────────────────────────────────────────────┐
│ @stackwright/nextjs                                         │ 
│  • Next.js-specific components                              │
│  • Static generation utilities                              │
│  • Framework integration helpers                            │
└─────────────────────────────────────────────────────────────┘ 
│ ▼
┌───────────────────────────────────────────────────────────┐
│ @stackwright/core                                         │
│  • DynamicPage, SlugPage                                  │
│  • Component system                                       │
│  • YAML processing                                        │
└───────────────────────────────────────────────────────────┘

### Package Structure
packages/nextjs/ 
├── src/ 
│ ├── components/ # Next.js-specific component implementations
│ │ ├── Image.tsx # Next.js Image component wrapper
│ │ ├── Link.tsx # Next.js Link component wrapper
│ │ └── Router.tsx # Next.js router integration
│ ├── setup/ # Project setup utilities
│ │ ├── index.ts # Main setup exports
│ │ └── helpers.ts # Setup helper functions
│ ├── utils/ # Next.js-specific utilities
│ │ ├── static-gen.ts # Static generation helpers
│ │ └── routing.ts # Routing utilities
│ └── index.ts # Main package exports
├── dist/ # Built output (ESM/CJS dual)
├── package.json # Package configuration
└── tsup.config.js # Build configuration


## Core Features

### 1. Stackwright Component Implementations

**Next.js Image Component**

- Provides optimized image loading for Stackwright `Graphic` components
- Implements Next.js Image with blur placeholders and responsive sizing
- Handles aspect ratios and contain/cover variants

**Next.js Link Component** 

- Wraps Next.js Link for client-side navigation
- Supports both internal and external links
- Maintains Stackwright's declarative YAML interface

**Router Integration**

- Connects Stackwright routing to Next.js router
- Enables programmatic navigation from YAML configurations
- Supports dynamic and static routes

### 2. Static Site Generation Support

**Page Generation Utilities**
- Helpers for `getStaticProps` and `getStaticPaths`
- YAML content parsing for build-time optimization
- Automatic slug-based route generation

**Build-Time Optimization**
- Content validation during build process
- Theme resolution at build time
- Asset optimization integration

### 3. Framework Integration

**Setup Utilities**

- Project scaffolding helpers
- Next.js configuration templates
- Development environment setup

**Configuration Helpers**

- Next.js config extensions for Stackwright
- Build pipeline integration
- Asset handling configuration

## Technical Specifications

### Dependencies

- **Core Dependencies**: `@stackwright/core`, `next`, `react`, `react-dom`
- **Development**: TypeScript, tsup, SWC
- **Peer Dependencies**: Next.js 13+ || 14+, React 18+

### Export Strategy

```typescript
// Main exports
export * from './components'
export * from './utils'

// Setup exports (separate entry point)
export * from './setup' // Available via @stackwright/nextjs/setup
```

### TypeScript Configuration

Strict mode enabled
ESM/CJS dual package exports
Full type safety with Next.js integration

## Implementation Rules

1. Component Wrapper Pattern
All Next.js-specific components must:

- Wrap corresponding Next.js primitives (Image, Link, etc.)
- Maintain compatibility with Stackwright's YAML interface
- Provide fallback behavior for missing configurations
- Include proper TypeScript types

```typescript
// Example pattern
export function StackwrightImage(props: StackwrightImageProps) {
  return (
    <NextImage
      {...props}
      placeholder="blur"
      blurDataURL="data:image/gif;base64,..."
      // Additional Next.js optimizations
    />
  );
}
```

2. Static Generation Integration

- All utilities must support Next.js static generation
- YAML content must be parseable at build time
- Error handling for missing or invalid content
- Performance optimization for large sites

3. Setup Function Requirements
Setup utilities must:

- Be idempotent (safe to run multiple times)
- Validate existing Next.js configuration
- Provide clear error messages for conflicts
- Support both TypeScript and JavaScript projects

4. Version Compatibility

- Support Next.js 13.x and 14.x as peer dependencies
- Maintain backward compatibility within major versions
- Test against multiple Next.js versions in CI
- Document breaking changes clearly

## Integration Points

### With @stackwright/core

- Registers Next.js components with stackwright component registry
- Implements StackwrightComponents interface
- Provides framework-specific optimizations

### With Next.js Framework

- Extends Next.js configuration seamlessly
- Integrates with Next.js build pipeline
- Supports all Next.js rendering modes (SSR, SSG, ISR)

### With User Projects

- Provides clear setup and configuration APIs
- Minimal configuration required from users
- Supports customization and extension

## Development Guidelines

### Code Organization

- **Components**: Framework-specific implementations only
- **Utils**: Next.js-specific utilities and helpers
- **Setup**: Project initialization and configuration
- **Types**: Next.js-specific type definitions

### Testing Strategy

- Unit tests for individual components
- Integration tests with Next.js features
- Build process validation
- Performance benchmarking

### Performance Considerations

- Minimize bundle size impact
- Leverage Next.js optimizations (Image, Link, etc.)
- Support code splitting and lazy loading
- Optimize for both development and production

## Usage Patterns

### Basic Setup

```typescript
// next.config.js or next.config.mjs
import { withStackwright } from '@stackwright/nextjs/setup';

export default withStackwright({
  // Your Next.js config
});
```

### Component Registration

```typescript
// app/layout.tsx or _app.tsx
import { stackwrightRegistry } from '@stackwright/core';
import { NextjsComponents } from '@stackwright/nextjs';

stackwrightRegistry.register(NextjsComponents);
```

### Page Implementation

```typescript
// pages/[...slug].tsx or app/[...slug]/page.tsx
import { DynamicPage } from '@stackwright/core';
import { getStaticPropsForSlug } from '@stackwright/nextjs';

export default DynamicPage;
export const getStaticProps = getStaticPropsForSlug;
```

### Maintenance Rules

#### Version Management

- Follow semantic versioning strictly
- Coordinate releases with @stackwright/core
- Test against Next.js canary releases
- Maintain compatibility matrix documentation

#### Breaking Changes

- Require changeset for any breaking changes
- Provide migration guides for major versions
- Maintain backward compatibility within minor versions
- Coordinate with Next.js release schedule

#### Documentation

- Update README for any API changes
- Maintain integration examples
- Document performance implications
- Provide troubleshooting guides

Note: This package is essential for Next.js integration and must maintain high compatibility standards with both Stackwright core and Next.js framework updates.