# @stackwright/otters

🦦 **Stackwright Otter Raft** — AI agents for end-to-end Stackwright site generation.

A coordinated team of specialized AI agents (otters) that work together to build complete Stackwright websites from brand discovery to deployed pages.

---

## Installation

```bash
npm install @stackwright/otters
# or
pnpm add @stackwright/otters
```

The postinstall script automatically installs otters to `~/.code_puppy/agents/` for code-puppy discovery.

If you need to re-run the installation:

```bash
node node_modules/@stackwright/otters/scripts/install-agents.js
```

---

## The Otter Raft

| Otter | Role | Output |
|-------|------|--------|
| 🦦🏗️ **Foreman Otter** | Project coordinator | Orchestrates the pipeline |
| 🦦🎨 **Brand Otter** | Brand discovery | `BRAND_BRIEF.md` |
| 🦦🌈 **Theme Otter** | Visual design | `stackwright.yml` theme |
| 🦦📄 **Page Otter** | Content composition | `pages/*.yml` |

---

## How It Works

### The Pipeline

```
User Request
     │
     ▼
┌────────────────────────┐
│  Foreman Otter         │ ◄── Entry point
│  "Starting build..."   │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│  Brand Otter            │ ◄── Phase 1: Discovery
│  (conversational)      │
└───────┬────────────────┘
        │ creates BRAND_BRIEF.md
        ▼
┌────────────────────────┐
│  Theme Otter            │ ◄── Phase 2: Design
│  (colors, fonts)        │
└───────┬────────────────┘
        │ creates stackwright.yml
        ▼
┌────────────────────────┐
│  Page Otter            │ ◄── Phase 3: Content
│  (pages)               │
└───────┬────────────────┘
        │ creates pages/
        ▼
┌────────────────────────┐
│  Visual Verification   │ ◄── Screenshots
└───────┬────────────────┘
        │
        ▼
     USER
```

### Invoking Otters

Otters are invoked through Code Puppy's agent invocation:

```bash
# Start a full site build
code-puppy -i -a stackwright-foreman-otter

# Just refine the theme
code-puppy -i -a stackwright-theme-otter

# Add a new page
code-puppy -i -a stackwright-page-otter
```

---

## File-Based Handoffs

| File | Created By | Read By |
|------|-----------|---------|
| `BRAND_BRIEF.md` | Brand Otter | Theme Otter, Page Otter |
| `stackwright.yml` | Theme Otter | Page Otter |
| `pages/*.yml` | Page Otter | (rendered) |

---

## Visual Verification

Each otter uses Stackwright MCP tools for visual verification:

- `stackwright_render_page` — screenshot a page
- `stackwright_render_diff` — before/after comparison
- `stackwright_check_dev_server` — verify dev server is running

---

## Architecture Details

For detailed architecture documentation, see [OTTER_ARCHITECTURE.md](../../OTTER_ARCHITECTURE.md) in the monorepo root.

### Key Principles

1. **Separation of Concerns** — Each otter owns one domain
2. **Sequential Execution** — Dependencies enforced by Foreman
3. **File-Based Handoffs** — BRAND_BRIEF.md, stackwright.yml, pages/*.yml
4. **Validation at Every Step** — No invalid YAML proceeds
5. **Visual Verification** — Screenshots close the feedback loop

---

## Package Structure

```
@stackwright/otters/
├── package.json
├── tsconfig.json
├── README.md
├── AGENTS.md              # Agent reference
├── scripts/
│   └── install-agents.js  # Postinstall script
└── src/
    ├── stackwright-brand-otter.json
    ├── stackwright-foreman-otter.json
    ├── stackwright-page-otter.json
    └── stackwright-theme-otter.json
```

---

## Dependencies

Otters rely on:

- **@stackwright/mcp** — MCP server for scaffolding, validation, and rendering
- **@stackwright/core** — Core Stackwright types and utilities
- **Code Puppy** — Agent runtime environment

---

## License

MIT
