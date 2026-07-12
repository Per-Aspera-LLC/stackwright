---
'@stackwright/build-scripts': patch
---

**fix(build-scripts): dedup plugin-declared type warnings + thread prebuild.unknownContentTypes from yml**

Closes swp-3r93. Wires the #529 leftover.

### Change 1 — swp-3r93: dedup plugin-declared content type warnings

Previously, every page using a plugin-declared content type (e.g. `data_table_pulse`) emitted its own `[WARN]` line — 22 pages × pulse types = 22 identical noisy lines in DHL builds.

**New behaviour:** a single `[INFO]` summary is emitted after all pages are processed:

```
  [INFO] Plugin-declared content types in use across 3 page(s):
    - fake_pulse (from: fake-pulse-plugin)
  App code must call registerContentType() at runtime for each of these types.
  (Build-time schema validation succeeded via plugin discovery — this is a runtime reminder.)
```

Key messaging improvements:
- Downgraded from `console.warn` to `console.log` with `[INFO]` prefix — this is not an error
- Makes clear that build-time validation already passed (via #529 plugin discovery)
- The message is a runtime registration reminder, not a build failure

Genuine validation errors (`[WARN] Invalid content ...`) are unaffected — they still fire per-page.

### Change 2 — thread `prebuild.unknownContentTypes` from `stackwright.yml`

The `prebuild.unknownContentTypes` field was added to the schema in #529 but never wired. It now works:

```yaml
# stackwright.yml
prebuild:
  unknownContentTypes: warn   # or 'error' (default) or 'ignore'
```

**Precedence:** explicit `runPrebuild({ unknownContentTypes })` option > yml value > `'error'` default.

Implementation: `compileAll` peeks at the yml before any sink runs and fills in `ctx.unknownContentTypes` if the caller didn't pass an explicit value. The default in `createCompileContext` was changed from `'error'` to `undefined` so the "was it explicit?" signal is preserved until resolution.
