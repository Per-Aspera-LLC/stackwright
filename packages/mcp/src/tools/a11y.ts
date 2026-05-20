import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { testA11y } from '@stackwright/cli';
import type { A11yAuditResult } from '@stackwright/cli';

export function registerA11yTools(server: McpServer): void {
  server.tool(
    'stackwright_test_a11y',
    [
      'Run a WCAG 2.1 AA accessibility audit against a running Stackwright dev server.',
      'Tests pages in both light and dark color modes using axe-core.',
      'Auto-discovers all pages from the project when no slugs are provided.',
      'Requires a running dev server (pnpm dev), playwright, and @axe-core/playwright.',
    ].join(' '),
    {
      projectRoot: z.string().describe('Absolute path to the root of the Stackwright project'),
      baseUrl: z.string().optional().describe('Dev server URL (default: http://localhost:3000)'),
      slugs: z
        .array(z.string())
        .optional()
        .describe('Page slugs to audit (default: auto-discover all pages)'),
      darkMode: z
        .boolean()
        .optional()
        .describe('Test dark mode in addition to light mode (default: true)'),
      tags: z
        .array(z.string())
        .optional()
        .describe('axe-core rule tags to test (default: wcag2a, wcag2aa, wcag21a, wcag21aa)'),
      failOn: z
        .enum(['minor', 'moderate', 'serious', 'critical'])
        .optional()
        .describe('Minimum impact level that fails the audit (default: serious)'),
    },
    async ({ projectRoot, baseUrl, slugs, darkMode, tags, failOn }) => {
      try {
        const result = await testA11y(projectRoot, {
          baseUrl,
          pages: slugs?.join(','),
          darkMode,
          tags: tags?.join(','),
          failOn,
        });

        const text = formatA11yResultForMcp(result);
        return {
          content: [{ type: 'text', text }],
          isError: !result.pass,
        };
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        const message = (err as Error).message;
        const userMessage =
          code === 'NO_DEV_SERVER'
            ? `No dev server running at ${baseUrl ?? 'http://localhost:3000'}. Start it with: pnpm dev`
            : code === 'MISSING_PLAYWRIGHT'
              ? 'Playwright is not installed. Run: pnpm add -D playwright && pnpm exec playwright install chromium'
              : code === 'MISSING_AXE'
                ? 'axe-core is not installed. Run: pnpm add -D @axe-core/playwright'
                : code === 'NO_PAGES'
                  ? 'No pages found. Check that the project has been prebuilt (pnpm prebuild).'
                  : `Accessibility audit failed: ${message}`;
        return {
          content: [{ type: 'text', text: userMessage }],
          isError: true,
        };
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Text formatter for MCP output
// ---------------------------------------------------------------------------

function formatA11yResultForMcp(result: A11yAuditResult): string {
  const { summary } = result;
  const lines: string[] = [];

  lines.push(`♿ Accessibility Audit — ${result.pass ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`Base URL: ${result.baseUrl}`);
  lines.push(`Modes tested: ${result.modes.join(', ')}`);
  lines.push(
    `Pages: ${summary.total} scans (${result.slugs.length} page${result.slugs.length !== 1 ? 's' : ''} × ${result.modes.length} mode${result.modes.length !== 1 ? 's' : ''})`
  );
  lines.push(`Results: ${summary.passed} passed, ${summary.failed} failed`);

  if (summary.violations > 0) {
    lines.push(`Total violations: ${summary.violations}`);
  }

  lines.push('');

  for (const pageResult of result.results) {
    const icon = pageResult.pass ? '✓' : '✗';
    lines.push(`${icon} ${pageResult.slug} [${pageResult.mode}]`);

    if (!pageResult.pass) {
      for (const v of pageResult.failingViolations) {
        lines.push(
          `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help} (${v.nodeCount} node${v.nodeCount !== 1 ? 's' : ''})`
        );
        lines.push(`    ${v.helpUrl}`);
      }
    }
  }

  if (!result.pass) {
    lines.push('');
    lines.push('Fix the violations above, then re-run stackwright_test_a11y to verify.');
  }

  return lines.join('\n');
}
