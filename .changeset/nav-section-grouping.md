---
"@stackwright/types": minor
"@stackwright/core": minor
---

feat: Add section grouping support to navigation schema

Navigation arrays now accept `{ section, items }` entries alongside the existing
`{ label, href }` link entries. This enables the Pro Otter Raft to generate
grouped navigation in stackwright.yml.

**Schema changes:**
- New `navigationLinkSchema` (renamed from `navigationItemSchema`)
- New `navigationSectionSchema` with `section` (string) and `items` (NavigationLink[])
- `navigationItemSchema` is now a union of both schemas
- New type guards: `isNavigationSection()`, `isNavigationLink()`
- Empty section `items` arrays are rejected (min: 1)

**Component updates:**
- TopAppBar: Sections render as hover dropdowns (desktop) or grouped headers (mobile)
- NavSidebar: Sections render as uppercase group headers with items beneath
- BottomAppBar: Sections render as column headers or are flattened inline
- Single-item sections are automatically flattened to plain links everywhere

Backward compatible — existing `{ label, href }` navigation arrays parse unchanged.
