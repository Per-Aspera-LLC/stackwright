---
"@stackwright/core": minor
---

Add `registerContentType(key, schema, component)` API for first-class content type extensibility. A single call in `_app.tsx` registers both the React component and its Zod schema — no framework source modifications needed. Custom types render through the existing pipeline; invalid props are warned in development. `getRegisteredContentTypes()` and `getContentTypeSchema()` are exported for MCP and CLI introspection.
