---
"@stackwright/otters": minor
---

feat(otters): add Collection Otter for scaffolding blog, docs, and portfolio collections

Adds `stackwright-collection-otter` — Phase 4 of the otter raft pipeline. The Collection Otter:
- Asks what type of collection (blog, docs, portfolio, case studies, team, products)
- Creates the collection directory with `_collection.yaml` via `stackwright_create_collection`
- Writes 3–5 sample entries in brand voice (reads BRAND_BRIEF.md if available)
- Creates the listing page with `collection_list` content type wired to the collection
- Optionally enables per-entry pages via `entryPage` config
- Validates and renders the listing page
- Always reminds users about the prebuild requirement

Foreman Otter updated to detect and invoke Collection Otter as an optional Phase 4 step after pages are built.
