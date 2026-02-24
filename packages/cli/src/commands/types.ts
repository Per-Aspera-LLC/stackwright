import { Command } from 'commander';
import chalk from 'chalk';
import { loadContentSchema } from '../utils/schema-loader';
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
  name: string;       // YAML key, e.g. "main", "carousel"
  typeName: string;   // TypeScript type name, e.g. "MainContent"
  fields: FieldEntry[];
}

export interface TypesResult {
  contentTypes: ContentTypeEntry[];
  subTypes: ContentTypeEntry[];
}

// ---------------------------------------------------------------------------
// Pure function
// ---------------------------------------------------------------------------

type JsonSchema = Record<string, unknown>;

const CONTENT_ITEM_MAP_KEY = 'ContentItem';
const SUB_TYPE_NAMES = new Set([
  'TextBlock',
  'ButtonContent',
  'MediaItem',
  'ImageContent',
  'IconContent',
  'CarouselItem',
  'TimelineItem',
]);

export function getTypes(): TypesResult {
  const schema = loadContentSchema() as JsonSchema;
  const defs = (schema.definitions ?? {}) as Record<string, JsonSchema>;

  const contentTypes: ContentTypeEntry[] = [];
  const subTypes: ContentTypeEntry[] = [];

  // ContentItemMap defines the YAML key → TypeScript type mapping
  const itemMap = defs[CONTENT_ITEM_MAP_KEY];
  const contentKeyToType: Record<string, string> = {};

  if (itemMap?.properties) {
    for (const [yamlKey, propDef] of Object.entries(itemMap.properties as Record<string, JsonSchema>)) {
      const ref = propDef.$ref as string | undefined;
      if (ref) {
        const typeName = ref.replace('#/definitions/', '');
        contentKeyToType[yamlKey] = typeName;
      }
    }
  }

  // Extract fields from a definition
  function extractFields(def: JsonSchema): FieldEntry[] {
    const props = def.properties as Record<string, JsonSchema> | undefined;
    const required = new Set((def.required as string[] | undefined) ?? []);
    if (!props) return [];
    return Object.entries(props).map(([name, propDef]) => ({
      name,
      type: resolveType(propDef, defs),
      required: required.has(name),
    }));
  }

  // Populate content types from the map
  for (const [yamlKey, typeName] of Object.entries(contentKeyToType)) {
    const def = defs[typeName];
    if (!def) continue;
    contentTypes.push({
      name: yamlKey,
      typeName,
      fields: extractFields(def),
    });
  }

  // Populate sub-types
  for (const typeName of SUB_TYPE_NAMES) {
    const def = defs[typeName];
    if (!def) continue;
    subTypes.push({
      name: typeName,
      typeName,
      fields: extractFields(def),
    });
  }

  return { contentTypes, subTypes };
}

function resolveType(propDef: JsonSchema, defs: Record<string, JsonSchema>): string {
  if (propDef.$ref) {
    return (propDef.$ref as string).replace('#/definitions/', '');
  }
  if (propDef.type === 'array') {
    const items = propDef.items as JsonSchema | undefined;
    if (items?.$ref) {
      return `${(items.$ref as string).replace('#/definitions/', '')}[]`;
    }
    return `${items?.type ?? 'unknown'}[]`;
  }
  if (Array.isArray(propDef.enum)) {
    return (propDef.enum as unknown[]).map(String).join(' | ');
  }
  if (propDef.anyOf || propDef.oneOf) {
    const variants = (propDef.anyOf ?? propDef.oneOf) as JsonSchema[];
    return variants
      .map((v) => (v.$ref ? (v.$ref as string).replace('#/definitions/', '') : String(v.type ?? 'unknown')))
      .join(' | ');
  }
  return String(propDef.type ?? 'unknown');
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
        console.log(
          `${'YAML key'.padEnd(20)}${'Type'.padEnd(25)}${'Required fields'}`
        );
        console.log('─'.repeat(72));
        for (const ct of result.contentTypes) {
          const required = ct.fields.filter((f) => f.required).map((f) => f.name).join(', ');
          console.log(
            `${chalk.cyan(ct.name.padEnd(20))}${ct.typeName.padEnd(25)}${required}`
          );
        }

        console.log(chalk.bold('\nSub-types\n'));
        for (const st of result.subTypes) {
          const fields = st.fields.map((f) => `${f.name}${f.required ? '' : '?'}: ${f.type}`).join(', ');
          console.log(`  ${chalk.cyan(st.typeName)} — ${fields}`);
        }
      });
    });
}
