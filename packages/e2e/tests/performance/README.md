# Performance & Stress Tests ⚡

**Phase 3 & Phase 4** of the Stackwright E2E testing strategy.

## Overview

These tests measure performance metrics and stress-test the framework under extreme conditions.

## Test Files

### Core Performance Benchmarks (Phase 3)

#### `runtime-vitals.bench.ts`
- Core Web Vitals (FCP, LCP, TTI, CLS, TBT)
- React hydration performance
- Theme switch performance
- Mobile performance

#### `build-time.bench.ts`
- Build duration
- Incremental build performance
- Cold vs warm builds

#### `bundle-size.bench.ts`
- JavaScript bundle sizes
- CSS bundle sizes
- Image optimization
- Code splitting effectiveness

### Stress Tests (Phase 4)

#### `stress-tests.bench.ts`
- **Heavy Content Load**: Pages with many content items
- **Theme Switching**: 50 rapid theme switches (memory leak detection)
- **Rapid Navigation**: 10 pages navigated rapidly
- **Concurrent Interactions**: Multiple elements clicked simultaneously
- **Resource Loading**: Large image loading
- **Long-Running Session**: 30 seconds of continuous interaction

## Running the Tests

```bash
# Run all performance tests
pnpm test:e2e --grep "Performance|Stress"

# Run specific test file
pnpm test:e2e tests/performance/stress-tests.bench.ts

# Run with trace for debugging
pnpm test:e2e tests/performance/stress-tests.bench.ts --trace on
```

## Performance Budgets

Performance budgets are defined in `performance-budgets.json`:

```json
{
  "runtime": {
    "fcp": { "max": 1500, "warn": 1200 },
    "lcp": { "max": 2500, "warn": 2000 },
    "tti": { "max": 3000, "warn": 2500 },
    "hydration": { "max": 500, "warn": 300 },
    "themeSwitch": { "max": 100, "warn": 50 }
  },
  "build": {
    "duration": { "max": 60000, "warn": 45000 }
  }
}
```

### Interpreting Results

- ✅ **Under "warn"**: Excellent performance
- ⚠️ **Between warn and max**: Acceptable but could be improved
- ❌ **Over "max"**: Fails budget, needs optimization

## Stress Test Scenarios

### 1. Heavy Content Load
Tests pages with all content types:
- Carousel, Main, TabbedContent, Timeline, etc.
- Should load within 5 seconds
- No performance degradation on scroll

### 2. Theme Switching
50 rapid theme switches:
- Detects memory leaks
- Measures average switch time
- Verifies no performance degradation
- **Expected**: <50% memory increase, <100ms per switch

### 3. Rapid Navigation
Navigate through 10 pages quickly:
- Tests route transition performance
- Verifies no memory leaks
- Checks for console errors
- **Expected**: <2000ms average navigation

### 4. Concurrent Interactions
Multiple buttons/links clicked simultaneously:
- Tests event handler performance
- Verifies no race conditions
- **Expected**: Page remains responsive

### 5. Resource Loading
Load many images simultaneously:
- Tests lazy loading
- Verifies progressive loading
- **Expected**: <200 total resources

### 6. Long-Running Session
30 seconds of random user interactions:
- Detects memory leaks over time
- Verifies stability
- **Expected**: <100% memory growth

## Memory Leak Detection

Tests use Chrome's `performance.memory` API to detect leaks:

```typescript
const initialMemory = await page.evaluate(() => 
  (performance as any).memory.usedJSHeapSize
);

// ... perform actions ...

const finalMemory = await page.evaluate(() =>
  (performance as any).memory.usedJSHeapSize  
);

const increase = ((finalMemory - initialMemory) / initialMemory) * 100;
```

### Warning Signs
- 🚨 >50% memory increase from theme switching
- 🚨 >100% memory increase in 30s session
- 🚨 Performance degradation over time
- 🚨 Switch times increasing with each iteration

## Debugging Performance Issues

### Slow Page Loads?

1. Check bundle sizes: `pnpm test:e2e tests/performance/bundle-size.bench.ts`
2. Profile with Chrome DevTools
3. Check image optimization
4. Verify lazy loading is working

### Memory Leaks?

1. Run with `--trace on` to see what's happening
2. Check for event listeners not being cleaned up
3. Look for circular references
4. Verify React components unmount properly

### Theme Switching Slow?

1. Check if theme CSS is being regenerated
2. Verify no unnecessary re-renders
3. Profile with React DevTools
4. Check for expensive computed styles

## Best Practices

### ✅ Do's
- Test with realistic content loads
- Monitor memory usage over time
- Set realistic performance budgets
- Test on multiple viewport sizes
- Measure both cold and warm performance

### ❌ Don'ts
- Don't set budgets too strict (unrealistic)
- Don't ignore memory leak warnings
- Don't skip mobile performance testing
- Don't test only ideal conditions

## CI/CD Integration

These tests run in CI on every PR:

```yaml
# .github/workflows/e2e.yml
- name: Run Performance Tests
  run: pnpm test:e2e --grep "Performance|Stress"
```

Budgets are enforced - PRs that exceed budgets will fail.

## Performance Optimization Tips

### Images
- Use Next.js `<Image>` component
- Enable lazy loading: `loading="lazy"`
- Optimize formats: WebP, AVIF
- Use appropriate sizes

### JavaScript
- Code split by route
- Lazy load heavy components
- Tree-shake unused code
- Minimize bundle sizes

### CSS
- Use CSS-in-JS efficiently
- Avoid inline styles in loops
- Minimize re-renders
- Use CSS containment

### React
- Memoize expensive computations
- Use `React.memo` for pure components
- Avoid unnecessary re-renders
- Clean up effects properly

## Related Documentation

- [PERFORMANCE.md](../../PERFORMANCE.md) - Detailed performance analysis
- [Runtime Vitals](./runtime-vitals.bench.ts) - Core Web Vitals tests
- [Edge Cases](../edge-cases/) - Error scenario tests

---

Built with ⚡ by the Stackwright team
