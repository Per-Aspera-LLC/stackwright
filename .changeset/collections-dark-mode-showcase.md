---
"@stackwright/types": minor
"@stackwright/core": minor
"@stackwright/build-scripts": minor
"@stackwright/collections": minor
"@stackwright/icons": patch
---

## Collections system, `collection_list` content type, dark mode toggle, and example app overhaul

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
