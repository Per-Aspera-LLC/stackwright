# Stackwright Otter Agents 🦦

This directory contains AI agent configurations for the Stackwright Otter Squad — specialized agents that orchestrate end-to-end Stackwright site generation.

## The Squad

### 🦦🏗️ Foreman Otter (`stackwright-foreman-otter.json`)
**Role**: Coordinator  
**What it does**: Orchestrates Brand → Theme → Page pipeline, scaffolds projects, validates outputs  
**Entry point**: User says "Build me a [type] website"

### 🦦🎨 Brand Otter (`stackwright-brand-otter.json`)
**Role**: Brand strategist  
**What it does**: Conversational brand discovery → BRAND_BRIEF.md  
**Invoked by**: Foreman Otter (Phase 1)

### 🦦🌈 Theme Otter (`stackwright-theme-otter.json`)
**Role**: Visual designer  
**What it does**: Translates BRAND_BRIEF.md → stackwright.yml theme (colors, fonts, spacing)  
**Invoked by**: Foreman Otter (Phase 2)

### 🦦📄 Page Otter (`stackwright-page-otter.json`)
**Role**: Content architect  
**What it does**: Builds pages/*.yml using brand voice + theme colors  
**Invoked by**: Foreman Otter (Phase 3)

## Installation

These agents work with the Code Puppy CLI and require access to Stackwright MCP tools.

### Option 1: Direct Use (Recommended)
The agents in this directory are the source of truth. Code Puppy will automatically discover them when invoked from this repository.

### Option 2: Global Installation
If you want these agents available globally (outside this repo), symlink them:

```bash
# From the stackwright repository root
ln -sf $(pwd)/otters/*.json ~/.code_puppy/agents/
```

## Architecture

See [OTTER_ARCHITECTURE.md](../OTTER_ARCHITECTURE.md) for detailed architecture diagrams and data flow.

## Prerequisites

1. **MCP Server**: The Foreman Otter uses MCP tools for scaffolding and validation:
   ```bash
   # Start the MCP server (from stackwright repo)
   pnpm stackwright-mcp
   ```

2. **Stackwright CLI**: Required for agent operation (part of this monorepo)

## Usage

### Full Site Build (Foreman Entry Point)
```bash
code-puppy invoke stackwright-foreman-otter
```
Then say: "Build me a [law firm / wellness startup / SaaS marketing] website"

### Individual Phases
```bash
# Brand discovery only
code-puppy invoke stackwright-brand-otter

# Theme design (requires BRAND_BRIEF.md)
code-puppy invoke stackwright-theme-otter

# Page building (requires BRAND_BRIEF.md + stackwright.yml)
code-puppy invoke stackwright-page-otter
```

## MCP Tools Used

| Otter | MCP Tools |
|-------|-----------|
| Brand Otter | None (pure conversation + file creation) |
| Theme Otter | `stackwright_write_site_config`, `stackwright_validate_site`, `stackwright_render_yaml` |
| Page Otter | `stackwright_write_page`, `stackwright_validate_pages`, `stackwright_render_page`, `stackwright_get_content_types` |
| Foreman Otter | `stackwright_scaffold_project`, `stackwright_validate_site`, `stackwright_validate_pages`, `invoke_agent` |

## Output Files

After a full build, you'll have:
- `BRAND_BRIEF.md` — Brand discovery results
- `stackwright.yml` — Custom theme configuration
- `pages/content.yml` — Home page
- `pages/about/content.yml` — About page
- `pages/services/content.yml` — Services page (if requested)
- `pages/contact/content.yml` — Contact page (if requested)

## Troubleshooting

**"stackwright command not found"**  
The otters now use MCP tools (`stackwright_scaffold_project`) instead of the global CLI. Make sure the MCP server is running.

**"Cannot find BRAND_BRIEF.md"**  
Run Brand Otter first, or create BRAND_BRIEF.md manually before invoking Theme/Page Otters.

**"MCP tool not available"**  
Start the MCP server: `pnpm stackwright-mcp` (from stackwright repo root)

## Development

To modify an otter's behavior:
1. Edit the JSON file in this directory
2. Test with `code-puppy invoke stackwright-[otter-name]-otter`
3. Commit changes to git
4. Update OTTERS_SHIPPED.md and OTTER_ARCHITECTURE.md if architecture changes

## References

- [OTTERS_SHIPPED.md](../OTTERS_SHIPPED.md) — Implementation notes and success metrics
- [OTTER_ARCHITECTURE.md](../OTTER_ARCHITECTURE.md) — Architecture diagrams and data flow
- [PHILOSOPHY.md](../PHILOSOPHY.md) — Why the otter architecture exists
- [MCP Tools](../packages/mcp/README.md) — MCP server documentation
