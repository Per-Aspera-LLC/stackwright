# Hello Stackwright - Example Application

This is a simple example application demonstrating the Stackwright framework's YAML-driven approach to building React applications.

## What This Example Shows

- **YAML-Driven Pages**: All page content is defined in YAML files under `content/pages/`
- **Dynamic Routing**: Uses Stackwright's slug page pattern for automatic page generation
- **Site Configuration**: Global site settings defined in `content/site.yaml`
- **Material-UI Integration**: Demonstrates theming and component usage
- **TypeScript Support**: Full type safety with Stackwright's type definitions

## Project Structure

The project is organized as follows:

```
examples/hellostackwrightnext/
├── content/
│   ├── pages/               # YAML files defining page content
│   └── site.yaml            # Global site configuration
├── src/
│   ├── app/                 # Next.js application structure
│   │   ├── layout.tsx       # Main layout with theme provider
│   │   └── globals.css      # Global styles
│   └── components/          # Custom React components
├── public/                  # Static assets
└── package.json             # Project configuration
```

## Content Structure

### Pages (`content/pages/`)

Each YAML file defines a page's content structure:

```yaml
content:
  content_items:
    - main:                    # Main content section
        label: "hero-section"
        heading:
          text: "Page Title"
          size: "h1"
        textBlocks:
          - text: "Description text"
            size: "body1"
        buttons:
          - label: "cta-button"
            text: "Call to Action"
            variant: "contained"
            href: "/target-page"
```

### Site Configuration (`content/site.yaml`)

Global settings for navigation, branding, and theming:

```yaml
appBar:
  titleText: "Site Name"
  backgroundColor: "#1976d2"
navigation:
  - label: "Home"
    href: "/"
footer:
  copyright: "© 2024 Your Site"
```

## Component Types Used

This example demonstrates several Stackwright content types:

- **`main`**: Primary content sections with headings, text, buttons, and graphics
- **`iconGrid`**: Grid layouts for feature highlights
- **`timeline`**: Chronological content presentation
- **Navigation**: Site-wide navigation configuration

## Running the Example

```bash
# From the monorepo root
pnpm install
pnpm build
pnpm dev:example

# Or from this directory
pnpm dev
```

## Adding New Pages

1. Create a new YAML file in `content/pages/`
2. Define the content structure using Stackwright content types
3. The page will be automatically available at the corresponding URL

For example, `content/pages/services/consulting.yaml` becomes `/services/consulting`

## Customization Points

- **Themes**: Modify the Material-UI theme in `src/app/layout.tsx`
- **Site Config**: Update global settings in `content/site.yaml`
- **Content**: Edit YAML files to change page content
- **Styling**: Add custom CSS in `src/app/globals.css`

## Key Features Demonstrated

- **Zero React Components**: No need to write React components for content pages
- **Type Safety**: Full TypeScript support with Stackwright types
- **Hot Reloading**: Changes to YAML files trigger page updates
- **SEO Friendly**: Server-side rendering with Next.js
- **Responsive Design**: Material-UI components adapt to screen sizes

## Next Steps

- Explore the [main documentation](../../README.md) for advanced features
- Try modifying the YAML files to see changes in real-time
- Add new pages by creating additional YAML files
- Experiment with different content types and layouts

## Framework Architecture

This example demonstrates the core Stackwright architecture:

1. **YAML Content**: Pages and site configuration defined in YAML
2. **Content Rendering**: Stackwright core transforms YAML into React components
3. **Next.js Integration**: `@stackwright/nextjs` provides Next.js-specific implementations
4. **Theme System**: Material-UI theming with `@stackwright/themes`
5. **Type Safety**: Full TypeScript support with `@stackwright/types`

## Integration Points

- **Core Framework**: `@stackwright/core` handles YAML parsing and component rendering
- **Next.js Adapter**: `@stackwright/nextjs` provides Next.js-specific components and utilities
- **Theme System**: `@stackwright/themes` manages theme configuration and resolution
- **Type System**: `@stackwright/types` ensures type safety across the application

## Development Workflow

1. **Content Creation**: Define pages and content in YAML files
2. **Configuration**: Set up site-wide settings in `content/site.yaml`
3. **Theming**: Customize the theme in `src/app/layout.tsx`
4. **Build**: Run `pnpm build` to compile the application
5. **Development**: Use `pnpm dev` for hot-reloading development

## Troubleshooting

- **Missing Components**: Ensure all required components are registered in the component registry
- **Type Errors**: Verify YAML content matches the expected types from `@stackwright/types`
- **Build Issues**: Clear build cache and regenerate schemas if needed

## References

- [Stackwright Core Documentation](../../packages/core/AGENTS.md)
- [Next.js Adapter Documentation](../../packages/nextjs/AGENTS.md)
- [Theme System Documentation](../../packages/themes/AGENTS.md)
- [Type System Documentation](../../packages/types/AGENTS.md)