# @stackwright/themes - Theme System

## Overview

The `@stackwright/themes` package provides a YAML-configurable theme system for Stackwright applications. It enables developers and content creators to define custom visual themes declaratively, supporting everything from color palettes to typography scales and component styling variants.

## Key Features

### YAML-Driven Theme Configuration
Themes are defined in YAML format, making them accessible to non-developers:

```yaml
id: "custom-brand-theme"
name: "Custom Brand Theme"
description: "A theme for our brand identity"
colors:
  primary: "#1976d2"
  secondary: "#dc004e"
  accent: "#9c27b0"
  background: "#ffffff"
  text: "#212121"
typography:
  fontFamily:
    primary: "Inter"
    secondary: "Cinzel"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
```

### Dynamic Color Resolution
The theme system provides intelligent color resolution that supports:
- **Hex codes**: Direct color values like `#1976d2`
- **Theme references**: Named colors from the theme palette
- **Fallback handling**: Graceful degradation for invalid colors

```typescript
// Color resolution example from core package
function resolveColor(colorValue: string, themeColors: Record<string, string>): string {
  if (colorValue.startsWith('#')) {
    return colorValue; // Already a hex code
  }
  return themeColors[colorValue] || colorValue;
}
```

### Component Integration
Themes seamlessly integrate with React components through the `useSafeTheme()` hook:

```typescript
// Example from ThemedButton component
const theme = useSafeTheme();
const buttonColor = button.buttonBackground 
  ? resolveColor(button.buttonBackground)
  : background 
  ? resolveColor(background)
  : theme.colors.primary;
```

### Background Image Support
Themes support background images with automatic transparency handling:

```typescript
// From PageLayout component
const hasBackgroundImage = siteConfig?.customTheme?.backgroundImage?.url;
const backgroundColor = hasBackgroundImage ? 'transparent' : theme.colors.background;
```

## Architecture

### Dependencies
- **React**: Core React hooks and components
- **js-yaml**: YAML parsing and serialization
- **TypeScript**: Type safety and development experience

### Build Configuration
The package uses `tsup` for building with dual format support:

```typescript
// tsup.config.ts
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  target: 'es2022',
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    }
  }
});
```

## Development Workflow

### Theme Creation Process
1. **Define theme YAML** with colors, typography, and spacing
2. **Add theme exports** in the themes package index
3. **Test integration** with example applications
4. **Validate** theme structure and color accessibility

### Custom Theme Generation
The CLI package can generate custom themes from brand specifications:

```javascript
// From CLI custom theme generation
function generateCustomTheme(brand) {
  const colors = mapBrandColorsToTheme(brand.colors);
  
  return {
    id: `${brand.name.toLowerCase().replace(/\s+/g, '-')}-custom`,
    name: `${brand.name} Custom`,
    description: `Custom theme for ${brand.name}`,
    colors,
    typography: {
      fontFamily: {
        primary: brand.fonts.find(f => f.usage === 'body')?.name || 'Inter',
        secondary: brand.fonts.find(f => f.usage === 'titles')?.name || 'Cinzel'
      }
    }
  };
}
```

## Integration Points

### With Core Framework
- **Color resolution**: Used throughout component system
- **Theme hooks**: Provides `useSafeTheme()` for components
- **Layout integration**: Background and styling support

### With CLI Tools
- **Theme generation**: AI-powered custom theme creation
- **Validation**: Schema validation for theme structure
- **Documentation**: Auto-generated theme reference

### With Next.js Adapter
- **SSR support**: Server-side theme resolution
- **Static generation**: Build-time theme optimization
- **Route integration**: Theme switching capabilities

## Theme Structure

### Core Properties
- **`id`**: Unique theme identifier
- **`name`**: Human-readable theme name
- **`description`**: Theme description and usage notes
- **`colors`**: Color palette definition
- **`typography`**: Font family and text styling
- **`spacing`**: Consistent spacing scale

### Color Palette
Standard color keys supported:
- `primary`: Main brand color
- `secondary`: Secondary brand color  
- `accent`: Accent/highlight color
- `background`: Page background color
- `text`: Primary text color

### Typography System
Font family configuration:
- `primary`: Body text font
- `secondary`: Heading/title font

### Spacing Scale
Consistent spacing tokens:
- `xs`, `sm`, `md`, `lg`, `xl`, `2xl`: Progressive spacing scale

## Testing and Validation

### Development Testing
```bash
# Build the themes package
pnpm build:themes

# Test with example application
pnpm dev:example
```

### Theme Validation
- **YAML parsing**: Ensures valid YAML structure
- **Type checking**: TypeScript validation of theme properties
- **Color validation**: Hex code and named color validation
- **Integration testing**: Cross-package theme usage validation

## Future Enhancements

### Planned Features
- **Theme variants**: Light/dark mode support
- **Component theming**: Per-component style overrides
- **Theme inheritance**: Base theme extension capabilities
- **Advanced typography**: Font weight and size scales
- **Animation themes**: Motion and transition definitions

### Performance Optimizations
- **Theme caching**: Runtime theme resolution caching
- **Build-time optimization**: Static theme extraction
- **Selective loading**: Dynamic theme loading

## Contributing

### Adding New Themes
1. Create theme YAML definition
2. Add to package exports
3. Update documentation
4. Test across components

### Extending Theme Properties
1. Update TypeScript types
2. Modify parsing logic
3. Update component integration
4. Add CLI generation support

---

**Note**: The themes package is currently in active development (version 0.3.1-alpha.1). Theme structure and APIs may evolve as the framework matures.