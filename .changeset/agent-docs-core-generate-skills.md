---
'@stackwright/cli': minor
---

Extract the AGENTS.md table generator's Zod introspection into a shared agent-docs core (`packages/cli/src/agent-docs/`) and add a `stackwright generate-skills` command that emits the generated `stackwright-page-authoring` code-puppy skill from live schemas (deterministic output, `--check` drift mode wired into CI). The core and skill builders are exported from `@stackwright/cli` so downstream (Pro) emitters can compose extended skills without forking. `generate-agent-docs` output is byte-identical to before.
