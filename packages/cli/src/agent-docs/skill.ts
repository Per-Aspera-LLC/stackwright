/**
 * Skill emission — renders the "stackwright-page-authoring" code-puppy skill
 * from live Zod schemas.
 *
 * Skill file format matches installed code-puppy skills exactly:
 * `<skill-name>/SKILL.md` with YAML frontmatter (name, description, version,
 * author, tags) followed by a markdown body.
 *
 * Output is deterministic: stable ordering (schema declaration order), no
 * timestamps — so drift-checking (`generate-skills --check`) works.
 */

import * as yaml from 'js-yaml';
import {
  textBlockSchema,
  buttonContentSchema,
  mediaItemSchema,
  imageContentSchema,
  iconContentSchema,
  carouselItemSchema,
  timelineItemSchema,
  gridColumnSchema,
  typographyVariantSchema,
} from '@stackwright/types';
import { pageContentSchema } from '../utils/schema-loader';
import {
  type AnySchema,
  type SchemaNameMap,
  buildContentTypeModels,
  extractFields,
  getContentItemVariants,
  literalTypeKey,
  resolveSchema,
  synthValue,
} from './introspect';

// ---------------------------------------------------------------------------
// OSS schema name registry — shared by generate-agent-docs and generate-skills
// ---------------------------------------------------------------------------

export const OSS_SCHEMA_NAMES: SchemaNameMap = new Map<object, string>([
  [textBlockSchema as object, 'TextBlock'],
  [buttonContentSchema as object, 'ButtonContent'],
  [mediaItemSchema as object, 'MediaItem'],
  [imageContentSchema as object, 'ImageContent'],
  [iconContentSchema as object, 'IconContent'],
  [carouselItemSchema as object, 'CarouselItem'],
  [timelineItemSchema as object, 'TimelineItem'],
  [gridColumnSchema as object, 'GridColumn'],
  [typographyVariantSchema as object, 'TypographyVariant'],
]);

// ---------------------------------------------------------------------------
// Skill file rendering
// ---------------------------------------------------------------------------

export const PAGE_AUTHORING_SKILL_NAME = 'stackwright-page-authoring';

/** Bump when the emitted structure changes meaningfully. Never a timestamp. */
export const PAGE_AUTHORING_SKILL_VERSION = '1.0.0';

export interface SkillFrontmatter {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
}

/**
 * Render a complete SKILL.md: YAML frontmatter + markdown sections joined by
 * blank lines. Shared by the OSS emitter and the Pro extension emitter (which
 * appends its own sections to the OSS ones).
 */
export function renderSkillMd(frontmatter: SkillFrontmatter, sections: string[]): string {
  const fm = [
    '---',
    `name: ${frontmatter.name}`,
    `description: ${frontmatter.description}`,
    `version: ${frontmatter.version}`,
    `author: ${frontmatter.author}`,
    'tags:',
    ...frontmatter.tags.map((t) => `  - ${t}`),
    '---',
  ].join('\n');
  return `${fm}\n\n${sections.join('\n\n')}\n`;
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function fieldTable(fields: ReturnType<typeof extractFields>): string {
  const lines = ['| Field | Type | Required |', '|---|---|---|'];
  for (const f of fields) {
    lines.push(`| \`${f.name}\` | ${f.type} | ${f.required ? 'yes' : 'no'} |`);
  }
  return lines.join('\n');
}

/** Deterministic minimal YAML example for one content-item variant. */
export function synthYamlExample(schema: AnySchema): string {
  const value = synthValue(schema);
  // A content item is authored as a list entry under `content_items`.
  return yaml.dump([value], { indent: 2, lineWidth: 100, noRefs: true }).trimEnd();
}

/**
 * Build the OSS skill body sections. Exported separately so the Pro extension
 * emitter can compose (OSS sections + Pro sections) into a single artifact
 * without forking any of this content.
 */
export function buildOssPageAuthoringSections(): string[] {
  const pageSchema = pageContentSchema as unknown as AnySchema;
  const models = buildContentTypeModels(pageSchema, OSS_SCHEMA_NAMES);

  const sections: string[] = [];

  sections.push(
    [
      '# Stackwright Page Authoring',
      '',
      '> Auto-generated from the live `@stackwright/types` Zod schemas by',
      '> `stackwright generate-skills`. Do NOT edit by hand — regenerate instead.',
    ].join('\n')
  );

  sections.push(
    [
      '## Authoring rules',
      '',
      '- Page content lives under `content.content_items` in page YAML files.',
      '- `content_items` is a discriminated union on `type` — every item MUST carry a `type` field',
      '  set to one of the YAML keys listed below.',
      '- All content types inherit from `BaseContent`: `label` (required), `color` (optional),',
      '  `background` (optional).',
      '- The schemas are strict: unknown fields are rejected at validation time. Use exactly the',
      '  field names documented here.',
      '',
      `Valid \`type\` keys: ${models.map((m) => `\`${m.key}\``).join(', ')}`,
    ].join('\n')
  );

  const typeSections = ['## Content types'];
  for (const model of models) {
    const full = model.fields;
    typeSections.push(
      [
        `### \`${model.key}\``,
        '',
        fieldTable(full.filter((f) => f.name !== 'type')),
        '',
        'Example:',
        '',
        '```yaml',
        synthYamlExample(findVariantByKey(pageSchema, model.key)),
        '```',
      ].join('\n')
    );
  }
  sections.push(typeSections.join('\n\n'));

  sections.push(buildSubTypeSection());

  const typographyValues = Object.keys(
    (typographyVariantSchema as unknown as AnySchema).def.entries ?? {}
  );
  sections.push(
    [
      '## Enums',
      '',
      `**TypographyVariant** (used by \`textSize\`): ${typographyValues.map((v) => `\`${v}\``).join(' ')}`,
    ].join('\n')
  );

  return sections;
}

function findVariantByKey(pageSchema: AnySchema, key: string): AnySchema {
  // Models don't carry the schema reference; re-walk the union.
  // (Small n, generation-time only — clarity over cleverness.)
  const variant = getContentItemVariants(pageSchema).find((v) => literalTypeKey(v) === key);
  if (!variant) throw new Error(`Content type variant not found for key: ${key}`);
  return variant;
}

function buildSubTypeSection(): string {
  const subTypes: Array<{ name: string; schema: AnySchema }> = [
    { name: 'TextBlock', schema: textBlockSchema as unknown as AnySchema },
    { name: 'ButtonContent', schema: buttonContentSchema as unknown as AnySchema },
    { name: 'MediaItem', schema: mediaItemSchema as unknown as AnySchema },
    { name: 'ImageContent', schema: imageContentSchema as unknown as AnySchema },
    { name: 'IconContent', schema: iconContentSchema as unknown as AnySchema },
    { name: 'CarouselItem', schema: carouselItemSchema as unknown as AnySchema },
    { name: 'TimelineItem', schema: timelineItemSchema as unknown as AnySchema },
    { name: 'GridColumn', schema: gridColumnSchema as unknown as AnySchema },
  ];

  const parts = ['## Sub-type reference'];
  for (const { name, schema } of subTypes) {
    const resolved = resolveSchema(schema);
    const isUnion = resolved.def.type === 'discriminated_union' || resolved.def.type === 'union';
    if (isUnion && resolved.def.options) {
      const members = (resolved.def.options as AnySchema[]).map((o) => {
        const r = resolveSchema(o);
        if (OSS_SCHEMA_NAMES.has(r as object)) return `\`${OSS_SCHEMA_NAMES.get(r as object)!}\``;
        const key = literalMemberKey(r);
        return key ? `\`type: "${key}"\`` : 'object';
      });
      parts.push(
        [
          `### \`${name}\``,
          '',
          `Discriminated union: ${members.join(' | ')}. The \`type\` field is required and acts as the discriminator.`,
        ].join('\n')
      );
    } else {
      parts.push(
        [`### \`${name}\``, '', fieldTable(extractFields(schema, OSS_SCHEMA_NAMES))].join('\n')
      );
    }
  }
  return parts.join('\n\n');
}

function literalMemberKey(resolved: AnySchema): string | null {
  const typeField = (resolved.def.shape as Record<string, AnySchema> | undefined)?.type;
  if (!typeField) return null;
  const tf = resolveSchema(typeField);
  if (tf.def.type !== 'literal') return null;
  const v = tf.def.values ? (tf.def.values as unknown[])[0] : tf.def.value;
  return String(v);
}

// ---------------------------------------------------------------------------
// Full OSS skill artifact
// ---------------------------------------------------------------------------

export function buildOssPageAuthoringSkill(): string {
  return renderSkillMd(
    {
      name: PAGE_AUTHORING_SKILL_NAME,
      description:
        'Use before writing or editing Stackwright page YAML (content_items). Generated reference for every core content type — required/optional fields, enum values, sub-type shapes, and minimal YAML examples.',
      version: PAGE_AUTHORING_SKILL_VERSION,
      author: 'stackwright (generated)',
      tags: ['stackwright', 'yaml', 'page-authoring', 'content-types'],
    },
    buildOssPageAuthoringSections()
  );
}
