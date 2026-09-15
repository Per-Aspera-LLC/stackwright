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
      allowRedirects: z
        .boolean()
        .optional()
        .describe(
          'When true, a scan that bounced off its requested route (e.g. an auth ' +
            'redirect to /login) no longer sinks the overall pass/fail verdict on ' +
            'its own. The bounced scan is still never reported as audited or as a ' +
            'pass — redirects are auth-coverage evidence, not audit coverage ' +
            '(default: false, swp-kwv8).'
        ),
    },
    async ({ projectRoot, baseUrl, slugs, darkMode, tags, failOn, allowRedirects }) => {
      try {
        const result = await testA11y(projectRoot, {
          baseUrl,
          pages: slugs?.join(','),
          darkMode,
          tags: tags?.join(','),
          failOn,
          allowRedirects,
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

const MAX_TARGETS_PER_VIOLATION = 3;

function formatA11yResultForMcp(result: A11yAuditResult): string {
  const { summary } = result;
  const lines: string[] = [];

  lines.push(`♿ Accessibility Audit — ${result.pass ? '✓ PASSED' : '✗ FAILED'}`);
  lines.push(`Base URL: ${result.baseUrl}`);
  lines.push(`Modes tested: ${result.modes.join(', ')}`);
  lines.push(
    `Pages: ${summary.total} scans (${result.slugs.length} page${result.slugs.length !== 1 ? 's' : ''} × ${result.modes.length} mode${result.modes.length !== 1 ? 's' : ''})`
  );
  lines.push(
    `Results: ${summary.passed} passed, ${summary.failed} failed` +
      (summary.redirected > 0 ? `, ${summary.redirected} redirected (not audited)` : '')
  );

  if (summary.violations > 0) {
    lines.push(`Total violations: ${summary.violations}`);
  }

  lines.push('');

  for (const pageResult of result.results) {
    if (pageResult.status === 'redirected') {
      // Never ✓ — a bounced scan is auth-coverage evidence, not an audit
      // result (R2.6 / swp-hyvg doctrine). It is structurally indistinguishable
      // from a real clean pass unless we say so explicitly, right here.
      lines.push(
        `↪ ${pageResult.slug} [${pageResult.mode}] REDIRECTED → ${pageResult.finalUrl} (not audited — auth coverage only)`
      );
      continue;
    }

    if (pageResult.status === 'error') {
      lines.push(
        `! ${pageResult.slug} [${pageResult.mode}] ERROR: ${pageResult.error ?? 'unknown error'}`
      );
      continue;
    }

    const icon = pageResult.pass ? '✓' : '✗';
    lines.push(`${icon} ${pageResult.slug} [${pageResult.mode}] → ${pageResult.finalUrl}`);

    if (!pageResult.pass) {
      for (const v of pageResult.failingViolations) {
        lines.push(
          `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help} (${v.nodeCount} node${v.nodeCount !== 1 ? 's' : ''})`
        );
        lines.push(`    ${v.helpUrl}`);
        const targets = v.nodes.slice(0, MAX_TARGETS_PER_VIOLATION);
        for (const node of targets) {
          lines.push(`    · ${node.target.join(' ')}`);
        }
      }
    }
  }

  if (summary.redirected > 0) {
    lines.push('');
    lines.push(
      'Redirected scans are not coverage — they prove auth-bounce behavior, not that ' +
        'the requested page was measured. Investigate the redirect before trusting any ' +
        '"clean" result on these routes.'
    );
  }

  if (!result.pass) {
    lines.push('');
    lines.push('Fix the violations above, then re-run stackwright_test_a11y to verify.');
  }

  lines.push('');
  lines.push('```json');
  lines.push(
    JSON.stringify({
      scans: result.results.map((r) => ({
        slug: r.slug,
        mode: r.mode,
        status: r.status,
        finalUrl: r.finalUrl,
        violations: r.violations.length,
      })),
      summary: {
        audited: summary.passed + summary.failed,
        redirected: summary.redirected,
        failed: summary.failed,
      },
    })
  );
  lines.push('```');

  return lines.join('\n');
}
