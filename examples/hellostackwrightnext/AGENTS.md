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
│   ├── pages/               # Page content definitions (images can be co-located here)
│   └── site.yaml            # Global site configuration
├── pages/                   # Next.js Pages Router
│   ├── _app.tsx             # Registers Next.js components and icons
│   ├── index.tsx            # Home page (static props)
│   └── [slug].tsx           # Dynamic slug-based routing
├── public/                  # Static assets (images copied here automatically from content/)
├── next.config.js           # Uses createStackwrightNextConfig()
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
- **Missing Components**: Verify `registerNextJSComponents()` is called in `pages/_app.tsx`
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
1. Edit theme colors, typography, and spacing in `content/site.yaml` under the `theme` key
2. The YAML theme config is resolved at runtime by `useSafeTheme()` in `@stackwright/themes`
3. For MUI-level overrides, modify `customTheme.components` in `content/site.yaml`

### Extending Components
1. Create new React components in `src/components/`
2. Register components in component registry
3. Use in YAML content definitions

## Content Type Reference

### YAML Key Reference

**AGENTS: This table is auto-generated from the live Zod schemas. Run `pnpm stackwright -- generate-agent-docs` from the monorepo root to regenerate. Do NOT edit the content between the markers manually.**

<!-- stackwright:content-type-table:start -->
The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.

| YAML key | Required fields | Optional fields |
|---|---|---|
| `carousel` | `label` (string), `heading` (string), `items` (CarouselItem[]) | `color` (string), `background` (string), `autoPlaySpeed` (number), `infinite` (boolean), `autoPlay` (boolean) |
| `main` | `label` (string), `heading` (TextBlock), `textBlocks` (TextBlock[]) | `color` (string), `background` (string), `media` (MediaItem), `graphic_position` (`left` | `right`), `buttons` (ButtonContent[]), `textToGraphic` (number) |
| `tabbed_content` | `label` (string), `heading` (TextBlock), `tabs` (object[]) | `color` (string), `background` (string) |
| `media` | `label` (string), `src` (string), `type` ("media") | `color` (string), `background` (string), `alt` (string), `height` (number | string), `width` (number | string), `style` (`contained` | `overflow`) |
| `timeline` | `label` (string), `items` (TimelineItem[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `icon_grid` | `label` (string), `icons` (IconContent[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `code_block` | `label` (string), `code` (string) | `color` (string), `background` (string), `language` (string), `lineNumbers` (boolean) |
| `feature_list` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `testimonial_grid` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock), `columns` (number) |
| `faq` | `label` (string), `items` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `pricing_table` | `label` (string), `plans` (object[]) | `color` (string), `background` (string), `heading` (TextBlock) |
| `alert` | `label` (string), `variant` (`info` | `warning` | `success` | `danger` | `note` | `tip`), `body` (string) | `color` (string), `background` (string), `title` (string) |
| `contact_form_stub` | `label` (string), `email` (string) | `color` (string), `background` (string), `heading` (TextBlock), `description` (string), `email_subject` (string), `phone` (string), `address` (string), `button_text` (string) |
| `grid` | `label` (string), `columns` (GridColumn[]) | `color` (string), `background` (string), `heading` (TextBlock), `gap` (string), `stackBelow` (number) |

**Sub-type reference:**

| Type | Fields |
|---|---|
| `TextBlock` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string) |
| `ButtonContent` | `text` (string), `textSize` (TypographyVariant), `textColor`? (string), `variant` (`text` | `outlined` | `contained`), `variantSize`? (`small` | `medium` | `large`), `href`? (string), `action`? (string), `icon`? (MediaItem), `alignment`? (`left` | `center` | `right`), `bgColor`? (string) |
| `MediaItem` | Discriminated union: `type: "media"` \| `type: "icon"` \| `type: "image"`. `type` field is required and acts as discriminator. |
| `ImageContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("image"), `aspect_ratio`? (number) |
| `IconContent` | `label` (string), `color`? (string), `background`? (string), `src` (string), `alt`? (string), `height`? (number | string), `width`? (number | string), `style`? (`contained` | `overflow`), `type` ("icon"), `size`? (number | TypographyVariant) |
| `CarouselItem` | `title` (string), `text` (string), `media` (MediaItem), `background`? (string) |
| `TimelineItem` | `year` (string), `event` (string) |
| `GridColumn` | `width`? (number), `content_items` (object[]) |

**TypographyVariant values:** `h1` `h2` `h3` `h4` `h5` `h6` `subtitle1` `subtitle2` `body1` `body2` `caption` `button` `overline`
<!-- stackwright:content-type-table:end -->

### YAML Examples

### Main Content Sections
```yaml
- main:
    label: "section-identifier"
    heading:
      text: "Section Title"
      textSize: "h1"
    textBlocks:
      - text: "Description text"
        textSize: "body1"
    buttons:
      - text: "Button Text"
        textSize: "body1"
        variant: "contained"
        href: "/target-page"
```

### Icon Grids
```yaml
- icon_grid:
    label: "features-grid"
    heading:
      text: "Features"
      textSize: "h2"
    icons:
      - type: "icon"
        label: "feature-icon"
        src: "CheckCircle"
        color: "#4caf50"
        height: 48
```

### Timelines
```yaml
- timeline:
    label: "history-timeline"
    items:
      - year: "2024"
        event: "Event description"
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