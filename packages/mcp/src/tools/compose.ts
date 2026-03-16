import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { composeSite } from '@stackwright/cli';

/**
 * Resolve the list of existing collection names in a project.
 * Returns an empty array if the content directory doesn't exist.
 */
function detectCollections(projectRoot: string): string[] {
  try {
    const contentDir = path.join(projectRoot, 'content');
    if (!fs.existsSync(contentDir)) return [];

    return fs
      .readdirSync(contentDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

export function registerComposeTools(server: McpServer): void {
  server.tool(
    'stackwright_compose_site',
    `Validate and write an entire Stackwright site atomically — site config + all pages in one operation.

Use this tool when generating a complete new site or making sweeping changes across multiple pages. It provides:
- Per-page schema validation (same as stackwright_write_page)
- Site config schema validation (same as stackwright_write_site_config)
- PLUS cross-page semantic validation that individual tools cannot perform:
  • Navigation hrefs must point to pages that exist (error — blocks write)
  • Orphan pages without navigation entries (warning)
  • Button hrefs pointing to non-existent internal pages (warning)
  • Collection list sources referencing non-existent collections (warning)
  • Duplicate meta.title across pages (warning)
  • Theme color references that don't match the palette (warning)

If ANY error is found, NOTHING is written. Warnings are reported but don't block the write.

For editing individual pages on an existing site, use stackwright_write_page instead.`,
    {
      projectRoot: z
        .string()
        .refine((p) => path.isAbsolute(p), 'projectRoot must be an absolute path')
        .describe('Absolute path to the root of the Stackwright project'),
      siteConfig: z.string().max(1_000_000).describe('Full YAML content for stackwright.yml'),
      pages: z
        .record(
          z.string().max(200).describe('Page slug (e.g. "/" for root, "about", "pricing")'),
          z.string().max(1_000_000).describe('Full YAML content for the page')
        )
        .refine((obj) => Object.keys(obj).length <= 500, 'Maximum 500 pages per compose operation')
        .describe(
          'Map of page slug to YAML content. Use "/" or "" for the root page. Use bare slugs like "about" for other pages.'
        ),
    },
    async ({ projectRoot, siteConfig, pages }) => {
      try {
        // Auto-detect existing collections for cross-validation
        const existingCollections = detectCollections(projectRoot);

        const result = composeSite(projectRoot, siteConfig, pages, {
          existingCollections: existingCollections.length > 0 ? existingCollections : undefined,
        });

        const lines: string[] = [
          `✓ Site composed successfully at ${projectRoot}`,
          `  Site config: ${result.siteConfigPath}`,
        ];

        if (result.pagesCreated.length > 0) {
          lines.push(`  Pages created (${result.pagesCreated.length}):`);
          for (const p of result.pagesCreated) {
            lines.push(`    + ${p}`);
          }
        }

        if (result.pagesUpdated.length > 0) {
          lines.push(`  Pages updated (${result.pagesUpdated.length}):`);
          for (const p of result.pagesUpdated) {
            lines.push(`    ~ ${p}`);
          }
        }

        if (result.warnings.length > 0) {
          lines.push('');
          lines.push(`  ⚠ ${result.warnings.length} warning(s):`);
          for (const w of result.warnings) {
            lines.push(`    [${w.source}] (${w.category}) ${w.message}`);
          }
        }

        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        const message = (err as Error).message;

        if (code === 'COMPOSITION_INVALID') {
          const validation = (err as any).validation;
          const lines = [`Site composition failed — ${validation?.errors?.length ?? 0} error(s):`];

          if (validation?.errors) {
            for (const e of validation.errors) {
              lines.push(`  ✗ [${e.source}] (${e.category}) ${e.message}`);
            }
          }

          if (validation?.warnings?.length > 0) {
            lines.push('');
            lines.push(`  Additionally, ${validation.warnings.length} warning(s) were found:`);
            for (const w of validation.warnings) {
              lines.push(`    [${w.source}] (${w.category}) ${w.message}`);
            }
          }

          lines.push('');
          lines.push('No files were written. Fix the errors above and try again.');

          return {
            content: [{ type: 'text', text: lines.join('\n') }],
            isError: true,
          };
        }

        return {
          content: [{ type: 'text', text: `Error composing site: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
