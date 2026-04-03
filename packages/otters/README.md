# @stackwright/otters

🦝 **Otter Raft Architecture** — AI agents that discover each other and self-organize.

Just like real otters, our AI otters don't wait for instructions. They discover 
who's in the water and adapt their behavior accordingly. A Page Otter that finds 
a Dashboard Otter nearby will offer to connect live API data. No central planner required.

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

| Otter | Role | Discovery |
|-------|------|-----------|
| 🦦🏗️ **Foreman Otter** | Dynamic coordinator | Uses `list_agents()` to discover otters |
| 🦦🎨 **Brand Otter** | Brand discovery | May guide discovery itself if alone |
| 🦦🌈 **Theme Otter** | Visual design | Adapts to available Brand output |
| 🦦📄 **Page Otter** | Content composition | Offers Pro features if Dashboard Otter found |

---

## How Otters Discover Each Other

Every otter starts by asking: "Who's out there?"

```bash
code-puppy -i -a stackwright-foreman-otter
# Foreman: "Discovering available otters..."
# Found: Brand Otter ✓, Theme Otter ✓, Page Otter ✓
# Pro detected: API Otter, Dashboard Otter ✓
```

The raft adapts based on what's installed:

| Install Type | Default Otters | Optional Pro Otters |
|--------------|----------------|---------------------|
| OSS only | Brand → Theme → Page | — |
| OSS + Pro | Brand → Theme → Page | Dashboard, API |

When a Page Otter finds a Dashboard Otter in the raft, it:
- Offers to connect live API data to pages
- Suggests dashboard components
- Enables real-time data visualization

---

## How It Works

### The Pipeline

```
User Request
     │
     ▼
┌────────────────────────┐
│  Foreman Otter         │ ◄── Entry point, discovers otters
│  "Starting build..."   │
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│  Brand Otter           │ ◄── Phase 1: Discovery
│  (conversational)      │
└───────┬────────────────┘
        │ creates BRAND_BRIEF.md
        ▼
┌────────────────────────┐
│  Theme Otter           │ ◄── Phase 2: Design
│  (colors, fonts)       │
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
# Start a full site build (Foreman discovers available otters)
code-puppy -i -a stackwright-foreman-otter

# Just refine the theme
code-puppy -i -a stackwright-theme-otter

# Add a new page (offers Pro features if Dashboard Otter found)
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

1. **Self-Discovery** — Otters discover each other at runtime via `list_agents()`
2. **Dynamic Adaptation** — Behavior changes based on available otters
3. **Separation of Concerns** — Each otter owns one domain
4. **Sequential Execution** — Dependencies enforced by Foreman
5. **File-Based Handoffs** — BRAND_BRIEF.md, stackwright.yml, pages/*.yml
6. **Validation at Every Step** — No invalid YAML proceeds
7. **Visual Verification** — Screenshots close the feedback loop

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
