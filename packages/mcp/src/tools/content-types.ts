import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getTypes } from '@stackwright/cli';
import type { ContentTypeEntry } from '@stackwright/cli';

function formatContentType(ct: ContentTypeEntry): string {
  const lines: string[] = [`  ${ct.name} (${ct.typeName})`];
  for (const f of ct.fields) {
    lines.push(`    ${f.name}${f.required ? '' : '?'}: ${f.type}`);
  }
  return lines.join('\n');
}

export function registerContentTypeTools(server: McpServer): void {
  server.tool(
    'stackwright_get_content_types',
    'List all available Stackwright content types with their fields. Call this before writing any YAML content to know what keys and types are valid.',
    {},
    async () => {
      const result = getTypes();

      const contentSection = [
        'CONTENT TYPES (use as keys inside content_items[]):',
        ...result.contentTypes.map(formatContentType),
      ].join('\n');

      const subSection = [
        'SUB-TYPES (used as field values within content types):',
        ...result.subTypes.map(formatContentType),
      ].join('\n');

      return {
        content: [
          {
            type: 'text',
            text: [contentSection, subSection].join('\n\n'),
          },
        ],
      };
    }
  );
}
