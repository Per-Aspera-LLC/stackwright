# @stackwright/build-scripts

Build-time utilities for Stackwright projects — icon manifest generation and
prebuild step orchestration.

---

## Prebuild telemetry — `.stackwright/prebuild-events.ndjson`

Every prebuild step emits structured events to
**`.stackwright/prebuild-events.ndjson`** in your project root. The file is
newline-delimited JSON (NDJSON) — one event per line — and is truncated at the
start of each process so stale runs don't accrete.

This supplements (does not replace) the existing `console.warn` output.

### Sink location

```
<project-root>/.stackwright/prebuild-events.ndjson
```

Add `.stackwright/prebuild-events.ndjson` to `.gitignore` — it's build
ephemera, not source.

### Event schema

Source of truth: [`src/lib/prebuild-events.ts`](src/lib/prebuild-events.ts).

Every event shares these base fields:

| Field | Type | Notes |
|-------|------|-------|
| `schemaVersion` | `1` | Always `1` — gate on this for forward compat |
| `ts` | ISO-8601 string | Timestamp of emission |
| `seq` | number | Monotonic counter, per-process, starts at 0 |
| `phase` | `"prebuild"` | Always `"prebuild"` |
| `type` | string | One of the five event types below |

**Example NDJSON output** (from a scan that hits one unknown icon):

```ndjson
{"schemaVersion":1,"ts":"2025-05-14T11:02:00.001Z","seq":0,"phase":"prebuild","type":"prebuild_start","step":"icon-scan"}
{"schemaVersion":1,"ts":"2025-05-14T11:02:00.003Z","seq":1,"phase":"prebuild","type":"icon_fallback","src":"Bridge","resolved":"Bridge","fallback":"HelpCircle"}
{"schemaVersion":1,"ts":"2025-05-14T11:02:00.004Z","seq":2,"phase":"prebuild","type":"icons_summary","totalIcons":1,"unknownCount":1,"unknownIcons":["Bridge"]}
{"schemaVersion":1,"ts":"2025-05-14T11:02:00.005Z","seq":3,"phase":"prebuild","type":"file_generated","path":"/app/stackwright-generated/icons.ts"}
{"schemaVersion":1,"ts":"2025-05-14T11:02:00.006Z","seq":4,"phase":"prebuild","type":"prebuild_complete","step":"icon-scan","durationMs":5}
```

### Env vars

| Var | Effect |
|-----|--------|
| `STACKWRIGHT_TELEMETRY_DISABLED=1` | All emits are no-ops; sink file not created |
| `STACKWRIGHT_TELEMETRY_DEBUG=1` | Emit failures are logged to stderr |
| `STACKWRIGHT_PROJECT_ROOT` | Override the project root for the sink path |

### Forward compatibility

Always check `schemaVersion` before reading event fields. New event types or
optional fields may be added in future minor versions; unknown fields should be
ignored. Breaking field changes will bump `schemaVersion`.
