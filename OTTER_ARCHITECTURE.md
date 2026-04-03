# Stackwright Otter Raft Architecture 🦦

> **A raft of otters** is the collective noun for a group of otters floating together. Our raft of specialized AI agents coordinates seamlessly to build complete Stackwright sites! 🦦🦦🦦🦦

## The Biology Analogy: How Real Otters Coordinate

Real otters form rafts not because a central controller tells them to, but because they discover each other and find complementary behaviors. A mother otter knows her pup can't swim far yet—so she finds other mothers and they form a "creche," taking turns watching the young while others forage. An adult male finds other males and they patrol boundaries together. The raft emerges from **discovery**, not **command**.

**Our AI otters work exactly the same way.** Each otter starts by looking around to see who else is available, then adapts its coordination strategy based on what it finds:

```
┌─────────────────────────────────────────────────────────────┐
│                    DYNAMIC DISCOVERY                        │
└─────────────────────────────────────────────────────────────┘

  Brand Otter:     "Let me check who's in the water..."
                   → list_agents() finds: [Theme Otter, Page Otter]
                   → "I'll create a brand brief that sets up the theme"

  Theme Otter:     "Dashboard Otter available! Want live data integration?"
                   → discovers Dashboard Otter at runtime
                   → adapts theme to support dashboard components

  Page Otter:      "I see Brand Otter and Theme Otter completed their work"
                   → reads BRAND_BRIEF.md and stackwright.yml
                   → builds pages using established brand identity
```

This is fundamentally different from traditional agent systems where a central coordinator hard-codes knowledge of all agents. Here, **the raft self-organizes at runtime**.

---

## Dynamic Discovery (The Biological Model)

Unlike traditional agent systems where a central coordinator hard-codes knowledge of all agents, our otters discover each other at runtime:

```typescript
// Every otter starts by discovering who else is in the water
const agents = await list_agents();
const otters = agents.filter(a => a.name.endsWith('-otter'));

// Each otter adapts its behavior based on who it finds
// Brand Otter: "I'm alone - I'll guide brand discovery myself"
if (otters.length === 0) {
  await run_brand_discovery();
}

// Page Otter: "Dashboard Otter available! Want live data?"
if (otters.includes('dashboard-otter')) {
  suggest_live_data_integration();
}

// Theme Otter: "Pro Theme Otter found! Shall I suggest enterprise variants?"
if (otters.includes('pro-theme-otter')) {
  suggest_enterprise_themes();
}
```

This means:
- **No central planner needs to know everything** — the Foreman discovers agents dynamically
- **Otters self-organize based on availability** — new otters are picked up automatically
- **New otters are discovered automatically** — drop in a new agent, it's immediately available
- **The raft adapts to what's installed** — partial deployments work gracefully

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│           "Build me a law firm website"                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              🦦🏗️  FOREMAN OTTER (Dynamic Coordinator)       │
│                                                              │
│  • Discovers available otters via list_agents()            │
│  • Builds coordination graph at runtime                     │
│  • Invokes discovered otters dynamically                    │
│  • Handles missing otters gracefully                         │
└────────┬──────────────────┬───────────────────┬─────────────┘
         │                  │                   │
         ▼                  ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🦦🎨 BRAND      │ │  🦦🌈 THEME      │ │  🦦📄 PAGE      │
│     OTTER       │ │     OTTER       │ │     OTTER       │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ Discovers brand │ │ Designs theme   │ │ Builds pages    │
│ through         │ │ (colors, fonts, │ │ using content   │
│ conversation    │ │ spacing)        │ │ types           │
│                 │ │                 │ │                 │
│ OUTPUT:         │ │ INPUT:          │ │ INPUT:          │
│ BRAND_BRIEF.md  │ │ BRAND_BRIEF.md  │ │ BRAND_BRIEF.md  │
│                 │ │                 │ │ stackwright.yml │
│                 │ │ OUTPUT:         │ │                 │
│                 │ │ stackwright.yml │ │ OUTPUT:         │
│                 │ │                 │ │ pages/*.yml     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                   │
         └──────────────────┴───────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   STACKWRIGHT PROJECT                        │
│                                                              │
│  📁 Project Root/                                            │
│    ├── BRAND_BRIEF.md        ← Brand Otter                  │
│    ├── stackwright.yml        ← Theme Otter                 │
│    ├── pages/                 ← Page Otter                  │
│    │   ├── content.yml        (home)                        │
│    │   ├── about/             (about page)                  │
│    │   │   └── content.yml                                  │
│    │   └── services/          (services page)               │
│    │       └── content.yml                                  │
│    └── public/                                               │
│        └── images/            (co-located images)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Emergent Coordination Examples

The beauty of dynamic discovery is that coordination **emerges** from what otters find, rather than being hard-coded:

### Example 1: Page Otter Discovers Dashboard Otter
```
Page Otter: "Running list_agents()..."
           → Found: brand-otter, theme-otter, dashboard-otter

Page Otter: "Dashboard Otter is available! Shall I create
             a live metrics page with real-time data?"
```

### Example 2: Theme Otter Discovers Pro Theme Otter
```
Theme Otter: "Checking for specialized theme agents..."
            → Found: pro-theme-otter

Theme Otter: "Pro Theme Otter detected! I can suggest 
              enterprise-grade theme variants with
              advanced components."
```

### Example 3: Brand Otter Works Alone
```
Brand Otter: "Checking for collaboration..."
            → Found: []

Brand Otter: "No other otters available. I'll guide brand
              discovery myself and create a complete
              BRAND_BRIEF.md."
```

### Example 4: Foreman Handles Missing Otter Gracefully
```
Foreman: "Attempting to invoke dashboard-otter..."
         → Error: Agent not found

Foreman: "Dashboard Otter not installed. Falling back to
          static page content. User can add Dashboard Otter
          later for live data."
```

---

## Comparison: Traditional vs. Stackwright Otters

| Aspect | Traditional Agent Systems | Stackwright Otters |
|--------|---------------------------|---------------------|
| **Coordination** | Central planner hard-codes all agents | Otters discover each other at runtime |
| **Extensibility** | New agent = update all coordinators | Drop in new otter = automatically discovered |
| **Coupling** | Tight (by name/interface) | Loose (by capability) |
| **Failure mode** | Single point of failure | Graceful degradation |
| **Self-organization** | Top-down command | Bottom-up discovery |
| **Partial deployment** | Requires all agents | Works with available otters |
| **Knowledge required** | Central planner must know all | Each otter knows only its domain |

---

## Data Flow

```
1. Brand Discovery Phase
   User ─┬─> Brand Otter asks questions
         ├─> Browser research (competitors)
         ├─> Image analysis (mood boards)
         └─> Creates BRAND_BRIEF.md

2. Theme Design Phase
   BRAND_BRIEF.md ─┬─> Theme Otter reads brief
                   ├─> Designs 7-color palette
                   ├─> Selects typography pairing
                   ├─> Builds stackwright.yml
                   └─> Validates theme

3. Page Building Phase
   BRAND_BRIEF.md ─┬─> Page Otter reads brief + theme
   stackwright.yml ─┤
                   ├─> Plans page structure
                   ├─> Writes copy in brand voice
                   ├─> Composes content_items
                   ├─> Validates YAML
                   └─> Renders pages

4. Verification & Handoff
   pages/*.yml ─┬─> Visual rendering (MCP tools)
                ├─> Desktop screenshot (1280x720)
                ├─> Mobile screenshot (375x667)
                └─> User review & iteration
```

---

## MCP Tool Usage by Otter

**Important**: Foreman Otter uses MCP tools (`stackwright_scaffold_project`) instead of shell commands for project scaffolding. This ensures it works without requiring a globally installed CLI.

### Tool Categories

All MCP tools are organized into these categories:

**PROJECT TOOLS**
- `stackwright_get_project_info` — Get project info (versions, theme, pages)
- `stackwright_scaffold_project` — Scaffold new Stackwright project

**SITE TOOLS**
- `stackwright_get_site_config` — Read stackwright.yml content
- `stackwright_write_site_config` — Write/update stackwright.yml
- `stackwright_validate_site` — Validate stackwright.yml schema
- `stackwright_list_themes` — List available built-in themes

**PAGE TOOLS**
- `stackwright_list_pages` — List all pages in project
- `stackwright_get_page` — Read page YAML content
- `stackwright_write_page` — Write/update page YAML
- `stackwright_add_page` — Create new page with boilerplate
- `stackwright_validate_pages` — Validate page YAML against schema

**CONTENT TOOLS**
- `stackwright_get_content_types` — List all content types with fields
- `stackwright_preview_component` — Show screenshot preview of component

**RENDER TOOLS**
- `stackwright_check_dev_server` — Verify dev server is running
- `stackwright_render_page` — Screenshot a page
- `stackwright_render_yaml` — Preview YAML without saving (temporary)
- `stackwright_render_diff` — Before/after comparison

### MCP Tools by Otter

```
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ Otter           │ MCP Tools                                                  │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Brand Otter     │ • None (pure conversation)                                 │
│                 │ • Browser tools (research)                                 │
│                 │ • File creation (BRAND_BRIEF.md)                           │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Theme Otter     │ • stackwright_get_site_config                              │
│                 │ • stackwright_write_site_config                            │
│                 │ • stackwright_validate_site                                │
│                 │ • stackwright_list_themes                                  │
│                 │ • stackwright_render_yaml (preview before commit)           │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Page Otter      │ • stackwright_get_content_types                            │
│                 │ • stackwright_list_pages                                   │
│                 │ • stackwright_write_page                                   │
│                 │ • stackwright_validate_pages                               │
│                 │ • stackwright_preview_component                             │
│                 │ • stackwright_render_page                                  │
│                 │ • stackwright_render_yaml (preview before commit)           │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Foreman Otter   │ • stackwright_get_project_info                             │
│                 │ • stackwright_scaffold_project                             │
│                 │ • stackwright_validate_site                                │
│                 │ • stackwright_validate_pages                               │
│                 │ • stackwright_check_dev_server                             │
│                 │ • list_agents (dynamic discovery)                          │
│                 │ • invoke_agent (coordination)                              │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPENDENCY FLOW                           │
└─────────────────────────────────────────────────────────────┘

Level 0: User Input
  └─> "Build me a [type] website"

Level 1: Foreman Otter
  └─> Scaffolds project (if needed)
  └─> Discovers available otters dynamically

Level 2: Brand Otter
  └─> Creates BRAND_BRIEF.md
      └─> NO dependencies

Level 3: Theme Otter
  └─> Creates stackwright.yml
      └─> DEPENDS ON: BRAND_BRIEF.md

Level 4: Page Otter
  └─> Creates pages/*.yml
      └─> DEPENDS ON: BRAND_BRIEF.md, stackwright.yml

Level 5: Verification
  └─> Visual rendering
      └─> DEPENDS ON: pages/*.yml, dev server running
```

**CRITICAL**: Otters must be invoked SEQUENTIALLY, never in parallel.

---

## Handoff Protocol

```
User Request
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│  Foreman Otter (Dynamic Coordinator)                        │
│  "Starting full build"                                     │
│  → list_agents() to discover available otters             │
└───────┬────────────────────────────────────────────────────┘
        │ invoke
        ▼
┌────────────────────────┐
│  Brand Otter           │ ◄── Phase 1: Discovery
│  "Leading brand        │
│   discovery..."        │
└───────┬────────────────┘
        │ creates BRAND_BRIEF.md
        ▼
┌────────────────────────┐
│  Foreman Otter         │ ◄── Validates completion
│  "Brand brief ready,   │
│   moving to theme"     │
└───────┬────────────────┘
        │ invoke
        ▼
┌────────────────────────┐
│  Theme Otter           │ ◄── Phase 2: Design
│  "Building custom      │
│   theme..."            │
└───────┬────────────────┘
        │ creates stackwright.yml
        ▼
┌────────────────────────┐
│  Foreman Otter         │ ◄── Validates completion
│  "Theme ready,         │
│   building pages"      │
└───────┬────────────────┘
        │ invoke
        ▼
┌────────────────────────┐
│  Page Otter            │ ◄── Phase 3: Content
│  "Building pages..."  │
└───────┬────────────────┘
        │ creates pages/*.yml
        ▼
┌────────────────────────┐
│  Foreman Otter         │ ◄── Verification
│  "Rendering pages..." │
└───────┬────────────────┘
        │ visual verification
        ▼
┌────────────────────────┐
│  User                  │ ◄── Handoff
│  "Site is ready!      │
│   Run pnpm dev"       │
└────────────────────────┘
```

---

## State Machine

```
┌──────────────┐
│  UNSTARTED   │ ◄── User hasn't requested anything
└──────┬───────┘
       │ "Build me a website"
       ▼
┌──────────────┐
│  SCAFFOLDING │ ◄── Project setup
└──────┬───────┘
       │ project exists
       ▼
┌──────────────┐     yes   ┌────────────────┐
│ BRAND_BRIEF  ├──────────►│ SKIP_BRAND     │
│ EXISTS?      │            └────────┬───────┘
└──────┬───────┘                     │
       │ no                          │
       ▼                             │
┌──────────────┐                     │
│ DISCOVERING  │ ◄── Brand Otter    │
└──────┬───────┘                     │
       │ BRAND_BRIEF.md created      │
       ▼                             │
┌──────────────┐◄────────────────────┘
│ THEMING      │ ◄── Theme Otter
└──────┬───────┘
       │ stackwright.yml ready
       ▼
┌──────────────┐
│ BUILDING     │ ◄── Page Otter
└──────┬───────┘
       │ pages/*.yml created
       ▼
┌──────────────┐
│ VERIFYING    │ ◄── Visual rendering
└──────┬───────┘
       │ screenshots generated
       ▼
┌──────────────┐
│  COMPLETE    │ ◄── Ready for user review
└──────────────┘
       │ iteration requested
       ▼
┌──────────────┐
│  REFINING    │ ◄── Re-invoke specific otter
└──────┬───────┘
       │ updates made
       └──────► (back to VERIFYING)
```

---

## Error Handling Flow

```
Otter Invocation
     │
     ▼
┌────────────────┐
│ Validation     │
│ Check          │
└────┬───────┬───┘
     │       │
  ✅ │       │ ❌
     │       │
     │       ▼
     │   ┌────────────────┐
     │   │ Foreman reads  │
     │   │ error message  │
     │   └────┬───────────┘
     │        │
     │        ▼
     │   ┌────────────────┐
     │   │ Fix possible?  │
     │   └────┬───────┬───┘
     │        │       │
     │     yes│       │ no
     │        │       │
     │        ▼       ▼
     │   ┌─────────┐ ┌──────────────┐
     │   │ Auto-fix│ │ Re-invoke    │
     │   │ & retry │ │ with error   │
     │   └─────────┘ └──────────────┘
     │
     ▼
┌────────────────┐
│ SUCCESS        │
│ Continue       │
│ pipeline       │
└────────────────┘
```

---

## Comparison: Legacy vs. New Architecture

```
┌────────────────────────────────────────────────────────────┐
│ LEGACY: Designer Otter (Monolithic)                        │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────┐                       │
│  │   Designer Otter                │                       │
│  │                                 │                       │
│  │  • Brand discovery              │                       │
│  │  • Theme design                 │                       │
│  │  • Page building                │                       │
│  │  • ALL IN ONE AGENT             │                       │
│  └─────────────────────────────────┘                       │
│                                                             │
│  ❌ Hard to maintain                                        │
│  ❌ Can't reuse just one phase                             │
│  ❌ Long sessions that can't be paused                     │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ NEW: Specialized Otters (Modular, Self-Discovering)       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Brand Otter  │  │ Theme Otter  │  │ Page Otter   │     │
│  │              │  │              │  │              │     │
│  │ Discovery    │  │ Design       │  │ Content      │     │
│  │ only         │  │ only         │  │ only         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                 ▲                 ▲              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                  ┌────────────────┐                        │
│                  │ Foreman Otter  │                        │
│                  │ (Dynamic       │                        │
│                  │  Discovery)    │                        │
│                  └────────────────┘                        │
│                                                             │
│  ✅ Single Responsibility Principle                        │
│  ✅ Reusable phases (skip brand if brief exists)          │
│  ✅ Pausable workflows                                     │
│  ✅ Easy to test each phase independently                  │
│  ✅ Self-organizing via runtime discovery                  │
│  ✅ Graceful degradation when otters are missing          │
└────────────────────────────────────────────────────────────┘
```

---

## Future Extensions

### Phase 2 (Planned)

```
              Foreman Otter
                    │
         ┌──────────┼──────────┬──────────┐
         ▼          ▼          ▼          ▼
    Brand Otter  Theme    Page Otter  Collection
                 Otter                  Otter
                                           │
                                           ▼
                                   ┌───────────────┐
                                   │ Blog/Docs     │
                                   │ Case Studies  │
                                   └───────────────┘
```

### Phase 3 (Vision)

```
              Foreman Otter
                    │
         ┌──────────┼──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼          ▼
    Brand     Theme     Page    Collection   SEO
    Otter     Otter     Otter   Otter        Otter
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ QA Otter     │
                                          │ (Visual QA,  │
                                          │  A11y,       │
                                          │  Performance)│
                                          └──────────────┘
```

### RAG Integration (Phase 3)

```
All Otters ──┬──► RAG Server ◄── Example Corpus
             │       │              (10-20 sites)
             │       │
             │       ▼
             │   ┌────────────────────────────┐
             │   │ • Semantic search            │
             │   │ • Pattern matching           │
             │   │ • Example retrieval          │
             │   │ • Best practice lookup      │
             │   └────────────────────────────┘
             │
             └──► Grounded suggestions
```

---

## Installation

Otters are distributed as the [`@stackwright/otters`](https://www.npmjs.com/package/@stackwright/otters) npm package:

```bash
npm install @stackwright/otters
# or
pnpm add @stackwright/otters
```

**Auto-install**: The package's `postinstall` script automatically installs otter agent files to `~/.code_puppy/agents/` for code-puppy discovery. No manual copying required!

To re-run installation manually:
```bash
node node_modules/@stackwright/otters/scripts/install-agents.js
```

---

## Key Architectural Principles

1. **Dynamic Discovery** — Otters find each other at runtime, not by hard-coded coordination
2. **Separation of Concerns** — Each otter owns one domain
3. **Sequential Execution** — Dependencies enforced by Foreman
4. **File-Based Handoffs** — BRAND_BRIEF.md, stackwright.yml, pages/*.yml
5. **Validation at Every Step** — No invalid YAML proceeds to next phase
6. **Visual Verification** — Screenshots close the feedback loop
7. **Pausable Workflows** — Can stop after brand, resume later for theme
8. **Reusability** — Skip phases if artifacts already exist
9. **Emergent Coordination** — The raft organizes itself based on available agents

---

**Built with Stackwright + Code Puppy 🐶🦦**
