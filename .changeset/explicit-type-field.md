---
'@stackwright/types': major
'@stackwright/core': minor
'@stackwright/build-scripts': minor
'@stackwright/cli': minor
'@stackwright/mcp': minor
---

BREAKING: Content items now use an explicit `type` field for discrimination.

Before (nested key):
```yaml
content_items:
  - main:
      label: hero
      heading: { text: "Hello", textSize: h1 }
```

After (flat with `type`):
```yaml
content_items:
  - type: main
    label: hero
    heading: { text: "Hello", textSize: h1 }
```

This replaces the fragile `Object.entries(item)[0]` discrimination pattern with a proper
discriminated union on the `type` field. Benefits:

- TypeScript discriminated union narrowing (`if (item.type === 'main')`)
- Clearer Zod validation errors (field-level paths instead of "unrecognized key")
- No dependence on JS object insertion order
- Simpler content renderer logic
- Better MCP tool introspection

All 15 content types are updated. The prebuild pipeline, CLI scaffolding, MCP tools,
and agent docs generation have been adapted to the new format.
