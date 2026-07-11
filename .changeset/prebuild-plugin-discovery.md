---
"@stackwright/build-scripts": minor
"@stackwright/types": minor
---

Add three-tier plugin auto-discovery to `stackwright-prebuild` so Pro content types (`data_table_pulse`, `metric_card_pulse`, etc.) validate correctly during prebuild — matching the fidelity of `next dev` runtime.

**Root cause fixed:** the CLI binary previously invoked `runPrebuild()` with an empty `plugins` array, so `validatePageContent()` saw no schemas for Pro types and emitted `[WARN] Unknown content type data_table_pulse` even when `@stackwright-pro/build-scripts-plugins` was correctly installed. Prebuild is a distinct runtime from the Next.js app process — `registerContentType()` calls in app code never reached it. This PR adds the missing build-time discovery layer.

## Discovery tiers

1. **Convention** — attempts `require('@stackwright-pro/build-scripts-plugins')` from the project's `node_modules`. Silent soft-fail if absent (normal OSS case).
2. **Config** — reads `prebuild.plugins: string[]` from `stackwright.yml`. Hard-fails with a clear error naming any missing package (typo guard).
3. **Explicit override** — `runPrebuild({ plugins })` bypasses discovery entirely. Preserves existing programmatic wrappers and test injection.

## CLI flags

- `--no-plugin-discovery` — disable all auto-discovery
- `--plugins pkg-a,pkg-b` — comma-separated override list, skips Tier A/B

## Type changes (`@stackwright/types`)

- `PrebuildOptions` gains optional `pluginDiscovery?: boolean` and `pluginOverride?: string[]`
- `siteConfigSchema` gains optional `prebuild: { plugins?: string[]; unknownContentTypes?: 'error' | 'warn' | 'ignore' }` block (behavior wiring for `unknownContentTypes` is a follow-up)

## Backward compatibility

- `runPrebuild({ plugins: [...] })` → unchanged (explicit array wins over discovery)
- `runPrebuild({ plugins: [] })` → unchanged (empty array = "explicitly no plugins")
- `runPrebuild()` with no `plugins` field → **new behavior**: discovery runs

## Implementation notes

- Discovery is **synchronous** (uses CJS `require()` via `createRequire`, not `await import()`) to preserve the `runWatch()` invariant that all sync file writes happen before the first `await` in `runPrebuild`. All Pro plugins are CJS per the project rule "no `type: module` in packages/*", so this covers all production cases.
- The canonical Pro bundle name (`@stackwright-pro/build-scripts-plugins`) is an intentional soft-coupling from OSS to Pro — resolved dynamically, never imported.
- CLI logging follows existing convention: `[INFO]` fires only when the user deviates from the default (mirrors `--no-sbom` etc.).

## Testing

12 integration tests with real fixtures under `packages/build-scripts/test/fixtures/discovery/` — real temp dirs, real fake CJS plugin packages with real Zod schemas. No mocks. Full suite 278/278 green. Manual empty-folder smoke test confirmed silent Tier A soft-fail on vanilla OSS projects.
