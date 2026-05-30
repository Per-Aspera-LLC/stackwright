# Collection Otter — Phase 2 Design Spec 🦦📚

> **Status**: Design phase — not yet implemented.
> **Planned for**: Phase 2 of the otter raft pipeline.

---

## Purpose

The Collection Otter handles structured content collections (blog posts, docs pages, case studies, team members, portfolio items) by:
1. Scaffolding the `content/<name>/` directory structure
2. Creating collection entry YAML files
3. Ensuring the `stackwright-prebuild` pipeline processes them into `public/stackwright-content/collections/`
4. Wiring `collection_list` content types in pages to display the collection

---

## Position in Pipeline

```
Brand Otter → Theme Otter → Page Otter → Collection Otter (optional)
                                              │
                                              ▼
                                    content/<name>/*.yml
                                    pages/<slug>/content.yml
                                    (collection_list type)
```

---

## Trigger Conditions

The Foreman Otter invokes Collection Otter when:
- User asks for a blog, news section, documentation, portfolio, or case studies
- BRAND_BRIEF.md lists a page that requires dynamic listing (blog, docs, portfolio)
- User explicitly requests "add a collection"

---

## File Handoffs

| File | Created By | Read By |
|------|-----------|---------|
| `BRAND_BRIEF.md` | Brand Otter | Collection Otter (for content voice) |
| `stackwright.yml` | Theme Otter | Collection Otter (for theme colors) |
| `content/<name>/<slug>.yml` | Collection Otter | prebuild pipeline |
| `pages/<slug>/content.yml` | Collection Otter | Stackwright renderer |

---

## Collection Entry Schema

```yaml
# content/posts/my-first-post.yml
title: "Post Title"
date: "2025-01-15"
author: "Author Name"
tags: ["tag1", "tag2"]
excerpt: "Short preview text for listing views"
content:
  content_items:
    - type: text_block
      label: "post-body"
      textBlocks:
        - text: "Full post content here..."
          textSize: "body1"
```

---

## Page Integration

Collection Otter creates/updates the listing page to use `collection_list`:

```yaml
content:
  meta:
    title: "Blog | Site Name"
    description: "Latest articles and updates"
  content_items:
    - type: text_block
      label: "blog-heading"
      heading:
        text: "Blog"
        textSize: "h1"
    - type: collection_list
      label: "blog-posts"
      source: "posts"
      layout: default
      columns: 3
      limit: 9
      hrefPrefix: "/blog"
      card:
        title: "$.title"
        description: "$.excerpt"
        date: "$.date"
```

---

## Discovery Conversation

Collection Otter asks:
1. What kind of content? (blog, docs, case studies, team, portfolio)
2. How many initial entries to create? (suggest 3-5 for demo content)
3. What are the required fields for each entry?
4. What should the listing card show? (title, date, author, tags, excerpt)
5. Should entries be linked to individual detail pages?

---

## Workflow

1. Read BRAND_BRIEF.md and stackwright.yml
2. Ask which collection type to create
3. Create `content/<name>/` directory structure
4. Generate 3-5 sample entries in brand voice
5. Update or create the listing page with `collection_list` type
6. For each entry, optionally create `pages/<collection>/<slug>/content.yml` detail page
7. Validate all pages
8. Remind user to ensure `predev`/`prebuild` scripts exist in package.json

---

## Implementation Requirements

- [ ] Create `stackwright-collection-otter.json` agent config
- [ ] Integrate `CollectionProvider` interface from `@stackwright/collections` (beads: stackwright-bls)
- [ ] Test with a real blog collection in stackwright-tests
- [ ] Update Foreman Otter to detect collection needs and invoke Collection Otter
- [ ] Add Collection Otter to install-agents.js postinstall script

---

## Dependency

This otter depends on `stackwright-bls` (Collections system) being complete before it can be fully implemented. The `collection_list` content type renderer must be able to resolve `source: "posts"` at build time.
