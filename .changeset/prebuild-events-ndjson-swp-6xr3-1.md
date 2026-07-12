---
"@stackwright/build-scripts": minor
---

Add structured NDJSON prebuild telemetry sink (swp-6xr3.1, child of swp-6xr3).

`generateIconManifest()` now emits structured events to
`.stackwright/prebuild-events.ndjson` alongside the existing `console.warn`
human-readable output. The file is machine-readable and forward-compatible —
useful for QA otter introspection and downstream tooling without having to
parse stderr.

**Event types emitted:**

- `prebuild_start` — step lifecycle open (includes `step` name)
- `prebuild_complete` — step lifecycle close (includes `step` + `durationMs`)
- `icon_fallback` — per-icon: original `src`, `resolved` name after alias mapping, and `fallback` used
- `icons_summary` — batch summary: `totalIcons`, `unknownCount`, `unknownIcons[]`
- `file_generated` — `path` of each artifact written to disk

**Schema versioning:** every event carries `schemaVersion: 1` — consumers
should gate on this field for forward compatibility.

**Env var controls:**

| Var | Effect |
|-----|--------|
| `STACKWRIGHT_TELEMETRY_DISABLED=1` | all emits are no-ops; sink file not created |
| `STACKWRIGHT_TELEMETRY_DEBUG=1` | emit failures are written to stderr |
| `STACKWRIGHT_PROJECT_ROOT` | override the project root used to resolve the sink path |

**Design notes:**

- Zero new runtime dependencies — stdlib (`fs`, `path`) only.
- Telemetry failure is non-fatal: the `emit()` call swallows all errors so a
  broken sink path never fails the prebuild.
- `mapToValidLucideName()` (Site A) stays pure — batch telemetry is the
  caller's responsibility, documented inline.
- First `emit()` per process truncates the sink file so stale runs don't
  accrete across builds.

Complements (does not replace) the existing `console.warn` output.
