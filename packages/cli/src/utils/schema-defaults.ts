/**
 * Schema-driven default value generator.
 *
 * Walks a Zod v4 schema and produces a plain JS object that conforms to it,
 * using an optional hints map to supply semantic values (text, colors, etc.)
 * where pure introspection can only produce placeholders.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnyDef = Record<string, any>;
type AnySchema = { def: AnyDef };

export interface Hint {
  /** Literal value to use for this path */
  value?: unknown;
  /** Force-include an optional field (default: skip optional fields) */
  include?: boolean;
  /** Number of items to generate in an array (default: 0 for optional, 1 for required) */
  arrayLength?: number;
  /** For ContentItem-style pick-one objects: which key to populate */
  pick?: string;
}

export type HintMap = Record<string, Hint>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function resolveSchema(schema: AnySchema): AnySchema {
  let s = schema;
  // Unwrap lazy and optional wrappers in any order (they can nest either way)
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

function isOptional(schema: AnySchema): boolean {
  let s = schema;
  let changed = true;
  while (changed) {
    changed = false;
    if (s.def.type === 'optional') return true;
    if (s.def.type === 'lazy') {
      s = s.def.getter() as AnySchema;
      changed = true;
    }
  }
  return false;
}

function getHint(hints: HintMap | undefined, path: string): Hint | undefined {
  return hints?.[path];
}

function joinPath(base: string, key: string | number): string {
  return base ? `${base}.${key}` : String(key);
}

/**
 * Check if this object should use pick-one semantics. Only activates when
 * the hint explicitly specifies a `pick` key — we don't infer pick-one
 * from schema shape alone because many normal objects have all-optional fields.
 */
function shouldPickOne(hint: Hint | undefined): boolean {
  return hint?.pick !== undefined;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export function generateDefaults(
  schema: AnySchema,
  hints?: HintMap,
  path: string = '',
  seen?: Set<AnySchema>
): unknown {
  const hint = getHint(hints, path);

  // If hint provides a literal value, use it directly
  if (hint?.value !== undefined) {
    return hint.value;
  }

  const resolved = resolveSchema(schema);
  const defType = resolved.def.type;

  switch (defType) {
    case 'string':
      return 'example';

    case 'number':
      return 0;

    case 'boolean':
      return false;

    case 'literal': {
      if (resolved.def.values) {
        return (resolved.def.values as unknown[])[0];
      }
      return resolved.def.value;
    }

    case 'enum': {
      const entries = resolved.def.entries;
      if (entries) {
        return Object.values(entries)[0];
      }
      return 'example';
    }

    case 'array': {
      const elementSchema = resolved.def.element as AnySchema;
      const len = hint?.arrayLength ?? 0;
      if (len === 0) return [];
      const items: unknown[] = [];
      for (let i = 0; i < len; i++) {
        items.push(generateDefaults(elementSchema, hints, joinPath(path, i), seen));
      }
      return items;
    }

    case 'object': {
      const shape = resolved.def.shape as Record<string, AnySchema>;

      // Handle pick-one pattern (like ContentItem)
      if (shouldPickOne(hint)) {
        const pickKey = hint!.pick!;
        if (pickKey && shape[pickKey]) {
          const ancestorSet = seen ?? new Set<AnySchema>();
          const resolvedField = resolveSchema(shape[pickKey]);
          if (ancestorSet.has(resolvedField)) {
            return { [pickKey]: {} };
          }
          // Clone set — each branch gets its own ancestor tracking
          const branchSet = new Set(ancestorSet);
          branchSet.add(resolvedField);
          const fieldValue = generateDefaults(
            shape[pickKey],
            hints,
            joinPath(path, pickKey),
            branchSet
          );
          return { [pickKey]: fieldValue };
        }
        return {};
      }

      // Normal object — generate required fields + hinted optional fields
      const result: Record<string, unknown> = {};
      const ancestorSet = seen ?? new Set<AnySchema>();

      for (const [key, fieldSchema] of Object.entries(shape)) {
        const fieldPath = joinPath(path, key);
        const fieldHint = getHint(hints, fieldPath);
        const optional = isOptional(fieldSchema);

        if (
          !optional ||
          fieldHint?.include ||
          fieldHint?.value !== undefined ||
          fieldHint?.arrayLength !== undefined ||
          fieldHint?.pick !== undefined
        ) {
          const resolvedField = resolveSchema(fieldSchema);
          if (ancestorSet.has(resolvedField)) {
            continue;
          }
          // Clone set — each sibling field gets independent cycle tracking
          const branchSet = new Set(ancestorSet);
          branchSet.add(resolvedField);
          result[key] = generateDefaults(fieldSchema, hints, fieldPath, branchSet);
        }
      }
      return result;
    }

    case 'union':
    case 'discriminated_union': {
      const options = resolved.def.options as AnySchema[];
      if (options.length > 0) {
        return generateDefaults(options[0], hints, path, seen);
      }
      return {};
    }

    default:
      return null;
  }
}
