# 🚢 launch-stackwright

The fastest way to get started with Stackwright — launch a new project with the otter raft ready to build.

## Quick Start

```bash
npx launch-stackwright my-awesome-site
cd my-awesome-site
pnpm install
pnpm dev
```

## What You Get

When you run `launch-stackwright`, you get:

- ✅ A fully configured Next.js + Stackwright project
- ✅ Theme configuration (`stackwright.yml`)
- ✅ Example pages in YAML
- ✅ **The Otter Raft** 🦦🦦🦦🦦 — AI agents ready to build your site

## Using the Otter Raft

After launching your project, invoke the Foreman Otter to orchestrate your entire site build:

```bash
code-puppy invoke stackwright-foreman-otter
```

Then say: **"Build me a [law firm / wellness startup / SaaS marketing] website"**

The raft includes four specialized otters:
- 🦦🏗️ **Foreman Otter** — Coordinates the entire build
- 🦦🎨 **Brand Otter** — Discovers your brand through conversation
- 🦦🌈 **Theme Otter** — Designs your visual theme
- 🦦📄 **Page Otter** — Builds your content pages

## CLI Options

```bash
launch-stackwright [directory] [options]

Options:
  --name <name>       Project name (used in package.json)
  --title <title>     Site title shown in app bar and browser tab
  --theme <themeId>   Theme ID (corporate, creative, minimal, etc.)
  --force             Launch even if directory is not empty
  --skip-otters       Skip copying otter raft configs
  -y, --yes           Skip all prompts, use defaults
  -V, --version       Output version number
  -h, --help          Display help
```

## Examples

```bash
# Interactive mode (default)
npx launch-stackwright my-site

# Specify everything upfront
npx launch-stackwright my-site --name "my-awesome-app" --title "My Awesome Site" --theme corporate

# Quick start with defaults
npx launch-stackwright my-site --yes

# Skip otter setup (just scaffold the project)
npx launch-stackwright my-site --skip-otters
```

## What Gets Created

```
my-awesome-site/
├── .code-puppy.json           # Code Puppy + MCP auto-config
├── .stackwright/
│   └── otters/                # The otter raft configs
│       ├── stackwright-foreman-otter.json
│       ├── stackwright-brand-otter.json
│       ├── stackwright-theme-otter.json
│       └── stackwright-page-otter.json
├── pages/
│   ├── content.yml            # Home page
│   ├── about/content.yml      # About page
│   ├── [...slug].tsx          # Dynamic page router
│   └── _app.tsx               # Next.js app wrapper
├── stackwright.yml            # Theme configuration
├── next.config.js             # Next.js config
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

## Prerequisites

- **Node.js** 18+ and **pnpm**
- **Code Puppy CLI** (optional, for otter raft features)

Install Code Puppy:
```bash
npm install -g @peraspera/code-puppy
```

## Learn More

- [Stackwright Documentation](https://github.com/Per-Aspera-LLC/stackwright)
- [Otter Raft Architecture](https://github.com/Per-Aspera-LLC/stackwright/blob/main/OTTER_ARCHITECTURE.md)
- [Code Puppy](https://github.com/Per-Aspera-LLC/code-puppy)

## License

MIT
