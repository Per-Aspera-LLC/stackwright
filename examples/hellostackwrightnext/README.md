# Hello Stackwright - Example Application

This is a simple example application demonstrating the Stackwright framework's YAML-driven approach to building React applications.

## What This Example Shows

- **YAML-Driven Pages**: All page content is defined in YAML files under `content/pages/`
- **Dynamic Routing**: Uses Stackwright's slug page pattern for automatic page generation
- **Site Configuration**: Global site settings defined in `content/site.yaml`
- **Material-UI Integration**: Demonstrates theming and component usage
- **TypeScript Support**: Full type safety with Stackwright's type definitions

## Project Structure



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