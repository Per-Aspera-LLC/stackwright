# Hello Stackwright Example - AI Guide for Agents

Welcome to the Hello Stackwright example project! This guide provides essential knowledge for AI agents to understand and modify this example application effectively.

## Project Overview

This example demonstrates Stackwright's YAML-driven React application framework. It serves as both a working example and potential documentation site for Stackwright itself.

## Key Concepts

### Framework Architecture
- **YAML-Driven Content**: All page content defined in YAML files
- **Component System**: Stackwright transforms YAML into React components
- **Next.js Integration**: Server-side rendering and static generation
- **Theme System**: Material-UI theming with YAML configuration

### Project Structure
```
examples/hellostackwrightnext/
├── content/                  # YAML content files
│   ├── pages/               # Page content definitions
│   └── site.yaml            # Global site configuration
├── src/                     # Application source code
│   ├── app/                 # Next.js app structure
│   │   ├── layout.tsx       # Main layout with theme provider
│   │   └── globals.css      # Global styles
│   └── components/          # Custom React components
├── public/                  # Static assets
└── package.json             # Project configuration
```

## Developer Workflows

### Content Modification
1. **Add New Pages**: Create YAML files in `content/pages/`
2. **Edit Content**: Modify existing YAML files
3. **Update Configuration**: Edit `content/site.yaml`

### Development Commands
```bash
# From project root
pnpm dev:example

# From this directory
pnpm dev
```

### Build Process
```bash
# Full build
pnpm build

# Clean build
rm -rf .next && pnpm build
```

## Project Conventions

### File Organization
- **YAML Files**: Kebab-case naming (e.g., `about-us.yaml`)
- **React Components**: PascalCase naming (e.g., `CustomComponent.tsx`)
- **Content Structure**: Follows Stackwright content type definitions

### Naming Conventions
- **Pages**: Use descriptive names matching URL structure
- **Components**: Use clear, functional names
- **Content Types**: Follow Stackwright type system

## Integration Points

### Core Framework
- **Content Rendering**: `@stackwright/core` handles YAML-to-React transformation
- **Component Registry**: Dynamic component resolution system
- **Type Safety**: Full TypeScript support with `@stackwright/types`

### Next.js Integration
- **Static Generation**: Automatic page generation from YAML
- **Routing**: Dynamic slug-based routing
- **Optimization**: Next.js Image and Link components

### Theme System
- **Material-UI**: Theme provider and component styling
- **Custom Themes**: YAML-defined theme configuration
- **Color Resolution**: Dynamic color handling

## Troubleshooting

### Common Issues
- **Missing Components**: Verify component registration in `src/app/layout.tsx`
- **Type Errors**: Check YAML content against `@stackwright/types`
- **Build Failures**: Clear cache and regenerate schemas

### Debugging Tips
- **Content Validation**: Use `pnpm generate-schemas` to validate YAML
- **Type Checking**: Run TypeScript compiler for type errors
- **Build Cache**: Delete `.next` directory for clean builds

## Modification Guidelines

### Adding New Pages
1. Create YAML file in `content/pages/`
2. Define content structure using Stackwright types
3. Page automatically available at corresponding URL

### Customizing Themes
1. Edit theme configuration in `src/app/layout.tsx`
2. Modify Material-UI theme object
3. Update color palette and typography

### Extending Components
1. Create new React components in `src/components/`
2. Register components in component registry
3. Use in YAML content definitions

## Content Type Reference

### Main Content Sections
```yaml
- main:
    label: "section-identifier"
    heading:
      text: "Section Title"
      size: "h1"
    textBlocks:
      - text: "Description text"
        size: "body1"
    buttons:
      - label: "button-identifier"
        text: "Button Text"
        variant: "contained"
        href: "/target-page"
```

### Icon Grids
```yaml
- iconGrid:
    label: "features-grid"
    heading:
      text: "Features"
      size: "h2"
    items:
      - icon: "icon-name"
        title: "Feature Title"
        description: "Feature description"
```

### Timelines
```yaml
- timeline:
    label: "history-timeline"
    items:
      - date: "2024"
        title: "Event Title"
        description: "Event description"
```

## Best Practices

### Content Organization
- Use clear, descriptive labels for content sections
- Follow consistent naming conventions
- Group related content logically

### Type Safety
- Validate YAML content against schemas
- Use TypeScript types for custom components
- Maintain type consistency across files

### Performance
- Optimize images for web
- Use lazy loading for non-critical content
- Minimize custom component complexity

## Future Enhancements

### Planned Features
- **Dynamic Content**: CMS integration for content management
- **Advanced Theming**: Light/dark mode support
- **Internationalization**: Multi-language content support
- **Accessibility**: Enhanced accessibility features

### Documentation
- **API Reference**: Detailed component documentation
- **Examples**: Additional example pages and components
- **Tutorials**: Step-by-step guides for common tasks

## References

### Framework Documentation
- [Stackwright Core](../../packages/core/AGENTS.md)
- [Next.js Adapter](../../packages/nextjs/AGENTS.md)
- [Theme System](../../packages/themes/AGENTS.md)
- [Type System](../../packages/types/AGENTS.md)

### Development Tools
- [Next.js Documentation](https://nextjs.org/docs)
- [Material-UI Documentation](https://mui.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Project Management
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)