import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { renderPage, probeServer, closeBrowser } from '../renderer/page-renderer.js';

const DEFAULT_BASE_URL = 'http://localhost:3000';

export function registerRenderTools(server: McpServer): void {
  // --- stackwright_check_dev_server ---
  server.tool(
    'stackwright_check_dev_server',
    'Check if a Stackwright dev server is running and reachable. Call this before using render tools. If the server is not running, tell the user to start it with `pnpm dev` in their project directory.',
    {
      baseUrl: z
        .string()
        .optional()
        .default(DEFAULT_BASE_URL)
        .describe('Base URL to check (default: http://localhost:3000)'),
    },
    async ({ baseUrl }) => {
      const reachable = await probeServer(baseUrl);
      if (reachable) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `✓ Dev server is running at ${baseUrl}. You can now use stackwright_render_page to see your pages.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text' as const,
            text: `✗ No server detected at ${baseUrl}. The user needs to start their dev server first:\n\n  cd <project-dir>\n  pnpm dev\n\nOnce it's running, try again.`,
          },
        ],
        isError: true,
      };
    }
  );

  // --- stackwright_render_page ---
  server.tool(
    'stackwright_render_page',
    `Render a Stackwright page and return a screenshot image. Use this to visually verify how a page looks after writing or editing content.

IMPORTANT: A dev server must be running (check with stackwright_check_dev_server first). After writing/editing page YAML, the dev server's hot reload will pick up changes automatically.

Returns a PNG screenshot of the rendered page. Use this to verify:
- Brand consistency (colors, typography, spacing match the theme)
- Content hierarchy and visual balance
- Responsive layout at different viewport sizes
- Overall visual quality before committing changes`,
    {
      baseUrl: z
        .string()
        .optional()
        .default(DEFAULT_BASE_URL)
        .describe('Base URL of the running dev server (default: http://localhost:3000)'),
      slug: z
        .string()
        .describe('Page slug to render (e.g. "/" for home, "/about", "/pricing")'),
      viewport: z
        .object({
          width: z.number().min(320).max(3840).default(1280),
          height: z.number().min(480).max(2160).default(720),
        })
        .optional()
        .describe('Viewport size. Default: 1280x720 (desktop). Use 375x667 for mobile.'),
      fullPage: z
        .boolean()
        .optional()
        .default(true)
        .describe('Capture full scrollable page (true) or just the viewport (false)'),
      format: z
        .enum(['png', 'jpeg'])
        .optional()
        .default('png')
        .describe('Image format. Use jpeg for smaller file size.'),
    },
    async ({ baseUrl, slug, viewport, fullPage, format }) => {
      // Check server is reachable
      const reachable = await probeServer(baseUrl);
      if (!reachable) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No dev server detected at ${baseUrl}. Start it with \`pnpm dev\` first, or specify the correct URL.`,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await renderPage({
          baseUrl,
          slug,
          viewport: viewport ?? { width: 1280, height: 720 },
          fullPage: fullPage ?? true,
          format: format ?? 'png',
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `Rendered "${slug}" (${result.viewport.width}x${result.viewport.height}, ${result.renderTimeMs}ms):`,
            },
            {
              type: 'image' as const,
              data: result.image,
              mimeType: result.mimeType,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Render failed for "${slug}": ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // --- stackwright_render_diff ---
  server.tool(
    'stackwright_render_diff',
    `Render a before/after comparison of a page. Takes a screenshot of the current page, then the caller should write the new YAML and call stackwright_render_page again to see the "after" state.

This tool captures the "before" snapshot. Workflow:
1. Call stackwright_render_diff to capture the current state
2. Write your YAML changes (stackwright_write_page or stackwright_compose_site)
3. Wait a moment for the dev server to hot-reload
4. Call stackwright_render_page to see the "after" state
5. Compare the two images to evaluate your changes

Use this for brand-critical changes where visual regression matters.`,
    {
      baseUrl: z
        .string()
        .optional()
        .default(DEFAULT_BASE_URL)
        .describe('Base URL of the running dev server'),
      slug: z
        .string()
        .describe('Page slug to snapshot'),
      viewport: z
        .object({
          width: z.number().min(320).max(3840).default(1280),
          height: z.number().min(480).max(2160).default(720),
        })
        .optional()
        .describe('Viewport size'),
      fullPage: z
        .boolean()
        .optional()
        .default(true)
        .describe('Capture full scrollable page'),
    },
    async ({ baseUrl, slug, viewport, fullPage }) => {
      const reachable = await probeServer(baseUrl);
      if (!reachable) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No dev server detected at ${baseUrl}. Start it with \`pnpm dev\` first.`,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await renderPage({
          baseUrl,
          slug,
          viewport: viewport ?? { width: 1280, height: 720 },
          fullPage: fullPage ?? true,
          format: 'png',
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: `📸 "Before" snapshot captured for "${slug}" (${result.viewport.width}x${result.viewport.height}, ${result.renderTimeMs}ms).\n\nNow make your YAML changes, wait for hot-reload, then call stackwright_render_page to capture the "after" state.`,
            },
            {
              type: 'image' as const,
              data: result.image,
              mimeType: result.mimeType,
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Snapshot failed for "${slug}": ${(err as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Clean up browser resources. Call from server shutdown handler.
 */
export { closeBrowser } from '../renderer/page-renderer.js';
