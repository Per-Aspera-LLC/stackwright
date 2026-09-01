---
'@stackwright/nextjs': minor
---

Dynamic-segment content resolution in `getStackwrightPageData` (qa-006 class).

Previously the resolver only did exact path joins, so a dynamic content dir
like `contacts/[id]/` was unreachable at runtime: `/contacts/11` returned
null (→ 404) while `generateStackwrightStaticParams()` emitted the junk
literal slug `['contacts', '[id]']`.

- `getStackwrightPageData(['contacts','11'])` now falls back to
  dynamic-segment resolution (`contacts/[id].json`), with literal matches
  always winning and ambiguous layouts (two dynamic siblings) refusing to
  resolve.
- Resolved params are injected as `_routeParams` on the page data AND every
  content item, so param-consuming components receive the row identity as a
  prop.
- `generateStackwrightStaticParams()` no longer emits `[param]` slugs —
  dynamic routes render on demand (`dynamicParams` must not be `false` in
  the catch-all when dynamic content dirs exist).
- New exports: `resolveDynamicContentPath`, `dynamicParamName`,
  `injectRouteParams`.
