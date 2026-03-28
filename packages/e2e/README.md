# @stackwright/e2e

End-to-end and visual regression tests for Stackwright using Playwright.

## Overview

This package contains:
- **Visual regression tests**: Screenshot-based tests to catch unintended UI changes
- **Smoke tests**: Basic functionality and rendering tests
- **Render tools tests**: Tests for MCP rendering tools
- **Performance benchmarks**: Build time, bundle size, and runtime Web Vitals monitoring

## Running Tests

### Locally

```bash
# Run all tests
pnpm test:e2e

# Run tests in headed mode (see the browser)
pnpm --filter @stackwright/e2e exec playwright test --headed

# Run specific test file
pnpm --filter @stackwright/e2e exec playwright test visual.spec.ts

# Open Playwright UI for debugging
pnpm --filter @stackwright/e2e exec playwright test --ui
```

### Updating Visual Baselines

When you intentionally change the UI, you need to update the baseline screenshots:

```bash
# Update all snapshots
pnpm test:e2e --update-snapshots

# Update specific test snapshots
pnpm --filter @stackwright/e2e exec playwright test visual.spec.ts --update-snapshots

# Review and commit
git add packages/e2e/tests/__screenshots__
git commit -m "Update visual regression baselines"
```

## Visual Regression Tests

Visual tests compare rendered screenshots against committed baseline images in `tests/__screenshots__/`.

### How it works:

1. **Baseline images** are committed to git
2. Tests render the same pages and compare against baselines
3. **Threshold**: 1% pixel difference allowed (configurable in `playwright.config.ts`)
4. **On failure**: Diff images show what changed

### Test structure:

- **Desktop tests** (1280x720): Full desktop layout testing
- **Mobile tests** (375x667): Responsive mobile layout testing
- **Content types tested**: All 13+ Stackwright content types on `/showcase`

### CI Behavior:

- ✅ **Pass**: Screenshots match baselines within threshold
- ❌ **Fail**: Visual differences detected → uploads diff artifacts
- Artifacts include:
  - `*-actual.png`: What the test rendered
  - `*-diff.png`: Visual diff highlighting changes
  - `*-expected.png`: The baseline image

## Performance Benchmarks

Stackwright includes comprehensive performance monitoring to prevent regressions:

### Test Suites:

1. **Build Time** (`build-time.bench.ts`)
   - Measures `stackwright-prebuild` execution time
   - Measures `next build` compilation time
   - Budgets: prebuild <10s, next build <60s

2. **Bundle Size** (`bundle-size.bench.ts`)
   - Tracks first-load JS bundle size
   - Monitors total JS across all pages
   - Budgets: first-load <300KB, total <850KB

3. **Runtime Web Vitals** (`runtime-vitals.bench.ts`)
   - **Core Web Vitals**:
     - First Contentful Paint (FCP) <1.5s
     - Largest Contentful Paint (LCP) <2.5s
     - Time to Interactive (TTI) <3s
     - Cumulative Layout Shift (CLS) <0.1
   - **Custom Metrics**:
     - React hydration time <500ms
     - Theme switch latency <100ms
   - **Mobile performance** with 3G simulation

### Running Performance Tests:

```bash
# Run all performance benchmarks
pnpm test:performance

# Or use the alias
pnpm test:bench

# Run specific benchmark
pnpm test tests/performance/runtime-vitals.bench.ts
pnpm test tests/performance/bundle-size.bench.ts
pnpm test tests/performance/build-time.bench.ts
```

### Performance Budgets:

All budgets are defined in `tests/performance/performance-budgets.json`:

```json
{
  "build": { "prebuild": { "max": 10000, "warn": 8000 }, ... },
  "bundle": { "firstLoadJS": { "max": 300000, "warn": 250000 }, ... },
  "runtime": { 
    "fcp": { "max": 1500, "warn": 1200 },
    "lcp": { "max": 2500, "warn": 2000 },
    ...
  }
}
```

- **max**: Hard limit - test fails if exceeded
- **warn**: Soft limit - test passes but logs warning

### Lighthouse Integration:

Runtime tests use [Lighthouse](https://github.com/GoogleChrome/lighthouse) for accurate Core Web Vitals measurement:

- Runs in real Chromium browser
- Desktop (1280x720) and mobile (375x667) viewports
- Simulates real-world network conditions
- Generates performance scores (0-100)

### CI Integration:

Performance tests run on every PR:
- ✅ Catches performance regressions early
- 📊 Logs metrics for tracking over time
- ⚠️ Warns when approaching budget limits
- ❌ Fails if budgets exceeded

## Configuration

See `playwright.config.ts` for:
- Screenshot threshold (`maxDiffPixelRatio`)
- Viewport sizes
- Test timeouts
- Web server setup

## CI Integration

Visual regression tests run on every PR via `.github/workflows/visual-regression.yml`:

1. **Checkout** code with baseline screenshots
2. **Build** Stackwright packages
3. **Start** example app
4. **Run** visual tests
5. **Upload** diff artifacts on failure
6. **Comment** PR with results

### Reviewing failures in CI:

1. Check the PR comment for failure details
2. Download the `visual-regression-diffs` artifact
3. Review the diff images
4. If intentional:
   - Update snapshots locally
   - Commit and push updated baselines
5. If unintentional:
   - Fix the bug causing the visual change
   - Re-run tests

## Best Practices

### ✅ DO:
- Commit baseline screenshots to git
- Review diffs carefully before updating baselines
- Use data-label attributes for reliable selectors
- Test both desktop and mobile viewports

### ❌ DON'T:
- Ignore visual test failures without investigation
- Update baselines without reviewing what changed
- Test time-dependent or randomized content
- Use brittle selectors (prefer data attributes)

## Troubleshooting

### "Screenshots don't match" locally but pass in CI

- Font rendering differences between OS
- Run tests in the same environment (Docker or CI)
- Use `--update-snapshots` to regenerate for your environment

### Tests timing out

- Increase timeout in `playwright.config.ts`
- Check if webServer is starting properly
- Look for console errors in the app

### "Cannot find page" errors

- Ensure example app has all required pages
- Check routes in `examples/hellostackwrightnext/`
- Verify prebuild ran successfully

## Scripts Reference

| Script | Description |
|--------|-------------|
| `test` | Run all Playwright tests |
| `test:ci` | Run tests with CI-specific reporters |
| `test:update-snapshots` | Update all baseline screenshots |
| `test:performance` | Run all performance benchmarks |
| `test:bench` | Alias for `test:performance` |
| `sync-screenshots` | Helper script for screenshot management |

## Links

- [Playwright Docs](https://playwright.dev/)
- [Visual Testing Guide](https://playwright.dev/docs/test-snapshots)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Stackwright Testing Philosophy](../../CONTRIBUTING.md#testing)
