---
'@stackwright/types': minor
'@stackwright/core': minor
'@stackwright/cli': patch
---

feat(types,core): layout grid content type for composable multi-column layouts (#125)

- Add `grid` content type with `GridColumn` and `GridContent` Zod schemas
- Columns contain recursive `content_items` arrays (same structure as pages)
- Column widths expressed as relative `fr` units (default: equal width)
- `LayoutGrid` React component renders CSS Grid with responsive stacking
- SSR-safe `matchMedia` hook for mobile breakpoint detection (`stackBelow` prop, default 768px)
- Nested grids filtered at render time with `console.warn` to prevent infinite recursion
- Registered in `componentRegistry` as `'grid'`
- `GridColumn` added to AGENTS.md sub-type reference table via `generate-agent-docs`
- JSON schemas regenerated with grid type (circular `z.lazy()` refs handled cleanly)
- 12 new unit tests + 1 content renderer integration test
- Two grid demos added to showcase page (2-column and 3-column layouts)

Also includes: refactor(core) — cleaned up verbose debug logging in `contentRenderer.tsx` and `componentRegistry.ts` (~112 lines of redundant try/catch-rethrow wrappers removed, zero behavioral changes)
