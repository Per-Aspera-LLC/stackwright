# Issue #81 Migration Plan: MUI → shadcn/ui + Tailwind + Lucide

**Branch**: `feat/issue-81-shadcn-migration`
**Status**: In Progress

---

## Phase Overview

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Icons: Lucide migration | ✅ Done |
| 2 | ui-shadcn: New component package | ✅ Done |
| 3 | Themes: CSS custom properties | 🔶 Partial (infra done, integration needed) |
| 4 | Core: UI interface definition | ⬜ Not started |
| 5 | Core: Component rewrites (structural) | ⬜ Not started |
| 6 | Core: Component rewrites (base) | ⬜ Not started |
| 7 | Core: Component rewrites (narrative) | ⬜ Not started |
| 8 | Core: Hook/utility updates | ⬜ Not started |
| 9 | Core: Remove MUI from package.json | ⬜ Not started |
| 10 | Example app: Update hellostackwrightnext | ⬜ Not started |
| 11 | Cleanup & testing | ⬜ Not started |

---

## Phase 1: Icons — Lucide Migration ✅

**Files changed:**
- `packages/icons/package.json` — Removed `@mui/material`, `@mui/icons-material`; added `lucide-react`
- `packages/icons/src/registry/iconRegistry.ts` — Custom `IconProps` replaces `SvgIconProps`
- `packages/icons/src/components/StackwrightIcon.tsx` — Native SVG (no MUI SvgIcon)
- `packages/icons/src/icons/brand/StackwrightIcon.tsx` — Native SVG
- `packages/icons/src/icons/social/BlueSkyIcon.tsx` — Native SVG
- `packages/icons/src/presets/defaultIcons.ts` — Uses `lucideIconPreset`
- `packages/icons/src/presets/lucideIcons.ts` — **NEW** Maps legacy MUI icon names → Lucide equivalents
- `packages/icons/src/index.ts` — Exports `lucideIconPreset`

---

## Phase 2: ui-shadcn Package ✅

**New package:** `packages/ui-shadcn/`

Components implemented:
- `Button` (primary/secondary/outline/text variants, sizes, Radix Slot, href support)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (Radix)
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` (Radix)
- `Badge` (default/secondary/outline)
- `Separator` (horizontal/vertical)
- `cn()` utility (clsx + tailwind-merge)
- `registerShadcnComponents()` (no-op for forward compat)

All components theme via `--sw-color-*` and `--sw-font-*` CSS variables.

---

## Phase 3: Themes — CSS Custom Properties 🔶

**Done:**
- `packages/themes/src/ThemeProvider.tsx` — Added `themeToCSSVars()` and `ThemeStyleInjector`

**Remaining:**
- [ ] Wire `ThemeStyleInjector` into core's `DynamicPage` component so CSS vars are always injected
- [ ] Ensure `ThemesProvider` (multi-theme switcher) also injects CSS vars on theme change
- [ ] Remove any MUI `ThemeProvider`/`createTheme` usage from core

---

## Phase 4: Core — UI Interface Definition ⬜

Define a UI primitive interface in `packages/core/src/ui/` that any adapter (shadcn, future MUI community adapter) must implement.

- [ ] Create `packages/core/src/ui/types.ts` — interfaces for Button, Typography, Card, Grid, Container, Tabs, Accordion, Divider, Badge
- [ ] Create `packages/core/src/ui/registry.ts` — UI component registry (similar to existing component/stackwright registries)
- [ ] Export from `packages/core/src/index.ts`

---

## Phase 5: Core — Structural Component Rewrites ⬜

These are the page layout components. Replace MUI with Tailwind + CSS vars.

| File | MUI Imports | Notes |
|------|-------------|-------|
| `components/DynamicPage.tsx` | CssBaseline, Box, styled, ThemeProvider, createTheme | **Critical** — MUI theme creation lives here. Replace with ThemeStyleInjector + plain div |
| `components/structural/PageLayout.tsx` | Box | Simple wrapper → div with Tailwind |
| `components/structural/DefaultPageLayout.tsx` | Stack, Box | Deprecated wrapper → div/flex |
| `components/structural/TopAppBar.tsx` | AppBar, Toolbar, Typography, Box, imageListClasses | Navigation bar → semantic HTML + Tailwind |
| `components/structural/BottomAppBar.tsx` | Box, Typography, Link, Stack, Grid + 3 MUI icons | Footer → semantic HTML + Tailwind + Lucide |

---

## Phase 6: Core — Base Component Rewrites ⬜

| File | MUI Imports | Notes |
|------|-------------|-------|
| `components/base/MainContentGrid.tsx` | Box, Typography, Grid | Main content layout → Tailwind grid/flex |
| `components/base/TabbedContentGrid.tsx` | Box, Tabs, Tab, Typography, Grid | → Use ui-shadcn Tabs |
| `components/base/ThemedButton.tsx` | Button, Typography | → Use ui-shadcn Button |
| `components/base/TextGrid.tsx` | Box, Divider, Typography | → Tailwind + ui-shadcn Separator |
| `components/base/CodeBlock.tsx` | Box, Typography | → Tailwind |
| `components/base/IconGrid.tsx` | Box, Typography, Grid | → Tailwind grid |
| `components/base/Menu/MenuSection.tsx` | MenuItem, Typography | → semantic HTML + Tailwind |
| `components/base/Menu/CompressedMenu.tsx` | Box, IconButton, Menu + MenuIcon | → Tailwind + Lucide Menu icon |

---

## Phase 7: Core — Narrative Component Rewrites ⬜

| File | MUI Imports | Notes |
|------|-------------|-------|
| `components/narrative/Timeline.tsx` | Box, Typography | → Tailwind |
| `components/narrative/Carousel/Carousel.tsx` | IconButton, Stack, Paper, Typography, Box + ArrowBack/Forward icons | → Tailwind + Lucide ChevronLeft/Right |
| `components/narrative/Carousel/OverFlowImageCard.tsx` | Card, Stack, Box, Typography | → Tailwind card |
| `components/media/Media.tsx` | Typography | → Tailwind |
| `components/media/MediaContainer.tsx` | Grid | → Tailwind grid |

---

## Phase 8: Core — Hook/Utility Updates ⬜

| File | MUI Imports | Notes |
|------|-------------|-------|
| `hooks/useBreakpoints.ts` | useMediaQuery | → `window.matchMedia` directly (no MUI needed) |

---

## Phase 9: Core — Remove MUI from package.json ⬜

- [ ] Remove `@mui/material` from dependencies and peerDependencies
- [ ] Remove `@mui/icons-material` from dependencies
- [ ] Remove `@emotion/react`, `@emotion/styled` from peerDependencies
- [ ] Add `@stackwright/ui-shadcn` as dependency
- [ ] Run `pnpm install` to update lockfile

---

## Phase 10: Example App — Update hellostackwrightnext ⬜

- [ ] Add `@stackwright/ui-shadcn` to dependencies
- [ ] Add Tailwind CSS setup (postcss.config, tailwind.config, globals.css)
- [ ] Import `@stackwright/ui-shadcn/styles.css` in `_app.tsx`
- [ ] Call `registerShadcnComponents()` in `_app.tsx` (alongside `registerNextJSComponents()`)
- [ ] Remove `@mui/material`, `@mui/icons-material`, `@emotion/*` from dependencies
- [ ] Verify all pages render correctly
- [ ] Update `next.config.js` if needed (remove MUI transpile config)

---

## Phase 11: Cleanup & Testing ⬜

- [ ] Run `pnpm build` — all packages build clean
- [ ] Run `pnpm test` — all tests pass (update snapshots as needed)
- [ ] Grep for any remaining `@mui` imports across entire repo
- [ ] Verify zero MUI dependencies in any `packages/*/package.json`
- [ ] Run `pnpm dev:hellostackwright` — example app renders correctly
- [ ] Create changeset (`pnpm changeset`)
- [ ] Update memory file with lessons learned

---

## Component Mapping Reference

| MUI Component | Replacement |
|---------------|-------------|
| `Box` | `<div>` with Tailwind classes |
| `Stack` | `<div className="flex flex-col">` or `flex-row` |
| `Typography` | `<h1>`–`<h6>`, `<p>`, `<span>` with Tailwind typography |
| `Grid` | Tailwind `grid` or `flex` |
| `Button` | `@stackwright/ui-shadcn` `Button` |
| `IconButton` | `<button>` with Tailwind + icon child |
| `Card` / `Paper` | `<div>` with Tailwind shadow/border/rounded |
| `AppBar` / `Toolbar` | `<header>` / `<nav>` with Tailwind |
| `Tabs` / `Tab` | `@stackwright/ui-shadcn` `Tabs` |
| `Menu` / `MenuItem` | Native HTML + Tailwind (or Radix DropdownMenu later) |
| `Divider` | `@stackwright/ui-shadcn` `Separator` |
| `CssBaseline` | Tailwind preflight (included automatically) |
| `styled()` | Tailwind classes |
| `createTheme` / `ThemeProvider` | `ThemeStyleInjector` from `@stackwright/themes` |
| `useMediaQuery` | `window.matchMedia` wrapper |
| MUI Icons (ArrowBack, etc.) | Lucide equivalents (ChevronLeft, etc.) |

---

## Commit Strategy

One commit per phase (or logical sub-unit within a phase). This allows easy bisection if something breaks and clean PR review.
