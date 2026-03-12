---
"@stackwright/cli": minor
"@stackwright/mcp": minor
---

Add `stackwright_write_site_config` MCP tool and `writeSiteConfig` CLI function (#124). Agents can now programmatically update site configuration (themes, navigation, app bar, footer) with full Zod schema validation before write. Invalid YAML is rejected with field-level error messages. Also adds `site write` CLI subcommand.
