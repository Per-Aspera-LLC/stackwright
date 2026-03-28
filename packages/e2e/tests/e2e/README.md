# E2E User Journey Tests

Comprehensive end-to-end tests simulating real user workflows.

## Test Suites

### user-journeys.spec.ts
Tests complete user navigation flows:
- Multi-page navigation (Home → About → Getting Started → Home)
- Blog navigation and back button
- All navigation links functionality
- Theme persistence across pages
- Mobile navigation
- Responsive layout
- Cross-page state (cookies, localStorage)
- Content discovery (blog collections, showcase)
- Error handling (404 pages)

### content-interactions.spec.ts
Tests interactive content type behaviors:
- Carousel controls (next/prev, indicators, auto-play)
- Tabbed content switching
- FAQ accordion expand/collapse
- Timeline rendering
- Contact form validation
- Icon grids
- Feature lists
- Code blocks

### theme-switching.spec.ts
Tests dark mode and theme persistence:
- Theme toggle functionality
- Visual appearance changes
- Cookie-based persistence
- No flash of wrong theme
- System preference respect
- Edge cases (invalid cookies, JS disabled)
- Theme consistency across content types
- Accessibility (keyboard, contrast)

## Features Tested

**✅ Always Required:**
- Page navigation
- Content rendering
- Responsive layout
- 404 handling

**⚠️ Optional (tests skip if not present):**
- Theme toggle button
- Blog posts
- Mobile menu
- Collection lists

## Running Tests

```bash
# Run all E2E tests
pnpm test tests/e2e/

# Run specific suite
pnpm test tests/e2e/user-journeys.spec.ts

# Run with UI
pnpm test tests/e2e/ --ui

# Debug mode
pnpm test tests/e2e/ --debug
```

## Adding New Tests

1. Identify the user journey or interaction
2. Use helpers (`navigateAndWait`, `clickNavLink`, `toggleTheme`)
3. Add skip conditions for optional features
4. Use `.first()` on multi-element selectors
5. Add meaningful assertions that validate UX, not just presence

## Test Philosophy

> "Users don't care about your architecture. They care about whether they can get their task done smoothly."

These tests focus on **user experience**, not implementation details:
- ❌ Don't test: "Does this div have the right class?"
- ✅ Do test: "Can the user navigate from home to about?"
- ✅ Do test: "Does the carousel move when I click next?"
- ✅ Do test: "Does my theme choice persist?"
