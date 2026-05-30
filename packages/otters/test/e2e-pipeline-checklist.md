# Otter Pipeline — End-to-End Test Checklist

Use this checklist to validate a full Brand → Theme → Page pipeline run.
Run this against a fresh scaffolded project (`pnpm stackwright scaffold test-site --standalone`).

---

## Setup

- [ ] Fresh project scaffolded: `pnpm stackwright scaffold test-site --standalone`
- [ ] MCP server running: `pnpm stackwright-mcp` (or `npx @stackwright/mcp`)
- [ ] Dev server running: `cd test-site && pnpm dev`
- [ ] Otters installed: `ls ~/.code_puppy/agents/ | grep otter`

---

## Phase 0: Foreman Discovery

Invoke: `code-puppy -i -a stackwright-foreman-otter`

- [ ] Foreman lists available otters (Brand, Theme, Page)
- [ ] Foreman correctly identifies there is no BRAND_BRIEF.md → triggers Phase 1
- [ ] Foreman sets a stable session_id for the build
- [ ] Foreman explains to user what's happening before each phase

---

## Phase 1: Brand Discovery (Brand Otter)

Expected outputs: `BRAND_BRIEF.md` in project root

- [ ] Brand Otter asks about company / audience / value prop
- [ ] Brand Otter asks about tone and personality adjectives
- [ ] Brand Otter asks about visual preferences (color mood, density)
- [ ] Brand Otter asks about competitors
- [ ] Brand Otter asks which pages are needed and what the primary CTA is
- [ ] Brand Otter reads back a summary before saving
- [ ] `BRAND_BRIEF.md` created with all required sections:
  - [ ] Core Identity (company, audience, value prop)
  - [ ] Brand Personality (adjectives, tone, emotional target)
  - [ ] Visual Direction (color mood, typography feel, density)
  - [ ] Content Strategy (pages needed, primary CTA, hero message)
  - [ ] Differentiation (competitors, how we're different)
  - [ ] Brand Guidelines

---

## Phase 2: Theme Design (Theme Otter)

Expected outputs: `stackwright.yml` with `customTheme`

- [ ] Theme Otter reads BRAND_BRIEF.md successfully
- [ ] Theme Otter designs all 7 required colors (primary, secondary, accent, background, surface, text, textSecondary)
- [ ] Theme Otter includes `darkColors` section (all 7 keys)
- [ ] Theme Otter selects Google Fonts only
- [ ] Theme Otter includes `navigation` section with correct pages from Brand Brief
- [ ] Theme Otter includes `siteTitle`
- [ ] `stackwright_validate_site` passes with no errors
- [ ] Optional: `stackwright_render_yaml` preview shown before save

---

## Phase 3: Page Building (Page Otter)

Expected outputs: `pages/content.yml` (home) + one page per site requirement

- [ ] Page Otter reads BRAND_BRIEF.md and stackwright.yml
- [ ] Page Otter uses theme COLOR KEYS (not hex codes)
- [ ] Page Otter writes copy in brand voice
- [ ] Every content_item has a unique `label`
- [ ] Home page includes: hero (main), value prop, features/social proof, CTA
- [ ] `meta.title` and `meta.description` set on each page
- [ ] `stackwright_validate_pages` passes with no errors
- [ ] Pages render at desktop (1280px) without visual errors
- [ ] Pages render at mobile (375px) without layout breaks

---

## Phase 4: Foreman Verification

- [ ] Foreman checks dev server is running
- [ ] Foreman renders home page with `stackwright_render_page`
- [ ] Foreman presents screenshot to user
- [ ] Foreman gives user "next steps" (run pnpm dev, how to request changes)

---

## Phase Skip Tests

Run these to validate skip logic:

### Skip Brand Phase
```bash
# With existing BRAND_BRIEF.md present
code-puppy -i -a stackwright-foreman-otter
# Expected: Foreman detects BRAND_BRIEF.md, skips Brand Otter, goes to Theme
```
- [ ] Foreman skips Brand Otter when BRAND_BRIEF.md exists
- [ ] Foreman tells user what was skipped and why

### Skip Theme Phase
```bash
# With existing stackwright.yml with customTheme
code-puppy -i -a stackwright-foreman-otter
# Expected: Foreman detects customTheme, skips Theme Otter, goes to Page
```
- [ ] Foreman skips Theme Otter when customTheme is present

---

## Error Recovery Tests

### Invalid YAML Recovery
1. Manually corrupt a page YAML file
2. Run `code-puppy -i -a stackwright-page-otter`
3. Expected: Page Otter detects validation error, fixes it, re-validates

- [ ] Otter reports the specific validation error clearly
- [ ] Otter fixes the error without user intervention (if auto-fixable)
- [ ] Otter re-validates after fixing

### Missing BRAND_BRIEF.md Recovery
1. Delete BRAND_BRIEF.md
2. Run `code-puppy -i -a stackwright-theme-otter` directly
3. Expected: Theme Otter notices missing brief and prompts user to run Brand Otter first

- [ ] Theme Otter checks for BRAND_BRIEF.md on startup
- [ ] Theme Otter gives clear guidance when file is missing

---

## Regression Test Sites

Run the full pipeline end-to-end on each of these site types:

| Site Type | Complexity | Status |
|-----------|-----------|--------|
| Law firm | Simple (4 pages) | ✅ Passed — reference output in `examples/law-firm-example/` |
| SaaS product | Medium (5 pages + pricing) | ✅ Passed — reference output in `examples/saas-example/` |
| Restaurant | Simple (3 pages) | ✅ Passed — reference output in `examples/restaurant-example/` |
| Portfolio/Agency | Medium (5 pages) | ⬜ Not tested |
| B2B services | Complex (6+ pages) | ⬜ Not tested |

Update this table with results:
- ✅ Passed (full pipeline, no manual intervention)
- ⚠️ Passed with issues (note what needed fixing)
- ❌ Failed (describe what broke)

---

## Known Issues / Notes

- Reference outputs generated by code-puppy simulating otter pipeline output (not live interactive otter session). Content validated for schema compliance: all color keys, unique labels, valid Lucide icons, Google Fonts only, meta fields present.
- Portfolio/Agency and B2B services examples remain for a future session (stackwright-a1g Phase 2).
- The `contact_form_stub` is used for contact pages; the new `form` content type (stackwright-rn9) could replace it in future example updates.
- Nested `content_items` inside `tabbed_content` tabs must have globally unique labels within the page — verified in restaurant and law firm examples.

---

*Last updated: 2026-05-25*
*Tested by: Stackwright planning-agent-59eb05 + code-puppy*
