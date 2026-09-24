# Stackwright Docs — Agent Guide

Welcome, AI agent! This document provides essential information for working with the Stackwright framework in this project.

## Project Overview

This is the official Stackwright documentation site, built with Next.js + Stackwright.

## Content System

This site uses Stackwright's YAML-driven content system. Pages are defined in `content/pages/` directories as YAML files that reference components.

### Content Type Reference

<!-- stackwright:content-type-table:start -->
This reference now lives in the generated `stackwright-page-authoring` skill — activate that skill instead of reading tables here.

- **Skill:** `stackwright-page-authoring` (`skills/stackwright-page-authoring/SKILL.md`; regenerate with `pnpm stackwright -- generate-skills`)
- **Covers:** per-content-type required/optional fields, enum values, sub-type shapes (TextBlock, ButtonContent, MediaItem, …), TypographyVariant values, and minimal YAML examples.
- **Valid `type` keys:** `carousel`, `main`, `tabbed_content`, `media`, `timeline`, `icon_grid`, `code_block`, `feature_list`, `testimonial_grid`, `faq`, `pricing_table`, `alert`, `contact_form_stub`, `form`, `text_block`, `grid`, `collection_list`, `video`, `map`
<!-- stackwright:content-type-table:end -->

### Interface Contracts

**AGENTS: This table is auto-generated from `@stackwright/types`. Run `pnpm stackwright -- generate-agent-docs` to regenerate. Do NOT edit the content between the markers manually.**

<!-- stackwright:interface-table:start -->
All interface contracts are defined in `@stackwright/types` and re-exported from `@stackwright/collections`, `@stackwright/hooks-registry`, and `@stackwright/scaffold-core` for backward compatibility.

| Interface / Type | Kind | Fields / Signature |
|---|---|---|
| `CollectionProvider` | interface | `list(collection, opts?)` (Promise<CollectionListResult>), `get(collection, slug)` (Promise<CollectionEntry | null>), `collections()` (Promise<string[]>) |
| `CollectionEntry` | interface | `slug` (string), `[key: string]` (unknown) |
| `CollectionListOptions` | interface | `limit`? (number), `offset`? (number), `sort`? (string), `filter`? (Record<string, unknown>) |
| `CollectionListResult` | interface | `entries` (CollectionEntry[]), `total` (number) |
| `ScaffoldHookContext` | interface | `targetDir` (string), `projectName` (string), `siteTitle` (string), `themeId` (string), `packageJson` (Record<string, unknown>), `dependencyMode` ('workspace' | 'standalone'), `codePuppyConfig`? (Record<string, unknown>), `pages`? (string[]), `install`? (boolean), `[key: string]`? (unknown) |
| `ScaffoldHook` | interface | `type` (ScaffoldHookType), `name` (string), `handler` (HookHandler), `priority`? (number), `critical`? (boolean) |
| `HookHandler` | type | `(context: ScaffoldHookContext)` (Promise<void> | void) |
| `ScaffoldHookType` | type | `values` ('preScaffold' | 'preInstall' | 'postInstall' | 'postScaffold') |

**Import paths (all equivalent):**
- `CollectionProvider` — `@stackwright/types` · `@stackwright/collections`
- `ScaffoldHookContext`, `ScaffoldHook`, `HookHandler`, `ScaffoldHookType` — `@stackwright/types` · `@stackwright/hooks-registry` · `@stackwright/scaffold-core`
<!-- stackwright:interface-table:end -->

## Development Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm test       # Run tests
```

## Quick Tips

- All source code is in `src/components` of the respective packages
- Content types are defined in Zod schemas in `@stackwright/types`
- Theme configuration lives in `stackwright.yml`
