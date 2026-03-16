# @stackwright/collections

## 0.1.0

### Minor Changes

- 27c6083: ## Collections system, `collection_list` content type, dark mode toggle, and example app overhaul

  ### New: `@stackwright/collections` package
  - `CollectionProvider` interface for pluggable data backends
  - `FileCollectionProvider` — reads from prebuild JSON (filesystem, zero async)
  - `collectionProviderRegistry` in `@stackwright/core` for registration

  ### New: `collection_list` content type
  - YAML-driven listing of collection entries with `cards`, `list`, and `compact` layouts
  - Field mapping via `card` config (`title`, `subtitle`, `meta`, `tags`)
  - Prebuild injects `_entries` at build time — zero async at render time
  - Zod schemas: `collectionListContentSchema`, `collectionCardMappingSchema`, `entryPageConfigSchema`

  ### New: Dark mode toggle
  - `colorModeToggle` field added to `appBarContentSchema` and `appBarConfigSchema`
  - `TopAppBar` renders Sun/Moon toggle when enabled
  - Removed type intersection hack — both schemas now agree

  ### Prebuild pipeline changes
  - Collections now process **before** pages (so `collection_list` entries can be injected)
  - `injectCollectionEntries()` walks page JSON and embeds `_entries` from collection indexes
  - `collection_list` added to `KNOWN_CONTENT_TYPE_KEYS` for typo detection

  ### Icon additions
  - Added 20+ Lucide icons to the preset (BookOpen, Calendar, Tag, Bot, Paintbrush, etc.)

  ### Example app overhaul
  - Complete rewrite of home, about, getting-started, and showcase pages
  - Dark amber/charcoal theme with `colorModeToggle: true`
  - Blog index page using `collection_list` content type (pure YAML)
  - Blog entry pages with `[slug].tsx` dynamic routing
  - Removed broken `blog/index.tsx` (had two default exports, phantom imports)
  - Removed `FileCollectionProvider` from `_app.tsx` to prevent `fs` in client bundle

### Patch Changes

- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.

## 0.1.0-alpha.2

### Minor Changes

- 27c6083: ## Collections system, `collection_list` content type, dark mode toggle, and example app overhaul

  ### New: `@stackwright/collections` package
  - `CollectionProvider` interface for pluggable data backends
  - `FileCollectionProvider` — reads from prebuild JSON (filesystem, zero async)
  - `collectionProviderRegistry` in `@stackwright/core` for registration

  ### New: `collection_list` content type
  - YAML-driven listing of collection entries with `cards`, `list`, and `compact` layouts
  - Field mapping via `card` config (`title`, `subtitle`, `meta`, `tags`)
  - Prebuild injects `_entries` at build time — zero async at render time
  - Zod schemas: `collectionListContentSchema`, `collectionCardMappingSchema`, `entryPageConfigSchema`

  ### New: Dark mode toggle
  - `colorModeToggle` field added to `appBarContentSchema` and `appBarConfigSchema`
  - `TopAppBar` renders Sun/Moon toggle when enabled
  - Removed type intersection hack — both schemas now agree

  ### Prebuild pipeline changes
  - Collections now process **before** pages (so `collection_list` entries can be injected)
  - `injectCollectionEntries()` walks page JSON and embeds `_entries` from collection indexes
  - `collection_list` added to `KNOWN_CONTENT_TYPE_KEYS` for typo detection

  ### Icon additions
  - Added 20+ Lucide icons to the preset (BookOpen, Calendar, Tag, Bot, Paintbrush, etc.)

  ### Example app overhaul
  - Complete rewrite of home, about, getting-started, and showcase pages
  - Dark amber/charcoal theme with `colorModeToggle: true`
  - Blog index page using `collection_list` content type (pure YAML)
  - Blog entry pages with `[slug].tsx` dynamic routing
  - Removed broken `blog/index.tsx` (had two default exports, phantom imports)
  - Removed `FileCollectionProvider` from `_app.tsx` to prevent `fs` in client bundle

### Patch Changes

- a5c1ff4: Update all AGENTS.md files to reflect current architecture. Replace stale MUI/Emotion references with actual stack (Lucide, Radix, Tailwind via ui-shadcn, Zod). Document dark mode, cookie persistence, ColorModeScript, StackwrightDocument, and responsive design patterns. Add missing AGENTS.md for build-scripts, collections, ui-shadcn, mcp, and e2e packages.
