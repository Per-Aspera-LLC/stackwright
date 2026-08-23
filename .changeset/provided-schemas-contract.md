---
'@stackwright/types': minor
---

Add the generic provided-schema declaration contract for prebuild plugins, upstreamed from the Pro schema-registry package.

- `ProvidedSchemaEntry` / `ProvidedSchemas` (main entry, zod-free): a registry entry declares its schema via exactly one of `schema` (static Zod schema) or `schemaFactory` (resolved at request time from project context), plus optional `synonyms` ("did you mean?" hints) and `phaseAffinity` metadata.
- `PrebuildPluginWithSchemas` (main entry): `PrebuildPlugin & { providedSchemas?: ProvidedSchemas }` — a plugin that declares the schemas it provides in the richer registry shape.
- `assertHasSchema` (main entry): assertion guard for the static-schema invariant.
- `toPrebuildPluginFields` (`@stackwright/types/validation`, zod-heavy): projects a `ProvidedSchemas` map onto the flat `contentItemSchemas` + `knownContentTypeKeys` PrebuildPlugin fields — wraps props-only ZodObjects with a `type` literal discriminant, passes through schemas that already carry one, and skips factory-only entries.

Downstream (Pro schema-registry) will replace its local copies of these definitions with re-exports once this releases.
