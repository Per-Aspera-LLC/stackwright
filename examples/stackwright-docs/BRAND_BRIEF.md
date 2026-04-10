# Brand Brief — Stackwright Documentation

## 🎯 Core Identity

**Product**: Stackwright  
**Tagline**: YAML is the syntax. The schema is the safety net. AI writes the code.  
**Audience**: 
- Primary: Hackathon teams at Modern Day Marine (military/government) shipping demos in hours
- Secondary: Developers evaluating Stackwright as a framework
- Tertiary: AI agent developers integrating with the MCP server

**Core Message** (the 5-second takeaway):  
*"From API spec to working Next.js app in hours — safe by construction."*

**Value Proposition**:  
Stackwright is a typed DSL that compiles YAML content files into production-ready Next.js applications. AI agents write the YAML, the schema enforces safety, and the output is a standard React app you own. Audit the platform once, not every generated app.

---

## 🎨 Brand Personality

**Adjectives**: Precise, Confident, Functional

**Emotional Target**:  
- **During visit**: Clarity ("I know exactly what to do"), Confidence ("This will ship to production"), Speed ("I can demo this today")
- **After visit**: Relief ("I have a real app, not a prototype")

**Voice Tone**:  
Technical but approachable. Like the best developer docs (Stripe, Cloudflare, Tailwind) — confident without arrogance. The tool speaks through what it enables. Every word earns its space. No buzzwords, only outcomes.

---

## 🌈 Visual Direction

**Color Mood**:  
Dark-mode-first with **warm amber accents**. Deep navy background (#0B1F3A, #0a0f1a) with high-contrast white text. Warm gold/amber (#D4AF37, #E67E22) for CTAs, highlights, and the otter personality hook. Subtle cyan/blue for code syntax and secondary accents.

**Color Psychology**:
- **Midnight Navy (#0B1F3A)** = technical depth, seriousness, focus
- **Warm Amber (#E67E22)** = speed, value, the otter personality
- **Gold Accent (#D4AF37)** = production-grade quality, trust through craft
- **Cyan/Blue** = code, schema, technical precision

**Typography**:  
- **Headings**: Monospace (matches code blocks, reinforces "typed DSL" concept) — bold, high contrast
- **Body**: Clean sans-serif (Inter, system-ui) — optimized for readability in dark mode
- **Code**: Monospace with syntax highlighting (amber/cyan/white palette)

**Density**: Generous whitespace. Each section breathes. Hierarchy through spacing, not decoration.

**Imagery**:  
- **Icons**: Simple line icons (Lucide style) in feature grids — functional, not decorative
- **Emoji**: 🦦 otter as the personality hook (nav, footer, mascot) — sparingly, not overused
- **Code blocks**: Prominent, well-highlighted — YAML examples are the hero content
- **No photography, no abstract illustrations, no gradient blobs**

**Layout**:  
Sidebar docs layout (like Code Puppy):
- Persistent left sidebar with emoji-prefixed navigation
- Main content area with generous margins
- Feature grids (3-column on desktop, stack on mobile)
- Callout boxes for key concepts (schema safety, MCP integration)
- Sticky header with dark theme toggle (though default is dark)

---

## 📄 Content Strategy

### Pages Needed
1. **Home** (index) — Hero + Features + Quick Install + "Why Stackwright"
2. **Getting Started** — Installation → First Page → Deploy
3. **Content Types Reference** — Auto-generated table from Zod schemas
4. **CLI Reference** — `stackwright` command documentation
5. **Otter Raft Guide** — AI agent pipeline (Brand → Theme → Page otters)
6. **Framework Guide** — For developers extending Stackwright
7. **MCP Server** — For AI agent integrations

### Primary CTA
**"Get Started"** (amber button, high contrast) → `/getting-started`

### Secondary CTAs
- **"View on GitHub"** (outlined button)
- **"Try the Demo"** (if demo site exists)

### Hero Message (Home Page)
```
YAML is the syntax.
The schema is the safety net.
AI writes the code.

From API spec to working Next.js app in hours.
```

**Sub-message**:  
Stackwright is a typed DSL where AI agents write YAML, the schema enforces safety, and the output is a production-ready React app you own. Audit the platform, not every app.

### Feature Grid (Home Page)
- 🦦 **AI-Native Authoring** — Otters write YAML, you get React
- 🔒 **Safe by Construction** — Zod schemas enforce correctness
- ⚡ **Hours, Not Days** — API spec to working demo in a hackathon sprint
- 🎨 **Theme System** — Dark mode, custom palettes, typography — all in YAML
- 🏗️ **Standard React Output** — No lock-in, no runtime magic — just Next.js
- 🔌 **MCP Integration** — AI agents via Model Context Protocol

---

## 🎯 Differentiation

### Competitors / Adjacent Tools
- **v0, Bolt, Lovable** (AI code generators) — generate React code directly
- **Builder.io, Webflow** (visual site builders) — drag-and-drop UIs
- **Gatsby, Hugo, Jekyll** (static site generators) — Markdown → HTML
- **Code Puppy** (AI agent tool) — generates code, not constrained YAML

### How We're Different

| Them | Us |
|------|-----|
| AI writes code you can't audit | AI writes YAML the schema validates |
| Prototype-grade output | Production-ready Next.js apps |
| Lock-in to platform | Own the React codebase |
| "Move fast and break things" | "Move fast with safety nets" |
| Opaque generation | Transparent compilation |

**Visual Differentiation**:  
- **Warmer accent color** (amber vs. blue) — conveys craft, value, the otter personality
- **Monospace headings** — reinforces "typed DSL" concept
- **Code-first examples** — YAML is the hero, not marketing copy
- **Otter mascot** — personality without being whimsical

**Messaging Differentiation**:  
- **Concrete over abstract**: "From API spec to working demo in hours" NOT "Revolutionize your workflow"
- **Safety as feature**: "Audit the platform, not every app" NOT "AI magic"
- **Outcomes over process**: "Production-ready Next.js" NOT "Powered by AI"

### What to Avoid

**Feelings to Avoid**:
- ❌ Cheap or prototype-y
- ❌ Overly playful (despite the otter — keep it functional)
- ❌ Overwhelming complexity
- ❌ "AI will replace you" anxiety

**Visual Tropes to Avoid**:
- ❌ Gradient hero blobs
- ❌ Corporate stock photos
- ❌ Abstract "empowerment" imagery
- ❌ Overwhelming feature lists

**Messaging to Avoid**:
- ❌ Buzzwords: "revolutionary", "cutting-edge", "disruptive", "game-changing"
- ❌ Jargon without context: define terms (DSL, MCP, Zod) on first use
- ❌ Abstract promises: "empower teams" → "ship demos in hours"
- ❌ Defensive tone: confident, not apologetic

---

## 🦦 Brand Guidelines (for Theme & Page Otters)

### Color Palette (Dark Mode Default)

#### Background & Surface
```yaml
background: '#0B1F3A'      # Deep navy — primary background
surface: '#1a2942'         # Lighter navy — cards, code blocks
surfaceVariant: '#243447'  # Even lighter — hover states, borders
```

#### Text
```yaml
text: '#FFFFFF'            # Pure white — headings, high-emphasis text
textSecondary: '#B0BEC5'   # Cool gray — body text, descriptions
textMuted: '#78909C'       # Muted gray — captions, metadata
```

#### Accents
```yaml
primary: '#E67E22'         # Warm amber — CTAs, links, otter personality
primaryDark: '#D35400'     # Darker amber — hover states
gold: '#D4AF37'            # Warm gold — highlights, success states
cyan: '#4FC3F7'            # Cool cyan — code keywords, secondary accents
cyanDark: '#0288D1'        # Dark cyan — code strings, links in code
```

#### Semantic Colors
```yaml
success: '#66BB6A'         # Green — success callouts, checkmarks
warning: '#FFA726'         # Orange — warning callouts
danger: '#EF5350'          # Red — errors, deprecation notices
info: '#4FC3F7'            # Cyan — info callouts, tips
```

### Typography Hierarchy

#### Headings (Monospace)
```
h1: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace
     48px / 56px, weight 700, color: #FFFFFF
     
h2: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace
     36px / 44px, weight 700, color: #FFFFFF
     
h3: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace
     24px / 32px, weight 600, color: #FFFFFF
```

#### Body (Sans-Serif)
```
body1: 'Inter', -apple-system, system-ui, sans-serif
       16px / 26px, weight 400, color: #B0BEC5
       
body2: 'Inter', -apple-system, system-ui, sans-serif
       14px / 22px, weight 400, color: #B0BEC5
```

#### Code (Monospace)
```
code: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace
      14px / 22px, weight 400, background: #1a2942
```

### Voice Guidelines

#### DO:
- ✅ **Be direct**: "Install Stackwright" not "Let's get started with installation"
- ✅ **Be concrete**: "Ship a demo in 6 hours" not "Accelerate your workflow"
- ✅ **Be confident**: "Stackwright compiles YAML to React" not "Stackwright tries to compile..."
- ✅ **Define jargon**: "Stackwright is a typed DSL (domain-specific language)..."
- ✅ **Show, don't tell**: Code examples > paragraphs of explanation
- ✅ **Use the otter sparingly**: 🦦 in nav, section headers, footer — not every sentence

#### DON'T:
- ❌ **Avoid buzzwords**: "innovative", "cutting-edge", "revolutionary", "game-changing", "disruptive"
- ❌ **Avoid marketing speak**: "empower teams", "unlock potential", "transform workflows"
- ❌ **Avoid apologizing**: "Stackwright is just a framework..." — be confident
- ❌ **Avoid overwhelming**: One CTA per section, clear next steps
- ❌ **Avoid abstraction**: Concrete outcomes, not abstract promises

#### Example Voice Transformations

| ❌ Don't Say | ✅ Do Say |
|-------------|----------|
| "Stackwright revolutionizes web development" | "Stackwright compiles YAML to production Next.js apps" |
| "Empower your team to build faster" | "Ship demos in hours, not days" |
| "Cutting-edge AI-powered framework" | "AI agents write YAML. The schema enforces safety." |
| "Unlock the potential of your ideas" | "From API spec to working demo" |
| "Let's get started on your journey" | "Install Stackwright" |

### Visual Hierarchy Principles

#### Section Spacing
- **Between major sections**: 120px vertical spacing
- **Between subsections**: 80px vertical spacing
- **Between elements**: 24px vertical spacing
- **Paragraph spacing**: 16px vertical spacing

#### Card Design (Feature Grids)
```yaml
background: '#1a2942'         # Surface color
border: '1px solid #243447'   # Subtle border
borderRadius: '8px'           # Soft corners, not too round
padding: '32px'               # Generous internal spacing
hover:
  borderColor: '#E67E22'      # Amber highlight on hover
  transform: 'translateY(-2px)' # Subtle lift
```

#### Callout Boxes
```yaml
info:
  background: 'rgba(79, 195, 247, 0.1)'  # Cyan tint
  border: '1px solid #4FC3F7'
  icon: '💡'
  
warning:
  background: 'rgba(255, 167, 38, 0.1)'  # Orange tint
  border: '1px solid #FFA726'
  icon: '⚠️'
  
success:
  background: 'rgba(102, 187, 106, 0.1)' # Green tint
  border: '1px solid #66BB6A'
  icon: '✅'
```

#### CTAs
```yaml
primary:
  background: '#E67E22'       # Warm amber
  color: '#FFFFFF'
  padding: '12px 32px'
  borderRadius: '6px'
  fontSize: '16px'
  fontWeight: 600
  hover:
    background: '#D35400'     # Darker amber
    transform: 'translateY(-1px)'
    
outlined:
  background: 'transparent'
  color: '#E67E22'
  border: '2px solid #E67E22'
  padding: '10px 30px'
  hover:
    background: 'rgba(230, 126, 34, 0.1)'
```

### Code Block Styling

#### Syntax Highlighting Palette
```yaml
background: '#1a2942'
text: '#B0BEC5'
keyword: '#E67E22'       # Amber — e.g., 'label:', 'type:'
string: '#4FC3F7'        # Cyan — e.g., "Hello World"
number: '#66BB6A'        # Green — e.g., 42
comment: '#78909C'       # Muted gray — e.g., # This is a comment
function: '#D4AF37'      # Gold — e.g., registerComponent()
```

#### Code Block Features
- Line numbers on for YAML examples (show structure)
- Copy button (amber icon, top-right)
- Language label (top-left, muted text)
- Syntax highlighting for YAML, TypeScript, Bash
- Inline code: `background: #243447`, `color: #E67E22`, `padding: 2px 6px`

---

## 🦦 Content Priorities by Page

### Home Page
1. **Hero** — Tagline + 5-second value prop + "Get Started" CTA
2. **Features Grid** — 6 features, 3-column, icon + title + description
3. **Quick Install** — Copy-paste command + 3-step flow
4. **Why Stackwright** — Callout box: "AI writes YAML. Schema enforces safety. You own the React."
5. **Footer** — GitHub link, otter emoji, "Built with Stackwright"

### Getting Started
1. **Installation** — `npx launch-stackwright`, `pnpm install`, `pnpm dev`
2. **Your First Page** — YAML example → rendered output screenshot
3. **Deploy** — Vercel/Netlify one-click deploy
4. **Next Steps** — Links to Content Types, CLI, Otter Raft

### Content Types Reference
1. **Auto-generated table** — from Zod schemas (already exists in framework guide)
2. **Interactive examples** — Click a content type → see YAML + rendered output
3. **Search/filter** — Find content types by use case

### CLI Reference
1. **Command list** — `stackwright generate`, `stackwright dev`, `stackwright build`
2. **Flags and options** — Table format, clear descriptions
3. **Examples** — Real-world use cases

### Otter Raft Guide
1. **Overview** — Brand Otter → Theme Otter → Page Otter pipeline
2. **Brand Otter** — Brand discovery conversation → BRAND_BRIEF.md
3. **Theme Otter** — stackwright.yml from brand brief
4. **Page Otter** — Page YAML from content requirements
5. **MCP Integration** — How to use via Code Puppy or other MCP clients

---

*Built by Stackwright Brand Otter 🦦 — Brand discovery for AI-native authoring*
