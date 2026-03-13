# @stackwright/core — Agent Guide

The rendering engine of Stackwright. Transforms YAML content definitions into React component trees. **No MUI, no Emotion, no Tailwind** — core components use inline `style={{}}` props exclusively.

---

## Architecture

### Rendering Pipeline

YAML → `js-yaml` parse → Zod validation → `contentRenderer.tsx` → React component tree

The content renderer (`src/utils/contentRenderer.tsx`) iterates `content_items`, looks up each content type key in the component registry, and instantiates the matching React component with the parsed props.

### Component System

Three registries coexist:

| Registry | File | Purpose |
|----------|------|---------|
| **Component registry** | `src/utils/componentRegistry.ts` | Built-in UI components, keyed by lowercase-hyphenated name |
| **Stackwright registry** | `src/utils/stackwrightComponentRegistry.ts` | Framework components (Image, Link, Router, Route, Head) registered at runtime |
| **Content type registry** | `src/utils/contentTypeRegistry.ts` | Extensible content types via `registerContentType()` |

### Component Categories

```
src/components/
  DynamicPage.tsx              — Main page component, wires ThemeProvider + layout
  ContentItemErrorBoundary.tsx — Error boundary per content item
  base/                        — Content components (MainContentGrid, TabbedContentGrid, etc.)
  structural/                  — Layout (PageLayout, TopAppBar, BottomAppBar)
  narrative/                   — Storytelling (Carousel, Timeline)
  media/                       — Media rendering
  stackwright/                 — Default framework component implementations
```

### Hooks

| Hook | Purpose |
|------|---------|
| `useSafeTheme()` | Read the current resolved theme (colors already reflect dark/light mode) |
| `useBreakpoints()` | Responsive breakpoints via `window.matchMedia` — returns `{ isXs, isSm, isMdUp, ... }` |
| `useSiteConfig()` | Access the global site configuration context |
| `useDevContentReload()` | Hot-reload content during development via SSE |

### Utilities

| Utility | Purpose |
|---------|---------|
| `cookies.ts` | `getCookie`, `setCookie`, `removeCookie` — SSR-safe, zero dependencies |
| `consent.ts` | `getConsentState`, `setConsentState`, `hasConsent` — IAB TCF consent categories |
| `colorUtils.ts` | Color resolution (hex passthrough, theme palette lookup, fallback) |
| `collectionProviderRegistry.ts` | Singleton `registerCollectionProvider` / `getCollectionProvider` |
| `contentDebug.ts` | Debug logging gated by `STACKWRIGHT_DEBUG=true` |
| `prismHighlighter.ts` | Syntax highlighting for `code_block` content type |

---

## Dependencies

### Runtime
- **React / React-DOM** ^19 (peer)
- **@stackwright/types** — Zod schemas and TypeScript types
- **@stackwright/themes** — Theme provider, color mode, CSS variable injection
- **@stackwright/collections** — `CollectionProvider` interface
- **js-yaml** — YAML parsing
- **prismjs** — Syntax highlighting
- **zod** ^4 — Runtime validation

### No MUI, No Emotion, No Tailwind

Core was migrated from MUI to plain HTML + inline styles. This is architecturally deliberate:
- `@stackwright/core` has no CSS build pipeline (tsup compiles JS/TS only)
- Layout values are dynamic, driven by YAML theme config at runtime
- Only `@stackwright/ui-shadcn` uses Tailwind, pre-compiling its own CSS at build time

**Do not add CSS files, media query stylesheets, or Tailwind classes to this package.**

---

## Responsive Design Rules

Two patterns are used, and new/modified components must follow them:

1. **CSS-only (preferred):** `gridTemplateColumns: "repeat(auto-fill, minmax(Xpx, 1fr))"` — naturally responsive, no JS, no SSR hydration flash. Used by `IconGrid`, `FeatureList`, `TestimonialGrid`.

2. **JS hook (when CSS alone is insufficient):** `useBreakpoints()` — only use when CSS cannot express the logic (e.g., TopAppBar hamburger menu vs desktop nav). Has a one-frame SSR flash.

**Rules:**
- All grid/multi-column components must render correctly from **320px to 1440px**.
- Never hardcode `repeat(N, 1fr)`. Use `repeat(auto-fill, minmax(Xpx, 1fr))` instead.
- For flex layouts that must stack on mobile, use `flexWrap: 'wrap'` with `minWidth: 'min(Xpx, 100%)'`.
- For text that may overflow (emails, URLs), add `wordBreak: 'break-word'`.

---

## Registration Pattern

Components that depend on a specific framework (Next.js, etc.) must be registered at runtime — never via import side effects:

```typescript
// In _app.tsx or layout.tsx
import { registerNextJSComponents } from '@stackwright/nextjs';
import { registerDefaultIcons } from '@stackwright/icons';
import { registerShadcnComponents } from '@stackwright/ui-shadcn';

registerNextJSComponents();
registerDefaultIcons();
registerShadcnComponents();
```

---

## Testing

- **Vitest** with JSDOM environment
- Tests live in `packages/core/test/`
- React Testing Library for component tests
- Run: `pnpm test:core` from monorepo root
