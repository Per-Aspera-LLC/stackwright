/**
 * Zod v4 runtime schema introspection — the shared, rendering-neutral core
 * behind `generate-agent-docs` (AGENTS.md tables) and `generate-skills`
 * (code-puppy SKILL.md files).
 *
 * Everything here is a pure function of (schema, name-map) → data. No I/O,
 * no markdown — emitters own their own rendering.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnyDef = Record<string, any>;

export type AnySchema = { def: AnyDef };

/**
 * Maps Zod schema object references to display names. When
 * zodSchemaToTypeString encounters one of these schemas (after resolving
 * optional/lazy wrappers), it returns the human-readable name instead of
 * the raw Zod type string (e.g. "object", "object | object | object").
 */
export type SchemaNameMap = Map<object, string>;

export interface FieldInfo {
  name: string;
  type: string;
  required: boolean;
  /** Populated when the (resolved) field schema is a Zod enum. */
  enumValues?: string[];
}

/** Rendering-neutral model of a single content type (one union variant). */
export interface ContentTypeModel {
  /** YAML key — the `type` literal discriminator value. */
  key: string;
  fields: FieldInfo[];
}

// ---------------------------------------------------------------------------
// Wrapper resolution
// ---------------------------------------------------------------------------

export function resolveSchema(schema: AnySchema): AnySchema {
  let s = schema;
  // Run combined loop to handle nested wrappers like optional(lazy(...))
  let changed = true;
  while (changed) {
    changed = false;
    if (s.def.type === 'lazy') {
      s = s.def.getter() as AnySchema;
      changed = true;
    }
    if (s.def.type === 'optional') {
      s = s.def.innerType as AnySchema;
      changed = true;
    }
  }
  return s;
}

// ---------------------------------------------------------------------------
// Type-string rendering (shared by tables and skills)
// ---------------------------------------------------------------------------

export function zodSchemaToTypeString(schema: AnySchema, names: SchemaNameMap): string {
  // Check direct reference against name registry (before and after resolving)
  if (names.has(schema as object)) return names.get(schema as object)!;
  const resolved = resolveSchema(schema);
  if (names.has(resolved as object)) return names.get(resolved as object)!;

  const def = resolved.def;
  switch (def.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'optional':
      return zodSchemaToTypeString(def.innerType as AnySchema, names);
    case 'lazy':
      return zodSchemaToTypeString(def.getter() as AnySchema, names);
    case 'enum': {
      const values: string[] = def.entries ? Object.keys(def.entries) : [];
      return values.map((v) => `\`${v}\``).join(' | ');
    }
    case 'literal': {
      const val = def.values ? (def.values as unknown[])[0] : def.value;
      return `"${String(val)}"`;
    }
    case 'array':
      return `${zodSchemaToTypeString(def.element as AnySchema, names)}[]`;
    case 'union':
    case 'discriminated_union': {
      const members = (def.options as AnySchema[]).map((o) => {
        const r = resolveSchema(o);
        if (names.has(r as object)) return names.get(r as object)!;
        // Recurse so primitives (number, string, etc.) resolve correctly
        return zodSchemaToTypeString(r, names);
      });
      return members.join(' | ');
    }
    case 'object':
      return 'object';
    default:
      return def.type ?? 'unknown';
  }
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

export function extractFields(schema: AnySchema, names: SchemaNameMap): FieldInfo[] {
  const resolved = resolveSchema(schema);
  if (resolved.def.type !== 'object') return [];
  const shape = resolved.def.shape as Record<string, AnySchema>;
  return Object.entries(shape).map(([name, fieldSchema]) => {
    const field: FieldInfo = {
      name,
      type: zodSchemaToTypeString(fieldSchema, names),
      required: fieldSchema.def.type !== 'optional',
    };
    const fieldResolved = resolveSchema(fieldSchema);
    if (fieldResolved.def.type === 'enum' && fieldResolved.def.entries) {
      field.enumValues = Object.keys(fieldResolved.def.entries);
    }
    return field;
  });
}

/** Extract the `type` literal discriminator value from a union variant. */
export function literalTypeKey(variant: AnySchema): string | null {
  const resolved = resolveSchema(variant);
  if (resolved.def.type !== 'object') return null;
  const shape = resolved.def.shape as Record<string, AnySchema>;
  const typeField = shape.type ? resolveSchema(shape.type) : null;
  if (typeField?.def.type !== 'literal') return null;
  return (
    typeField.def.value ?? (Array.isArray(typeField.def.values) ? typeField.def.values[0] : null)
  );
}

// ---------------------------------------------------------------------------
// Content-type model building
// ---------------------------------------------------------------------------

/**
 * Walk a page-content schema (page → content → content_items → union) and
 * return the union variants that make up the ContentItem union.
 */
export function getContentItemVariants(pageSchema: AnySchema): AnySchema[] {
  const root = resolveSchema(pageSchema);
  if (root.def.type !== 'object') return [];

  const contentField = (root.def.shape as Record<string, AnySchema>).content;
  const contentResolved = resolveSchema(contentField);
  if (contentResolved.def.type !== 'object') return [];

  const contentItemsField = (contentResolved.def.shape as Record<string, AnySchema>).content_items;
  let itemSchema: AnySchema | null = null;
  if (contentItemsField.def.type === 'array') {
    itemSchema = resolveSchema(contentItemsField.def.element as AnySchema);
  }
  if (!itemSchema) return [];

  // ContentItem is a union of content type schemas (each with a `type` literal).
  return itemSchema.def.type === 'union' || itemSchema.def.type === 'discriminated_union'
    ? (itemSchema.def.options as AnySchema[])
    : itemSchema.def.type === 'object'
      ? [itemSchema]
      : [];
}

/**
 * Build the rendering-neutral model: one ContentTypeModel per content-item
 * union variant, in schema declaration order (deterministic).
 */
export function buildContentTypeModels(
  pageSchema: AnySchema,
  names: SchemaNameMap
): ContentTypeModel[] {
  const models: ContentTypeModel[] = [];
  for (const variant of getContentItemVariants(pageSchema)) {
    const resolved = resolveSchema(variant);
    if (resolved.def.type !== 'object') continue;
    const key = literalTypeKey(variant);
    if (!key) continue;
    models.push({ key, fields: extractFields(variant, names) });
  }
  return models;
}

// ---------------------------------------------------------------------------
// Deterministic example synthesis (schemas → placeholder values → YAML)
// ---------------------------------------------------------------------------

const MAX_SYNTH_DEPTH = 6;

/**
 * Synthesize a deterministic placeholder value for a schema. Only required
 * object fields are included so examples stay minimal. Depth-capped so the
 * recursive types (grid, tabbed_content) terminate.
 */
export function synthValue(schema: AnySchema, depth = 0): unknown {
  if (depth > MAX_SYNTH_DEPTH) return null;
  const resolved = resolveSchema(schema);
  const def = resolved.def;
  switch (def.type) {
    case 'string':
      return 'example';
    case 'number':
      return 1;
    case 'boolean':
      return false;
    case 'enum': {
      const values: string[] = def.entries ? Object.keys(def.entries) : [];
      return values[0] ?? 'example';
    }
    case 'literal':
      return def.values ? (def.values as unknown[])[0] : def.value;
    case 'array':
      return [synthValue(def.element as AnySchema, depth + 1)];
    case 'union':
    case 'discriminated_union': {
      const first = (def.options as AnySchema[])[0];
      return first ? synthValue(first, depth + 1) : null;
    }
    case 'object': {
      const shape = def.shape as Record<string, AnySchema>;
      const out: Record<string, unknown> = {};
      for (const [name, fieldSchema] of Object.entries(shape)) {
        if (fieldSchema.def.type === 'optional') continue;
        out[name] = synthValue(fieldSchema, depth + 1);
      }
      return out;
    }
    default:
      return null;
  }
}
