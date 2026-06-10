---
"@stackwright/types": minor
---

feat(types): add websocket and sse integration types with streaming transport support

Integration schema now supports `websocket` and `sse` as integration types alongside `openapi`, `graphql`, and `rest`. New optional `transport` field (`polling` | `websocket` | `sse`) enables configuring streaming data delivery for real-time integrations.
