# @stackwright/ui-shadcn — Agent Guide

shadcn/ui-inspired component library for Stackwright. Provides Tailwind-styled UI primitives backed by Radix UI headless components. **This is the only package in the monorepo that uses Tailwind CSS.**

---

## Components

| Component | File | Radix Primitive | Used By |
|-----------|------|-----------------|---------|
| `Button` | `components/Button.tsx` | `@radix-ui/react-slot` | `ThemedButton` in core |
| `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent` | `components/Tabs.tsx` | `@radix-ui/react-tabs` | `TabbedContentGrid` in core |
| `Accordion` / `AccordionItem` / `AccordionTrigger` / `AccordionContent` | `components/Accordion.tsx` | `@radix-ui/react-accordion` | `FAQ` in core |
| `Badge` | `components/Badge.tsx` | — | Various |
| `Separator` | `components/Separator.tsx` | — | `TextGrid` in core |

## Theming

All components consume Stackwright theme colors via CSS custom properties (`--sw-color-*`, `--sw-font-*`) injected by `ThemeStyleInjector` from `@stackwright/themes`. No hardcoded colors.

## Registration

```typescript
import { registerShadcnComponents } from '@stackwright/ui-shadcn';
import '@stackwright/ui-shadcn/styles.css';

registerShadcnComponents();  // Currently a no-op — reserved for future component registry integration
```

The CSS import is required — it contains the compiled Tailwind styles.

## Utility

`cn()` (in `src/cn.ts`) combines `clsx` + `tailwind-merge` for conditional class composition without conflicts.

---

## Package Structure

```
src/
  components/       — UI components
  cn.ts             — clsx + tailwind-merge utility
  register.ts       — registerShadcnComponents()
  styles.css        — Tailwind CSS source (compiled at build time)
  index.ts          — Public exports
```

## Dependencies

- **@radix-ui/react-tabs**, **@radix-ui/react-accordion**, **@radix-ui/react-slot** — Headless primitives
- **clsx** + **tailwind-merge** — Class composition
- **lucide-react** — Icons (for accordion chevron, etc.)
- **@tailwindcss/cli** (dev) — CSS compilation

## Important

- **Do not add Tailwind classes to `@stackwright/core`.** Core uses inline styles exclusively. Only this package uses Tailwind.
- The compiled CSS is output to `dist/styles.css` and imported by consumer apps.
