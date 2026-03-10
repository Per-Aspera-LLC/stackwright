import { Command } from 'commander';
import chalk from 'chalk';
import {
  textBlockSchema,
  buttonContentSchema,
  mediaItemSchema,
  imageContentSchema,
  iconContentSchema,
  carouselItemSchema,
  timelineItemSchema,
} from '@stackwright/types';
import { pageContentSchema } from '../utils/schema-loader';
import { outputResult } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FieldEntry {
  name: string;
  type: string;
  required: boolean;
}

export interface ContentTypeEntry {
  name: string; // YAML key, e.g. "main", "carousel"
  typeName: string; // TypeScript type name, e.g. "MainContent"
  fields: FieldEntry[];
}

export interface TypesResult {
  contentTypes: ContentTypeEntry[];
  subTypes: ContentTypeEntry[];
}

// ---------------------------------------------------------------------------
// Zod v4 runtime schema introspection helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDef = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = { def: AnyDef };

function resolveSchema(schema: AnySchema): AnySchema {
  let s = schema;
  while (s.def.type === 'lazy') s = s.def.getter() as AnySchema;
  while (s.def.type === 'optional') s = s.def.innerType as AnySchema;
  return s;
}

function zodDefToString(def: AnyDef): string {
  if (!def) return 'unknown';
  switch (def.type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'any':
      return 'any';
    case 'optional':
      return zodDefToString((def.innerType as AnySchema).def);
    case 'lazy':
      return zodDefToString((def.getter() as AnySchema).def);
    case 'enum':
      return (def.entries ? Object.keys(def.entries) : []).join(' | ');
    case 'literal':
      return def.values
        ? (def.values as unknown[]).map(String).join(' | ')
        : def.value !== undefined
          ? String(def.value)
          : 'literal';
    case 'array':
      return `${zodDefToString((def.element as AnySchema).def)}[]`;
    case 'object':
      return 'object';
    case 'union':
      return (def.options as AnySchema[]).map((o) => zodDefToString(o.def)).join(' | ');
    case 'discriminated_union':
      return (def.options as AnySchema[]).map((o) => zodDefToString(o.def)).join(' | ');
    default:
      return def.type ?? 'unknown';
  }
}

function extractFieldsFromSchema(schema: AnySchema): FieldEntry[] {
  const resolved = resolveSchema(schema);
  if (resolved.def.type !== 'object') return [];
  const shape = resolved.def.shape as Record<string, AnySchema>;
  return Object.entries(shape).map(([name, fieldSchema]) => ({
    name,
    type: zodDefToString(fieldSchema.def),
    required: fieldSchema.def.type !== 'optional',
  }));
}

// Map of YAML key → TypeScript type name (for display purposes)
const CONTENT_TYPE_NAMES: Record<string, string> = {
  main: 'MainContent',
  carousel: 'CarouselContent',
  tabbed_content: 'TabbedContent',
  media: 'MediaContent',
  timeline: 'TimelineContent',
  icon_grid: 'IconGridContent',
  code_block: 'CodeBlockContent',
};

const SUB_TYPE_SCHEMAS: Array<{ name: string; schema: AnySchema }> = [
  { name: 'TextBlock', schema: textBlockSchema as unknown as AnySchema },
  { name: 'ButtonContent', schema: buttonContentSchema as unknown as AnySchema },
  { name: 'MediaItem', schema: mediaItemSchema as unknown as AnySchema },
  { name: 'ImageContent', schema: imageContentSchema as unknown as AnySchema },
  { name: 'IconContent', schema: iconContentSchema as unknown as AnySchema },
  { name: 'CarouselItem', schema: carouselItemSchema as unknown as AnySchema },
  { name: 'TimelineItem', schema: timelineItemSchema as unknown as AnySchema },
];

export function getTypes(): TypesResult {
  const root = resolveSchema(pageContentSchema as unknown as AnySchema);
  if (root.def.type !== 'object') return { contentTypes: [], subTypes: [] };

  const contentField = (root.def.shape as Record<string, AnySchema>).content;
  const contentResolved = resolveSchema(contentField);
  if (contentResolved.def.type !== 'object') return { contentTypes: [], subTypes: [] };

  const contentItemsField = (contentResolved.def.shape as Record<string, AnySchema>).content_items;
  let itemSchema: AnySchema | null = null;
  if (contentItemsField.def.type === 'array') {
    itemSchema = resolveSchema(contentItemsField.def.element as AnySchema);
  }

  const contentTypes: ContentTypeEntry[] = [];
  if (itemSchema && itemSchema.def.type === 'object') {
    const shape = itemSchema.def.shape as Record<string, AnySchema>;
    for (const [yamlKey, fieldSchema] of Object.entries(shape)) {
      contentTypes.push({
        name: yamlKey,
        typeName: CONTENT_TYPE_NAMES[yamlKey] ?? yamlKey,
        fields: extractFieldsFromSchema(fieldSchema),
      });
    }
  }

  const subTypes: ContentTypeEntry[] = SUB_TYPE_SCHEMAS.map(({ name, schema }) => ({
    name,
    typeName: name,
    fields: extractFieldsFromSchema(schema),
  }));

  return { contentTypes, subTypes };
}

// ---------------------------------------------------------------------------
// Commander registration
// ---------------------------------------------------------------------------

export function registerTypes(program: Command): void {
  program
    .command('types')
    .description('Show available content types from the live schema')
    .option('--json', 'Output machine-readable JSON')
    .action((opts: { json?: boolean }) => {
      const json = Boolean(opts.json);
      const result = getTypes();

      outputResult(result, { json }, () => {
        console.log(chalk.bold('\nContent Types\n'));
        console.log(`${'YAML key'.padEnd(20)}${'Type'.padEnd(25)}${'Required fields'}`);
        console.log('─'.repeat(72));
        for (const ct of result.contentTypes) {
          const required = ct.fields
            .filter((f) => f.required)
            .map((f) => f.name)
            .join(', ');
          console.log(`${chalk.cyan(ct.name.padEnd(20))}${ct.typeName.padEnd(25)}${required}`);
        }

        console.log(chalk.bold('\nSub-types\n'));
        for (const st of result.subTypes) {
          const fields = st.fields
            .map((f) => `${f.name}${f.required ? '' : '?'}: ${f.type}`)
            .join(', ');
          console.log(`  ${chalk.cyan(st.typeName)} — ${fields}`);
        }
      });
    });
}
