import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import {
  textBlockSchema,
  buttonContentSchema,
  mediaItemSchema,
  imageContentSchema,
  iconContentSchema,
  carouselItemSchema,
  timelineItemSchema,
  typographyVariantSchema,
} from '@stackwright/types';
import { pageContentSchema } from '../utils/schema-loader';
import { outputResult } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDef = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = { def: AnyDef };

export interface GenerateAgentDocsResult {
  filesUpdated: string[];
  filesSkipped: string[];
  errors: string[];
}

// ---------------------------------------------------------------------------
// Markers — delimit the auto-generated section in each AGENTS.md file
// ---------------------------------------------------------------------------

const START_MARKER = '<!-- stackwright:content-type-table:start -->';
const END_MARKER = '<!-- stackwright:content-type-table:end -->';

// ---------------------------------------------------------------------------
// Schema name registry — maps Zod schema object references to display names.
// When zodSchemaToTypeString encounters one of these schemas (after resolving
// optional/lazy wrappers), it returns the human-readable name instead of
// the raw Zod type string (e.g. "object", "object | object | object").
// ---------------------------------------------------------------------------

const SCHEMA_NAMES = new Map<object, string>([
  [textBlockSchema as object, 'TextBlock'],
  [buttonContentSchema as object, 'ButtonContent'],
  [mediaItemSchema as object, 'MediaItem'],
  [imageContentSchema as object, 'ImageContent'],
  [iconContentSchema as object, 'IconContent'],
  [carouselItemSchema as object, 'CarouselItem'],
  [timelineItemSchema as object, 'TimelineItem'],
  [typographyVariantSchema as object, 'TypographyVariant'],
]);

// ---------------------------------------------------------------------------
// Zod v4 runtime schema introspection helpers
// ---------------------------------------------------------------------------

function resolveSchema(schema: AnySchema): AnySchema {
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

function zodSchemaToTypeString(schema: AnySchema): string {
  // Check direct reference against name registry (before and after resolving)
  if (SCHEMA_NAMES.has(schema as object)) return SCHEMA_NAMES.get(schema as object)!;
  const resolved = resolveSchema(schema);
  if (SCHEMA_NAMES.has(resolved as object)) return SCHEMA_NAMES.get(resolved as object)!;

  const def = resolved.def;
  switch (def.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'optional':
      return zodSchemaToTypeString(def.innerType as AnySchema);
    case 'lazy':
      return zodSchemaToTypeString(def.getter() as AnySchema);
    case 'enum': {
      const values: string[] = def.entries ? Object.keys(def.entries) : [];
      return values.map((v) => `\`${v}\``).join(' | ');
    }
    case 'literal': {
      const val = def.values ? (def.values as unknown[])[0] : def.value;
      return `"${String(val)}"`;
    }
    case 'array':
      return `${zodSchemaToTypeString(def.element as AnySchema)}[]`;
    case 'union':
    case 'discriminated_union': {
      const members = (def.options as AnySchema[]).map((o) => {
        const r = resolveSchema(o);
        if (SCHEMA_NAMES.has(r as object)) return SCHEMA_NAMES.get(r as object)!;
        // Recurse so primitives (number, string, etc.) resolve correctly
        return zodSchemaToTypeString(r);
      });
      return members.join(' | ');
    }
    case 'object':
      return 'object';
    default:
      return def.type ?? 'unknown';
  }
}

interface FieldInfo {
  name: string;
  type: string;
  required: boolean;
}

function extractFields(schema: AnySchema): FieldInfo[] {
  const resolved = resolveSchema(schema);
  if (resolved.def.type !== 'object') return [];
  const shape = resolved.def.shape as Record<string, AnySchema>;
  return Object.entries(shape).map(([name, fieldSchema]) => ({
    name,
    type: zodSchemaToTypeString(fieldSchema),
    required: fieldSchema.def.type !== 'optional',
  }));
}

function fmtField(field: FieldInfo, showOptMark = false): string {
  const namePart = showOptMark && !field.required ? `\`${field.name}\`?` : `\`${field.name}\``;
  return `${namePart} (${field.type})`;
}

// ---------------------------------------------------------------------------
// Table generators
// ---------------------------------------------------------------------------

function generateContentTypeTable(): string {
  const root = resolveSchema(pageContentSchema as unknown as AnySchema);
  if (root.def.type !== 'object') return '';

  const contentField = (root.def.shape as Record<string, AnySchema>).content;
  const contentResolved = resolveSchema(contentField);
  if (contentResolved.def.type !== 'object') return '';

  const contentItemsField = (contentResolved.def.shape as Record<string, AnySchema>).content_items;
  let itemSchema: AnySchema | null = null;
  if (contentItemsField.def.type === 'array') {
    itemSchema = resolveSchema(contentItemsField.def.element as AnySchema);
  }
  if (!itemSchema || itemSchema.def.type !== 'object') return '';

  const lines = ['| YAML key | Required fields | Optional fields |', '|---|---|---|'];

  const shape = itemSchema.def.shape as Record<string, AnySchema>;
  for (const [yamlKey, fieldSchema] of Object.entries(shape)) {
    const fields = extractFields(fieldSchema);
    const required = fields
      .filter((f) => f.required)
      .map((f) => fmtField(f))
      .join(', ');
    const optional = fields
      .filter((f) => !f.required)
      .map((f) => fmtField(f))
      .join(', ');
    lines.push(`| \`${yamlKey}\` | ${required} | ${optional || '—'} |`);
  }

  return lines.join('\n');
}

function generateSubTypeTable(): string {
  const subTypes: Array<{ name: string; schema: AnySchema }> = [
    { name: 'TextBlock', schema: textBlockSchema as unknown as AnySchema },
    { name: 'ButtonContent', schema: buttonContentSchema as unknown as AnySchema },
    { name: 'MediaItem', schema: mediaItemSchema as unknown as AnySchema },
    { name: 'ImageContent', schema: imageContentSchema as unknown as AnySchema },
    { name: 'IconContent', schema: iconContentSchema as unknown as AnySchema },
    { name: 'CarouselItem', schema: carouselItemSchema as unknown as AnySchema },
    { name: 'TimelineItem', schema: timelineItemSchema as unknown as AnySchema },
  ];

  const lines = ['| Type | Fields |', '|---|---|'];

  for (const { name, schema } of subTypes) {
    const resolved = resolveSchema(schema);
    const isUnion = resolved.def.type === 'discriminated_union' || resolved.def.type === 'union';
    if (isUnion && resolved.def.options) {
      // e.g. MediaItem — show discriminator values from each member's `type` literal field
      const members = (resolved.def.options as AnySchema[]).map((o) => {
        const r = resolveSchema(o);
        if (SCHEMA_NAMES.has(r as object)) return `\`${SCHEMA_NAMES.get(r as object)!}\``;
        const typeField = (r.def.shape as Record<string, AnySchema> | undefined)?.type;
        if (typeField) {
          const tf = resolveSchema(typeField);
          if (tf.def.type === 'literal') {
            const v = tf.def.values ? (tf.def.values as unknown[])[0] : tf.def.value;
            return `\`type: "${String(v)}"\``;
          }
        }
        return 'object';
      });
      lines.push(
        `| \`${name}\` | Discriminated union: ${members.join(' \\| ')}. \`type\` field is required and acts as discriminator. |`
      );
    } else {
      const fields = extractFields(schema);
      const fieldList = fields.map((f) => fmtField(f, true)).join(', ');
      lines.push(`| \`${name}\` | ${fieldList} |`);
    }
  }

  return lines.join('\n');
}

function generateTypographyLine(): string {
  const def = (typographyVariantSchema as unknown as AnySchema).def;
  const values: string[] = def.entries ? Object.keys(def.entries) : [];
  return `**TypographyVariant values:** ${values.map((v) => `\`${v}\``).join(' ')}`;
}

// ---------------------------------------------------------------------------
// Build the full generated block (content between the markers)
// ---------------------------------------------------------------------------

function buildGeneratedBlock(): string {
  const contentTable = generateContentTypeTable();
  const subTypeTable = generateSubTypeTable();
  const typographyLine = generateTypographyLine();

  return [
    'The YAML key is the key used inside `content_items` entries. All types inherit `label` (required), `color` (optional), and `background` (optional) from `BaseContent`.',
    '',
    contentTable,
    '',
    '**Sub-type reference:**',
    '',
    subTypeTable,
    '',
    typographyLine,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// File update logic
// ---------------------------------------------------------------------------

function updateAgentsMd(
  filePath: string,
  newBlock: string
): 'updated' | 'up-to-date' | 'no-markers' | 'not-found' {
  if (!fs.existsSync(filePath)) return 'not-found';

  const current = fs.readFileSync(filePath, 'utf-8');
  const startIdx = current.indexOf(START_MARKER);
  const endIdx = current.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) return 'no-markers';

  const before = current.slice(0, startIdx + START_MARKER.length);
  const after = current.slice(endIdx);
  const updated = `${before}\n${newBlock}\n${after}`;

  if (updated === current) return 'up-to-date';

  fs.writeFileSync(filePath, updated, 'utf-8');
  return 'updated';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateAgentDocs(root: string = process.cwd()): GenerateAgentDocsResult {
  const newBlock = buildGeneratedBlock();

  const targetFiles = [
    path.join(root, 'AGENTS.md'),
    path.join(root, 'examples', 'hellostackwrightnext', 'AGENTS.md'),
  ];

  const filesUpdated: string[] = [];
  const filesSkipped: string[] = [];
  const errors: string[] = [];

  for (const filePath of targetFiles) {
    const result = updateAgentsMd(filePath, newBlock);
    switch (result) {
      case 'updated':
        filesUpdated.push(filePath);
        break;
      case 'up-to-date':
        filesSkipped.push(filePath);
        break;
      case 'no-markers':
        errors.push(`Markers not found in: ${filePath}`);
        break;
      case 'not-found':
        errors.push(`File not found: ${filePath}`);
        break;
    }
  }

  return { filesUpdated, filesSkipped, errors };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerGenerateAgentDocs(program: Command): void {
  program
    .command('generate-agent-docs')
    .description('Regenerate AGENTS.md content type reference tables from live Zod schemas')
    .option('--root <path>', 'Root directory of the monorepo (defaults to cwd)')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { root?: string; json?: boolean }) => {
      const root = opts.root ?? process.cwd();
      const result = generateAgentDocs(root);

      outputResult(result, { json: Boolean(opts.json) }, () => {
        if (result.errors.length > 0) {
          for (const err of result.errors) {
            process.stderr.write(`Error: ${err}\n`);
          }
          process.exit(1);
        }

        if (result.filesUpdated.length === 0 && result.filesSkipped.length > 0) {
          console.log('AGENTS.md files are already up to date.');
        } else {
          for (const f of result.filesUpdated) {
            console.log(`Updated: ${f}`);
          }
          for (const f of result.filesSkipped) {
            console.log(`Up to date: ${f}`);
          }
        }
      });
    });
}
