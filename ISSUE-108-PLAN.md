# Issue #108 Plan: Dark Mode Support

**Branch**: `feat/issue-108-dark-mode`
**Status**: Planning

---

## Architecture Analysis

### Current state
- `themeConfigSchema` has a single `colors` block (7 fields: primary, secondary, accent, background, surface, text, textSecondary)
- `ThemeProvider` provides `{ theme, setTheme }` via React context
- `themeToCSSVars()` converts `theme.colors.*` → `--sw-color-*` CSS custom properties
- `ThemeStyleInjector` receives `theme` **as a prop** and injects CSS vars as inline styles
- **19 core components** consume colors via `useSafeTheme()` → `theme.colors.*` directly
- **ui-shadcn components** consume colors via CSS vars `var(--sw-color-*)`
- Two built-in themes: `corporate` and `soft` (embedded in `themeLoader.ts`)
- JSON schemas are auto-generated from Zod via `generate-schemas.ts`

### Key design decision: transparent color resolution

Components shouldn't know about dark mode. If we make `ThemeProvider` resolve the effective colors based on the current mode, `theme.colors` always returns the "right" colors. **Zero changes to the 19 existing component consumers.**

This also works for CSS vars automatically — `themeToCSSVars` reads from `theme.colors`, which is already resolved.

### Latent bug fix (bonus)

`ThemeStyleInjector` currently takes `theme` as a prop from `DynamicPage`. This means if someone calls `setTheme()` via context, the CSS vars on the wrapper div **don't update** because `ThemeStyleInjector` got its theme via prop, not from context. Dark mode gives us a clean reason to fix this: make `ThemeStyleInjector` consume from context by default, with an optional prop override for backwards compatibility.

---

## Phase 1: Schema — `darkColors` field

**File:** `packages/themes/src/types.ts`

Add an optional `darkColors` field to `themeConfigSchema` with the same shape as `colors`:

```typescript
const colorsSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  accent: z.string(),
  background: z.string(),
  surface: z.string(),
  text: z.string(),
  textSecondary: z.string(),
});

// Then in themeConfigSchema:
colors: colorsSchema,
darkColors: colorsSchema.optional(),
```

Extract `colorsSchema` as a named constant (DRY — it's used twice now). Export it.

**Why not a separate `darkTheme` object?** YAGNI. Colors are the only thing that differs between light/dark. Typography, spacing, components — all stay the same. If someone wants a completely different theme for dark mode, they can use `setTheme()`.

---

## Phase 2: ThemeProvider — color mode management

**File:** `packages/themes/src/ThemeProvider.tsx`

### New types
```typescript
type ColorMode = 'light' | 'dark' | 'system';
```

### Context changes
Extend `ThemeContextType`:
```typescript
interface ThemeContextType {
  theme: Theme;                          // ← now the RESOLVED theme (effective colors)
  rawTheme: Theme;                       // ← original theme with both colors and darkColors
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;                  // ← current mode setting
  setColorMode: (mode: ColorMode) => void;
  resolvedColorMode: 'light' | 'dark';   // ← what's actually active
}
```

### Logic
1. Add `colorMode` state (default: `'system'`)
2. Add `useEffect` with `window.matchMedia('(prefers-color-scheme: dark)')` listener for system preference changes
3. Compute `resolvedColorMode`: if `colorMode === 'system'`, use media query result; otherwise use `colorMode`
4. Compute `effectiveTheme`: clone the raw theme, replacing `colors` with `darkColors` when resolved mode is dark **and** `darkColors` is defined. Fall back to `colors` if no dark palette exists — no surprise breakage.
5. Provide `effectiveTheme` as `theme` in context

### ThemeStyleInjector update
Make `theme` prop optional. If omitted, consume from context via `useTheme()`:
```typescript
function ThemeStyleInjector({ theme: themeProp, children, className }) {
  const contextTheme = useThemeOptional();  // doesn't throw if no provider
  const theme = themeProp ?? contextTheme;
  // ... rest unchanged
}
```

This fixes the existing reactivity bug AND enables dark mode CSS var switching.

### New exports
```typescript
export type { ColorMode };
export { useTheme };  // already exported, now includes colorMode/setColorMode
```

---

## Phase 3: useSafeTheme fallback update

**File:** `packages/core/src/hooks/useSafeTheme.ts`

Minimal change — the `defaultTheme` fallback object needs the new optional fields in its type. Since `darkColors` is optional, the existing default object works as-is. Just ensure the types align after the schema change.

**Zero changes to the 19 component consumers.** They call `useSafeTheme()`, get `theme.colors.*`, and those colors are already resolved for the current mode.

---

## Phase 4: Theme definitions — dark palettes

### Embedded themes
**File:** `packages/themes/src/themeLoader.ts`

Add `darkColors` to both embedded theme YAML strings:

**Corporate dark:**
```yaml
darkColors:
  primary: "#fbbf24"       # amber-400 (brighter for dark bg)
  secondary: "#94a3b8"     # slate-400
  accent: "#f59e0b"        # amber-500
  background: "#0f172a"    # slate-900
  surface: "#1e293b"       # slate-800
  text: "#f1f5f9"          # slate-100
  textSecondary: "#94a3b8" # slate-400
```

**Soft dark:**
```yaml
darkColors:
  primary: "#f472b6"       # pink-400 (brighter for dark bg)
  secondary: "#9ca3af"     # gray-400
  accent: "#ec4899"        # pink-500
  background: "#111827"    # gray-900
  surface: "#1f2937"       # gray-800
  text: "#f9fafb"          # gray-50
  textSecondary: "#9ca3af" # gray-400
```

### YAML theme files (non-embedded)
**Files:** `packages/themes/src/themes/corporate.yaml`, `packages/themes/src/themes/soft.yaml`

Add corresponding `darkColors` blocks. (Note: these YAML files use a different schema structure with nested color scales — they are not consumed by `themeLoader.ts` currently. Add dark variants that match the YAML structure used there.)

---

## Phase 5: DynamicPage wiring

**File:** `packages/core/src/components/DynamicPage.tsx`

1. Remove explicit `theme` prop from `<ThemeStyleInjector>` — it will now consume from the `<ThemeProvider>` context above it in the tree.
2. Optionally accept `initialColorMode` from site config (future — can defer to follow-up).

Before:
```tsx
<ThemeProvider theme={theme}>
  <ThemeStyleInjector theme={theme}>
    ...
  </ThemeStyleInjector>
</ThemeProvider>
```

After:
```tsx
<ThemeProvider theme={theme}>
  <ThemeStyleInjector>
    ...
  </ThemeStyleInjector>
</ThemeProvider>
```

---

## Phase 6: JSON schema regeneration

```bash
pnpm --filter @stackwright/types generate-schemas
```

Verify `schemas/theme-schema.json` and `schemas/site-config-schema.json` include the new `darkColors` field.

Run CI check: `pnpm run check-schemas` (if available) to confirm committed schemas match generated output.

---

## Phase 7: Tests

**File:** `packages/themes/test/themeProvider.test.tsx`

New test cases:
1. **`colorMode` defaults to `'system'`**
2. **`setColorMode('dark')` switches to dark colors** — verify `theme.colors` returns `darkColors` values
3. **`setColorMode('light')` switches back to light colors** — verify original `colors` returned
4. **Falls back to light colors when `darkColors` is undefined** — no crash, no surprise
5. **`resolvedColorMode` reflects system preference** — mock `matchMedia`
6. **`ThemeStyleInjector` updates CSS vars on mode change** — verify `--sw-color-bg` changes
7. **`ThemeStyleInjector` works without explicit theme prop** (context-driven)
8. **`themeToCSSVars` produces correct output for dark palette**

**File:** `packages/themes/test/themeLoader.test.ts`

New test cases:
1. **Embedded corporate theme has `darkColors`**
2. **Embedded soft theme has `darkColors`**
3. **`darkColors` fields are valid hex strings**

---

## Phase 8: Documentation & cleanup

1. **`ROADMAP.md`** — Mark dark mode as done
2. **`AGENTS.md`** — No changes needed (auto-generated table doesn't cover themes)

---

## File change summary

| File | Change type | Size |
|------|-------------|------|
| `packages/themes/src/types.ts` | Modify | Small — extract colorsSchema, add darkColors |
| `packages/themes/src/ThemeProvider.tsx` | Modify | Medium — color mode state, media query, context expansion, ThemeStyleInjector update |
| `packages/themes/src/themeLoader.ts` | Modify | Small — add darkColors to embedded YAML |
| `packages/themes/src/themes/corporate.yaml` | Modify | Small — add dark palette |
| `packages/themes/src/themes/soft.yaml` | Modify | Small — add dark palette |
| `packages/core/src/hooks/useSafeTheme.ts` | Modify | Trivial — type alignment only |
| `packages/core/src/components/DynamicPage.tsx` | Modify | Trivial — remove theme prop from ThemeStyleInjector |
| `packages/themes/test/themeProvider.test.tsx` | Modify | Medium — 8 new test cases |
| `packages/themes/test/themeLoader.test.ts` | Modify | Small — 3 new test cases |
| `packages/types/schemas/*.json` | Regenerated | Auto |
| `ROADMAP.md` | Modify | Trivial |

**Total files modified:** 11
**New files:** 0
**Breaking changes:** 0 — `darkColors` is optional, `theme` prop on `ThemeStyleInjector` becomes optional (not removed)
**Component changes required:** 0 — colors resolve transparently

---

## Commit strategy

1. `feat(themes): add darkColors to theme schema` (Phase 1)
2. `feat(themes): add color mode management to ThemeProvider` (Phase 2)
3. `feat(themes): add dark palettes to built-in themes` (Phase 3 + 4)
4. `refactor(core): wire ThemeStyleInjector to context` (Phase 5)
5. `chore(types): regenerate JSON schemas` (Phase 6)
6. `test(themes): add dark mode test coverage` (Phase 7)
7. `docs: mark dark mode complete in ROADMAP` (Phase 8)

---

## Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| `matchMedia` not available in SSR/test env | Guard with `typeof window !== 'undefined'` check; mock in tests |
| ThemeStyleInjector API change breaks consumers | Keep `theme` prop as optional (backwards compatible), don't remove it |
| Dark palettes look bad | Use well-established dark color guidelines (lighter primaries, dark surfaces). Adjustable via `darkColors` in user themes. |
| `useTheme` context shape change | Additive only — `colorMode`, `setColorMode`, `resolvedColorMode` are new fields. Existing destructuring `{ theme, setTheme }` still works. |
