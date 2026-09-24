import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { pageContentSchema } from '../utils/schema-loader';
import { outputResult } from '../utils/json-output';
import { type AnySchema, buildContentTypeModels } from '../agent-docs/introspect';
import { PAGE_AUTHORING_SKILL_NAME } from '../agent-docs/skill';

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

const INTERFACE_START_MARKER = '<!-- stackwright:interface-table:start -->';
const INTERFACE_END_MARKER = '<!-- stackwright:interface-table:end -->';

// ---------------------------------------------------------------------------
// Content-type pointer block (execution-plan Phase 2.3)
//
// The full content-type reference tables moved into the generated
// `stackwright-page-authoring` skill (Phase 2.1) — keeping them inline in
// AGENTS.md was always-in-context prompt mass. The generator now emits a
// short pointer. The valid-key inventory stays schema-derived so the CI
// drift check still fails when a content type is added/removed without
// regenerating docs AND skill.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Interface contracts table — documents the TypeScript interface contracts
// defined in @stackwright/types. These are not Zod schemas so they are
// described via a static config rather than runtime introspection.
// ---------------------------------------------------------------------------

interface InterfaceField {
  name: string;
  type: string;
  optional: boolean;
}

interface InterfaceContract {
  name: string;
  kind: 'interface' | 'type';
  description: string;
  fields: InterfaceField[];
}

const INTERFACE_CONTRACTS: InterfaceContract[] = [
  {
    name: 'CollectionProvider',
    kind: 'interface',
    description:
      'Core runtime contract for Stackwright data backends. Every backend (file, S3, Contentful, OpenAPI, etc.) implements this interface.',
    fields: [
      { name: 'list(collection, opts?)', type: 'Promise<CollectionListResult>', optional: false },
      { name: 'get(collection, slug)', type: 'Promise<CollectionEntry | null>', optional: false },
      { name: 'collections()', type: 'Promise<string[]>', optional: false },
    ],
  },
  {
    name: 'CollectionEntry',
    kind: 'interface',
    description: 'A single entry returned by a CollectionProvider.',
    fields: [
      { name: 'slug', type: 'string', optional: false },
      { name: '[key: string]', type: 'unknown', optional: false },
    ],
  },
  {
    name: 'CollectionListOptions',
    kind: 'interface',
    description: 'Options for filtering, sorting and paginating collection list results.',
    fields: [
      { name: 'limit', type: 'number', optional: true },
      { name: 'offset', type: 'number', optional: true },
      { name: 'sort', type: 'string', optional: true },
      { name: 'filter', type: 'Record<string, unknown>', optional: true },
    ],
  },
  {
    name: 'CollectionListResult',
    kind: 'interface',
    description: 'Result shape returned by CollectionProvider.list().',
    fields: [
      { name: 'entries', type: 'CollectionEntry[]', optional: false },
      { name: 'total', type: 'number', optional: false },
    ],
  },
  {
    name: 'ScaffoldHookContext',
    kind: 'interface',
    description:
      "Mutable context object passed to every scaffold hook handler. Earlier hooks' changes are visible to later hooks.",
    fields: [
      { name: 'targetDir', type: 'string', optional: false },
      { name: 'projectName', type: 'string', optional: false },
      { name: 'siteTitle', type: 'string', optional: false },
      { name: 'themeId', type: 'string', optional: false },
      { name: 'packageJson', type: 'Record<string, unknown>', optional: false },
      { name: 'dependencyMode', type: "'workspace' | 'standalone'", optional: false },
      { name: 'codePuppyConfig', type: 'Record<string, unknown>', optional: true },
      { name: 'pages', type: 'string[]', optional: true },
      { name: 'install', type: 'boolean', optional: true },
      { name: '[key: string]', type: 'unknown', optional: true },
    ],
  },
  {
    name: 'ScaffoldHook',
    kind: 'interface',
    description:
      'A single scaffold hook registration. Pass to registerScaffoldHook() from @stackwright/scaffold-core.',
    fields: [
      { name: 'type', type: 'ScaffoldHookType', optional: false },
      { name: 'name', type: 'string', optional: false },
      { name: 'handler', type: 'HookHandler', optional: false },
      { name: 'priority', type: 'number', optional: true },
      { name: 'critical', type: 'boolean', optional: true },
    ],
  },
  {
    name: 'HookHandler',
    kind: 'type',
    description: 'Function signature for scaffold hook handlers.',
    fields: [
      { name: '(context: ScaffoldHookContext)', type: 'Promise<void> | void', optional: false },
    ],
  },
  {
    name: 'ScaffoldHookType',
    kind: 'type',
    description:
      'Lifecycle point union. Execution order: preScaffold → preInstall → postInstall → postScaffold.',
    fields: [
      {
        name: 'values',
        type: "'preScaffold' | 'preInstall' | 'postInstall' | 'postScaffold'",
        optional: false,
      },
    ],
  },
];

function generateInterfaceTable(): string {
  const lines = [
    'All interface contracts are defined in `@stackwright/types` and re-exported from `@stackwright/collections`, `@stackwright/hooks-registry`, and `@stackwright/scaffold-core` for backward compatibility.',
    '',
    '| Interface / Type | Kind | Fields / Signature |',
    '|---|---|---|',
  ];

  for (const contract of INTERFACE_CONTRACTS) {
    const fieldList = contract.fields
      .map((f) => {
        const namePart = f.optional ? `\`${f.name}\`?` : `\`${f.name}\``;
        return `${namePart} (${f.type})`;
      })
      .join(', ');
    lines.push(`| \`${contract.name}\` | ${contract.kind} | ${fieldList} |`);
  }

  lines.push('');
  lines.push('**Import paths (all equivalent):**');
  lines.push('- `CollectionProvider` — `@stackwright/types` · `@stackwright/collections`');
  lines.push(
    '- `ScaffoldHookContext`, `ScaffoldHook`, `HookHandler`, `ScaffoldHookType` — `@stackwright/types` · `@stackwright/hooks-registry` · `@stackwright/scaffold-core`'
  );

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Build the full generated block (content between the markers)
// ---------------------------------------------------------------------------

function buildGeneratedBlock(): string {
  const models = buildContentTypeModels(pageContentSchema as unknown as AnySchema, new Map());
  const keys = models.map((m) => `\`${m.key}\``).join(', ');

  return [
    `This reference now lives in the generated \`${PAGE_AUTHORING_SKILL_NAME}\` skill — activate that skill instead of reading tables here.`,
    '',
    `- **Skill:** \`${PAGE_AUTHORING_SKILL_NAME}\` (\`skills/${PAGE_AUTHORING_SKILL_NAME}/SKILL.md\`; regenerate with \`pnpm stackwright -- generate-skills\`)`,
    '- **Covers:** per-content-type required/optional fields, enum values, sub-type shapes (TextBlock, ButtonContent, MediaItem, …), TypographyVariant values, and minimal YAML examples.',
    `- **Valid \`type\` keys:** ${keys}`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// File update logic
// ---------------------------------------------------------------------------

function updateMarkerBlock(
  filePath: string,
  startMarker: string,
  endMarker: string,
  newBlock: string
): 'updated' | 'up-to-date' | 'no-markers' | 'not-found' {
  if (!fs.existsSync(filePath)) return 'not-found';

  const current = fs.readFileSync(filePath, 'utf-8');
  const startIdx = current.indexOf(startMarker);
  const endIdx = current.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) return 'no-markers';

  const before = current.slice(0, startIdx + startMarker.length);
  const after = current.slice(endIdx);
  const updated = `${before}\n${newBlock}\n${after}`;

  if (updated === current) return 'up-to-date';

  fs.writeFileSync(filePath, updated, 'utf-8');
  return 'updated';
}

function updateAgentsMd(
  filePath: string,
  newBlock: string
): 'updated' | 'up-to-date' | 'no-markers' | 'not-found' {
  return updateMarkerBlock(filePath, START_MARKER, END_MARKER, newBlock);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateAgentDocs(root: string = process.cwd()): GenerateAgentDocsResult {
  const newBlock = buildGeneratedBlock();
  const newInterfaceBlock = generateInterfaceTable();

  const targetFiles = [
    path.join(root, 'AGENTS.md'),
    path.join(root, 'examples', 'stackwright-docs', 'AGENTS.md'),
  ];

  const filesUpdated: string[] = [];
  const filesSkipped: string[] = [];
  const errors: string[] = [];

  for (const filePath of targetFiles) {
    // Update content-type-table
    const result = updateAgentsMd(filePath, newBlock);
    switch (result) {
      case 'updated':
        if (!filesUpdated.includes(filePath)) filesUpdated.push(filePath);
        break;
      case 'up-to-date':
        if (!filesUpdated.includes(filePath) && !filesSkipped.includes(filePath))
          filesSkipped.push(filePath);
        break;
      case 'no-markers':
        errors.push(`Content-type-table markers not found in: ${filePath}`);
        break;
      case 'not-found':
        errors.push(`File not found: ${filePath}`);
        break;
    }

    // Update interface-table
    const interfaceResult = updateMarkerBlock(
      filePath,
      INTERFACE_START_MARKER,
      INTERFACE_END_MARKER,
      newInterfaceBlock
    );
    switch (interfaceResult) {
      case 'updated': {
        if (!filesUpdated.includes(filePath)) filesUpdated.push(filePath);
        // Remove from skipped if it was added there by the first pass
        const skipIdx = filesSkipped.indexOf(filePath);
        if (skipIdx !== -1) filesSkipped.splice(skipIdx, 1);
        break;
      }
      case 'up-to-date':
        // already tracked correctly
        break;
      case 'no-markers':
        errors.push(`Interface-table markers not found in: ${filePath}`);
        break;
      case 'not-found':
        // already reported above
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
