# launch-stackwright

## 0.2.0-alpha.1

### Patch Changes

- @stackwright/cli@0.7.0-alpha.4

## 0.2.0-alpha.0

### Minor Changes

- 8e60dbd: Add new `launch-stackwright` package — an npx-compatible scaffolding tool for creating new Stackwright projects. Automatically sets up a fully configured Next.js + Stackwright project with the otter raft (AI agents) ready to build your site through conversation.

  Includes:
  - Project scaffolding with Next.js and Stackwright dependencies
  - Pre-configured otter agent templates (foreman, page, theme, and brand)
  - MCP server auto-configuration for Code Puppy
  - Full AI-assisted development workflow out of the box

  Usage: `npx launch-stackwright my-site`

## 0.1.0 - 2025-03-26

### 🚢 Initial Launch!

The fastest way to get started with Stackwright — launch a new project with the otter raft ready to build.

#### Features

- **One-command project creation**: `npx launch-stackwright my-site`
- **Otter raft included**: All four specialized AI agents (Foreman, Brand, Theme, Page) automatically configured
- **MCP auto-configuration**: `.code-puppy.json` created with Stackwright MCP server settings
- **Full scaffolding**: Uses `@stackwright/cli` scaffold functionality under the hood
- **Flexible options**: Supports all scaffold options (--theme, --name, --title, etc.)
- **Skip otter setup**: Use `--skip-otters` if you just want the project scaffold

#### What Gets Created

```
my-site/
├── .code-puppy.json           # Code Puppy + MCP auto-config
├── .stackwright/
│   └── otters/                # The otter raft configs
│       ├── stackwright-foreman-otter.json
│       ├── stackwright-brand-otter.json
│       ├── stackwright-theme-otter.json
│       └── stackwright-page-otter.json
├── pages/
│   ├── content.yml            # Home page
│   ├── getting-started/
│   │   └── content.yml        # Getting started page
│   ├── [...slug].tsx          # Dynamic page router
│   └── _app.tsx               # Next.js app wrapper
├── stackwright.yml            # Theme configuration
├── next.config.js             # Next.js config
├── package.json               # Dependencies
└── tsconfig.json              # TypeScript config
```

#### Usage

```bash
# Interactive mode (default)
npx launch-stackwright my-site

# Specify everything upfront
npx launch-stackwright my-site --name "my-app" --title "My Site" --theme corporate

# Quick start with defaults
npx launch-stackwright my-site --yes

# Skip otter setup
npx launch-stackwright my-site --skip-otters
```

#### Next Steps After Launching

1. Install dependencies: `pnpm install`
2. Start dev server: `pnpm dev`
3. Invoke the otter raft: `code-puppy invoke stackwright-foreman-otter`
4. Say: "Build me a [law firm / wellness startup / SaaS marketing] website"

The raft will coordinate brand discovery, theme design, and page building — all from conversation!
