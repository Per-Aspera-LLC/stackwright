# Edge Cases & Error Scenarios Tests 🔥

**Phase 4** of the Stackwright E2E testing strategy.

## Overview

These tests verify that Stackwright handles edge cases and error scenarios gracefully. A production-ready framework must not crash when things go wrong.

## Test Coverage

### Error Scenarios (`error-scenarios.spec.ts`)

#### 1. 404 & Error Pages
- ✅ 404 page renders correctly
- ✅ 404 page has no console errors  
- ✅ Can navigate back to home from 404

#### 2. Missing/Broken Media
- ✅ Page renders with missing image sources
- ✅ Images have proper alt text
- ✅ Broken images don't crash the page

#### 3. Extreme Content Length
- ✅ 10,000 character strings don't break layout
- ✅ 1,000 char unbroken words wrap correctly
- ✅ 100-level deeply nested DOM doesn't crash

#### 4. Unicode & Special Characters
- ✅ Emoji render correctly (🐶🎉🚀)
- ✅ Unicode (Chinese, Arabic, Cyrillic) displays
- ✅ HTML special characters are escaped
- ✅ Markdown/code special chars don't break rendering

#### 5. Boundary Conditions
- ✅ Empty content arrays don't crash
- ✅ Zero-sized elements handled
- ✅ Ultra-wide viewport (3840px) handled
- ✅ Narrow viewport (320px) handled

#### 6. Rapid State Changes
- ✅ Rapid page navigation doesn't crash
- ✅ Spam clicking nav links handled

#### 7. Browser Compatibility
- ✅ Works without localStorage
- ✅ SSR content visible without JS

## Running the Tests

```bash
# Run all edge case tests
pnpm test:e2e --grep "edge-cases"

# Run specific test suite
pnpm test:e2e tests/edge-cases/error-scenarios.spec.ts

# Run with headed browser (see what's happening)
pnpm test:e2e tests/edge-cases/error-scenarios.spec.ts --headed
```

## Philosophy

> "Programs must be written for people to read, and only incidentally for machines to execute."
> — Harold Abelson

Edge cases are where the rubber meets the road. A framework that handles errors gracefully is a framework your users can trust.

### Why These Tests Matter

1. **404 Pages**: Users will inevitably hit broken links. Your 404 should help them, not confuse them.

2. **Missing Images**: Networks fail, CDNs go down. Your site should degrade gracefully.

3. **Long Strings**: User input is unpredictable. A 10,000 char string shouldn't break your layout.

4. **Unicode**: The web is global. 你好 and مرحبا should render as beautifully as "Hello".

5. **Boundaries**: Edge cases expose bugs. Test the extremes to find the weaknesses.

## Interpreting Results

### Expected Behavior

- ✅ All tests should pass
- ✅ No console errors during error scenarios
- ✅ Pages remain functional under stress
- ✅ Layout doesn't break with extreme inputs

### Warning Signs

- ⚠️ Console errors during 404 pages
- ⚠️ White screen of death with missing images
- ⚠️ Horizontal scrolling on narrow viewports
- ⚠️ Broken layout with Unicode characters

### Critical Failures

- 🚨 Page crashes with long strings
- 🚨 XSS vulnerability (unescaped HTML)
- 🚨 Site unusable without localStorage
- 🚨 Navigation breaks with spam clicks

## Debugging Failed Tests

### 404 Tests Failing?

Check your `pages/404.tsx` or `app/not-found.tsx`:
```bash
# Does it exist?
ls examples/hellostackwrightnext/pages/404.tsx
# or
ls examples/hellostackwrightnext/app/not-found.tsx
```

### Unicode Tests Failing?

Ensure your HTML has proper charset:
```html
<meta charset="UTF-8" />
```

### Layout Breaking with Long Strings?

Add proper text overflow handling:
```css
word-break: break-word;
overflow-wrap: break-word;
```

## Future Enhancements

- [ ] Test with real user content (scraped data)
- [ ] Fuzz testing with random inputs
- [ ] Error boundary integration tests
- [ ] Network failure simulation
- [ ] CORS error handling

## Related Documentation

- [CONTRIBUTING.md](../../../../CONTRIBUTING.md#troubleshooting) - Debugging tips
- [Performance Tests](../performance/) - Performance benchmarks
- [A11y Tests](../a11y/) - Accessibility tests

---

Built with 🐶 by the Stackwright team
