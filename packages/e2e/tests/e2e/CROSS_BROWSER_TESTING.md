# Cross-Browser Testing Guide 🌐

## Overview

Our E2E test suite runs on **5 different browser configurations** to ensure Stackwright works everywhere!

## Browser Matrix

| Browser | Type | Viewport | Tests Run |
|---------|------|----------|-----------|
| **Chromium** | Desktop | Default | ✅ All tests (functional + visual + benchmarks) |
| **Firefox** | Desktop | Default | ✅ Functional tests only |
| **WebKit** | Desktop | Default | ✅ Functional tests only (Safari engine) |
| **Mobile Chrome** | Mobile | 375×667 | ✅ Functional tests only |
| **Mobile Safari** | Mobile | 375×812 | ✅ Functional tests only (iPhone X) |

## Test Types

### 🧪 Functional Tests (`*.spec.ts`)
- Run on **ALL browsers** (desktop + mobile)
- Test core functionality, user interactions, a11y
- Examples: `smoke.spec.ts`, `theme-switching.spec.ts`, `user-journeys.spec.ts`

### 📸 Visual Regression (`*.visual.spec.ts`)
- Run **ONLY on Chromium** desktop
- Avoid pixel diff issues across rendering engines
- Example: `visual.spec.ts`

### ⚡ Benchmarks (`*.bench.ts`)
- Run **ONLY on Chromium** desktop
- Establish consistent performance baselines
- Examples: `build-time.bench.ts`, `runtime-vitals.bench.ts`

## Running Tests

### Run all tests on all browsers
```bash
pnpm --filter @stackwright/e2e test
```

### Run tests on a specific browser
```bash
# Desktop browsers
pnpm --filter @stackwright/e2e test --project=chromium
pnpm --filter @stackwright/e2e test --project=firefox
pnpm --filter @stackwright/e2e test --project=webkit

# Mobile browsers
pnpm --filter @stackwright/e2e test --project=mobile-chrome
pnpm --filter @stackwright/e2e test --project=mobile-safari
```

### Run specific test types
```bash
# Only functional tests (all browsers)
pnpm --filter @stackwright/e2e test --grep-invert "visual|bench"

# Only visual tests (Chromium only)
pnpm --filter @stackwright/e2e test visual.spec.ts

# Only benchmarks (Chromium only)
pnpm --filter @stackwright/e2e test --grep "bench"
```

### Debug mode
```bash
# Open Playwright UI for interactive debugging
pnpm --filter @stackwright/e2e test --ui

# Run with headed browser
pnpm --filter @stackwright/e2e test --headed --project=firefox
```

## CI/CD Integration

In CI, all browsers run in parallel. Example GitHub Actions matrix:

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit, mobile-chrome, mobile-safari]
steps:
  - run: pnpm --filter @stackwright/e2e test --project=${{ matrix.browser }}
```

## Adding New Tests

### Functional Test (runs everywhere)
```typescript
// tests/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('my feature works', async ({ page }) => {
  // This runs on all 5 browser configs!
});
```

### Visual Regression Test (Chromium only)
```typescript
// tests/my-component.visual.spec.ts
import { test, expect } from '@playwright/test';

test('my component looks correct', async ({ page }) => {
  // This only runs on Chromium desktop
  await expect(page).toHaveScreenshot('my-component.png');
});
```

### Benchmark Test (Chromium only)
```typescript
// tests/performance/my-benchmark.bench.ts
import { test } from '@playwright/test';

test('my performance test', async ({ page }) => {
  // This only runs on Chromium desktop
  const startTime = Date.now();
  // ... benchmark code
});
```

## Mobile Testing Tips

Mobile viewports automatically set:
- `isMobile: true` - enables mobile-specific features
- `hasTouch: true` - simulates touch events
- Appropriate user agents - ensures correct server responses
- Device scale factors - tests high-DPI rendering

## Troubleshooting

### Visual tests failing on wrong browser
✅ **Expected!** Visual tests should only run on Chromium. Other browsers skip them automatically.

### Mobile viewport not working
Check that `isMobile` and `hasTouch` are set in the project config.

### Slow test runs
Run specific browsers instead of all 5:
```bash
pnpm test --project=chromium,firefox  # Only 2 browsers
```

## Best Practices

1. **Write functional tests first** - they run everywhere and catch most bugs
2. **Add visual tests for UI components** - but only when needed (they're slow)
3. **Add mobile tests for responsive features** - test mobile-specific interactions
4. **Keep benchmarks stable** - run only on Chromium for consistent results

---

**Note**: Visual regression and benchmark tests intentionally skip non-Chromium browsers to avoid flaky results. This is by design! 🎯
