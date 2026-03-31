# @stackwright/otters — Agent Reference

AI agents for Stackwright site generation. Each agent is specialized for a single responsibility in the site-building pipeline.

---

## Agent Overview

| Agent | Name | Description |
|-------|------|-------------|
| `stackwright-brand-otter` | Brand Otter 🦦🎨 | Brand discovery through conversation |
| `stackwright-theme-otter` | Theme Otter 🦦🎨 | Visual design (colors, typography) |
| `stackwright-page-otter` | Page Otter 🦦📄 | Content composition (pages, copy) |
| `stackwright-foreman-otter` | Foreman Otter 🦦🏗️ | Pipeline coordination |

---

## stackwright-brand-otter

**Brand Discovery Specialist**

### Purpose
Leads conversational brand discovery to produce a Brand Brief that captures the emotional and visual essence of a user's brand.

### Output
- `BRAND_BRIEF.md` in the project root

### Key Tools
- `ask_user_question` — conversational prompts
- `load_image_for_analysis` — mood board analysis
- `browser_*` — competitor research
- `create_file` — writes BRAND_BRIEF.md

### Workflow
1. Ask about company, audience, core message
2. Explore brand personality (adjectives, voice, tone)
3. Map emotional targets (what visitors should feel)
4. Discuss visual preferences (colors, typography, density)
5. Research competitors with browser tools
6. Synthesize Brand Brief
7. Validate with user before saving

### Brand Brief Sections
- Core Identity (company, tagline, audience, value prop)
- Brand Personality (adjectives, emotional target, voice)
- Visual Direction (color mood, typography, density, imagery)
- Content Strategy (pages, CTA, hero message)
- Differentiation (competitors, how we're different)
- Brand Guidelines (for Theme & Page Otters)

---

## stackwright-theme-otter

**Visual Design Specialist**

### Purpose
Translates Brand Brief into production-ready Stackwright theme configuration.

### Output
- `stackwright.yml` with `customTheme` section

### Key Tools
- `read_file` — reads BRAND_BRIEF.md
- `create_file` — writes stackwright.yml
- `stackwright_validate_site` — validates theme
- `stackwright_render_page` — visual preview

### Workflow
1. Read BRAND_BRIEF.md
2. Design 7-color palette (primary, secondary, accent, background, surface, text, textSecondary)
3. Select typography pairing (headings + body fonts)
4. Build complete stackwright.yml (site config + customTheme)
5. Validate theme
6. Optional: render preview

### Theme Requirements
- **All 7 color keys required** (no optional colors)
- **Hex codes only** (e.g., `#1A365D`, not `blue`)
- **Google Fonts only** (fonts must be on Google Fonts)

### Color Psychology Mapping
| Brand Feel | Primary Color | Example |
|------------|--------------|---------|
| Trust/Professional | Deep blue | `#1A365D` |
| Energy/Excitement | Vibrant orange | `#DD6B20` |
| Calm/Wellness | Soft teal | `#319795` |
| Luxury/Sophistication | Gold | `#D4AF37` |
| Innovation/Tech | Electric blue | `#3182CE` |
| Warmth/Approach | Warm amber | `#DD6B20` |

---

## stackwright-page-otter

**Content Composition Specialist**

### Purpose
Builds Stackwright pages using YAML content types, writing copy in brand voice.

### Output
- `pages/*.yml` (one file per page)

### Key Tools
- `read_file` — reads BRAND_BRIEF.md and stackwright.yml
- `create_file` — writes page YAML
- `stackwright_validate_pages` — validates pages
- `stackwright_render_page` — visual verification

### Content Types

#### Layout Components
| Type | Description |
|------|-------------|
| `main` | Hero sections, text+media blocks, primary content |
| `grid` | Multi-column layouts with nested content |
| `tabbed_content` | Tabbed content sections |

#### Feature Showcases
| Type | Description |
|------|-------------|
| `feature_list` | Multi-column feature grid (icon + title + description) |
| `icon_grid` | Icon showcase grid |
| `testimonial_grid` | Customer testimonials |
| `carousel` | Image/content carousel |

#### Specialized Content
| Type | Description |
|------|-------------|
| `pricing_table` | Pricing plans with features |
| `timeline` | Event timeline |
| `faq` | Accordion-style FAQ |
| `code_block` | Syntax-highlighted code |
| `alert` | Info boxes (info/warning/success/danger/note/tip) |
| `contact_form_stub` | Contact form |

#### Media
| Type | Description |
|------|-------------|
| `media` | Images |
| `video` | Video players |

### Page Structure Patterns

**Home Page:**
1. Hero (`main`) — headline, subheading, CTA
2. Value Prop (`main` or `feature_list`) — what you do
3. Features/Services (`feature_list`) — key offerings
4. Social Proof (`testimonial_grid`) — credibility
5. CTA (`main` with buttons) — conversion

**About Page:**
1. Intro (`main`) — who you are
2. Story (`timeline`) — journey, milestones
3. Team (`grid`) — people
4. Values (`icon_grid`) — what you stand for

**Services Page:**
1. Overview (`main`) — high-level description
2. Services (`tabbed_content`) — detailed offerings
3. Process (`timeline`) — how it works
4. CTA (`contact_form_stub`) — get started

### Important Rules
- Every `content_item` needs a `label` (kebab-case)
- Use theme color names, not hex codes (`background: "primary"`)
- Icon names must match Lucide icons exactly
- Validate before rendering
- Render at multiple viewports (desktop + mobile)

---

## stackwright-foreman-otter

**Pipeline Coordinator**

### Purpose
Orchestrates the full site-building pipeline by coordinating Brand, Theme, and Page Otters.

### Key Tools
- `invoke_agent` — invokes specialist otters
- `stackwright_scaffold_project` — creates new projects
- `stackwright_validate_site` — validates site config
- `stackwright_validate_pages` — validates pages
- `stackwright_render_page` — visual verification

### Workflow Modes

#### Mode 1: Full Build
"Build me a website" → coordinates all three otters

#### Mode 2: Partial Build
"I have a brand brief" → skips Brand Otter

#### Mode 3: Single Phase
"Refine my theme" → invokes specific otter only

### Coordination Rules
1. **Always invoke SEQUENTIALLY** — never in parallel
2. **Check for existing assets** before invoking
3. **Validate after each phase**
4. **Explain what's happening** to the user

### Handoff Protocol
```
User Request
     │
     ▼
Foreman → Brand Otter → (creates BRAND_BRIEF.md)
     │
     ▼
Foreman → Theme Otter → (creates stackwright.yml)
     │
     ▼
Foreman → Page Otter → (creates pages/)
     │
     ▼
Foreman → Visual Verification
     │
     ▼
   User
```

---

## Brand Voice Examples

### Direct & Confident (e.g., Per Aspera)
✅ "I replace the discipline your system depends on with structure that doesn't need you."
❌ "We help teams build better systems through innovative approaches."

### Warm & Conversational
✅ "We're here to make your life easier. Let's chat about what you need."
❌ "Our solutions leverage cutting-edge technology to optimize workflows."

### Technical but Approachable
✅ "We use React Server Components to eliminate client-side JavaScript for instant page loads."
❌ "Our proprietary rendering engine achieves sub-millisecond TTFB through advanced optimization."

---

## Icon Reference

Icons use [Lucide](https://lucide.dev/). Common icons by category:

| Category | Icons |
|----------|-------|
| General | `ArrowRight`, `Check`, `X`, `Menu`, `Search` |
| Features | `Zap`, `Shield`, `Heart`, `Star`, `Layers`, `GitBranch` |
| Business | `Briefcase`, `Users`, `Building`, `Calendar`, `Mail` |
| Actions | `Play`, `Pause`, `Download`, `Upload`, `Share`, `Copy` |
| Status | `CheckCircle`, `AlertCircle`, `Info`, `HelpCircle` |

---

## Error Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "missing required field 'label'" | content_item lacks label | Add `label: "section-name"` |
| "Icon not found: 'CheckCircle'" | Wrong icon name | Use exact Lucide name: `CheckCircle` |
| "Color 'blue' is not valid" | Using color name | Use theme color key: `primary` |
| "Missing colors.primary" | Missing required color | Add all 7 color keys |
| "Font not loading" | Font not on Google Fonts | Verify exact Google Fonts name |

---

## MCP Server

Otters require the Stackwright MCP server for scaffolding, validation, and rendering:

```bash
pnpm stackwright-mcp
```

Without the MCP server, otters fall back to CLI commands via `agent_run_shell_command`.

---

**Built with Stackwright + Code Puppy 🐶🦦**
