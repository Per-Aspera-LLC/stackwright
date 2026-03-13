# @stackwright/e2e — Agent Guide

Playwright end-to-end tests that verify the full Stackwright pipeline: YAML → prebuild → Next.js build → browser rendering.

---

## What's Tested

Tests run against the `examples/hellostackwrightnext/` application:

| Test file | Purpose |
|-----------|---------|
| `tests/smoke.spec.ts` | Every page renders content, no error boundaries, no critical console errors, all nav links resolve |
| `tests/visual.spec.ts` | Visual regression — screenshot comparison against baseline images in `tests/__screenshots__/` |

---

## Running

```bash
# From monorepo root (requires chromium system deps)
pnpm test:e2e
```

The example app must be built first (`pnpm build:all`).

---

## When to Update

- **New content types**: Add example usage in `examples/hellostackwrightnext/` so smoke tests cover them
- **Visual changes**: Update baseline screenshots after intentional UI changes
- **New pages**: Smoke tests auto-discover pages — no manual test additions needed

---

## Package Structure

```
tests/
  smoke.spec.ts          — Functional smoke tests
  visual.spec.ts         — Visual regression tests
  __screenshots__/       — Baseline screenshot images
```
