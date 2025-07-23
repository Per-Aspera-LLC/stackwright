# Stackwright

**Build real web applications from human-readable configs**

Stackwright bridges the gap between no-code builders and custom development. Write your site structure in simple YAML files, get a production-ready React application that developers can extend.

## Why Stackwright?

- **Start Simple**: Non-developers can create and edit sites using YAML configs
- **Scale Smart**: Outputs real Next.js/React code that developers can customize 
- **No Lock-in**: Your site is actual TypeScript code, not proprietary formats
- **Graduation Path**: Begin with configs, add custom components as you grow

Perfect for startups who need more than Squarespace but don't want to build from scratch, and design firms delivering working applications to clients.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the framework
pnpm build

# Run development example
pnpm dev:example
```

## How It Works

Define your pages in YAML:

```yaml
pages:
  - name: home
    purpose: brand introduction and core value proposition
    priority: high
  - name: about  
    purpose: company story and team
    priority: medium
```

Add content structure and styling through declarative configs. Stackwright renders these as professional React components using Material-UI.

## Current Status

🚧 **Early Development** - Core framework is functional but evolving rapidly.

**Available Now:**
- YAML-to-React page generation
- Material-UI component library
- Theme system for consistent styling
- CLI with AI-assisted content generation

**Coming Soon:**
- Expanded component library with advanced layouts
- Live data integration from OpenAPI specifications  
- Visual config editor
- Comprehensive testing and validation
- Plugin system for custom components

## Examples

Check out `test/per-aspera-brief/` for a complete site configuration example.

## Contributing

This is an active project. We welcome contributions, especially:
- Additional React components
- Better TypeScript validation
- Documentation improvements
- Real-world usage examples

## License

MIT - Build something amazing.

---

*Stackwright: Where configuration meets code.*
