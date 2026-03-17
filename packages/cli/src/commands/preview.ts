import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { detectProject } from '../utils/project-detector';
import { outputResult, outputError, formatError, getErrorCode } from '../utils/json-output';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PreviewOptions {
  output?: string;
  baseUrl?: string;
  width?: string;
  height?: string;
  fullPage?: boolean;
  format?: string;
  json?: boolean;
}

export interface PreviewResult {
  slug: string;
  outputPath: string;
  viewport: { width: number; height: number };
  renderTimeMs: number;
}

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

/**
 * Preview a page by rendering it to a screenshot file.
 *
 * Requires:
 * - A running dev server (pnpm dev)
 * - Playwright installed (optional peer dependency)
 */
export async function preview(
  projectRoot: string,
  slug: string,
  opts: PreviewOptions
): Promise<PreviewResult> {
  const baseUrl = opts.baseUrl ?? 'http://localhost:3000';
  const width = opts.width ? parseInt(opts.width, 10) : 1280;
  const height = opts.height ? parseInt(opts.height, 10) : 720;
  const fullPage = opts.fullPage !== false;
  const format = (opts.format === 'jpeg' ? 'jpeg' : 'png') as 'png' | 'jpeg';

  // Dynamic import — playwright is an optional peer dependency
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chromium: any;
  try {
    const moduleName = 'playwright';
    const pw = await import(moduleName);
    chromium = pw.chromium;
  } catch {
    const err = new Error(
      'The preview command requires Playwright.\nInstall it with: pnpm add -D playwright'
    );
    (err as NodeJS.ErrnoException).code = 'MISSING_PLAYWRIGHT';
    throw err;
  }

  // Check dev server is running
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(baseUrl, { signal: controller.signal });
  } catch {
    const err = new Error(
      `No dev server detected at ${baseUrl}.\nStart it with: pnpm dev`
    );
    (err as NodeJS.ErrnoException).code = 'NO_DEV_SERVER';
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const startTime = Date.now();
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });

    const url = new URL(
      slug.startsWith('/') ? slug : `/${slug}`,
      baseUrl
    ).toString();

    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    if (!response || response.status() >= 400) {
      const err = new Error(
        `Page returned HTTP ${response?.status() ?? 'no response'} for ${url}`
      );
      (err as NodeJS.ErrnoException).code = 'PAGE_ERROR';
      throw err;
    }

    await page.waitForTimeout(500);

    const defaultName = `preview-${slug.replace(/\//g, '-').replace(/^-/, '') || 'home'}.${format}`;
    const outputPath = path.resolve(projectRoot, opts.output ?? defaultName);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    await page.screenshot({ path: outputPath, fullPage, type: format });
    await page.close();

    return {
      slug,
      outputPath,
      viewport: { width, height },
      renderTimeMs: Date.now() - startTime,
    };
  } finally {
    await browser.close();
  }
}

// ---------------------------------------------------------------------------
// CLI registration
// ---------------------------------------------------------------------------

export function registerPreview(program: Command): void {
  program
    .command('preview [slug]')
    .description(
      'Render a page to a screenshot file. Requires a running dev server (pnpm dev) and Playwright.'
    )
    .option('-o, --output <path>', 'Output file path (default: preview-<slug>.png)')
    .option('--base-url <url>', 'Dev server URL (default: http://localhost:3000)')
    .option('--width <pixels>', 'Viewport width (default: 1280)')
    .option('--height <pixels>', 'Viewport height (default: 720)')
    .option('--no-full-page', 'Capture only the viewport, not the full scrollable page')
    .option('--format <fmt>', 'Image format: png or jpeg (default: png)')
    .option('--json', 'Output machine-readable JSON')
    .action(async (slug: string | undefined, opts: PreviewOptions) => {
      const resolvedSlug = slug ?? '/';
      const json = Boolean(opts.json);

      try {
        const project = detectProject();
        const result = await preview(project.root, resolvedSlug, opts);
        outputResult(result, { json }, () => {
          console.log(
            chalk.green(
              `✓ Screenshot saved: ${path.relative(process.cwd(), result.outputPath)}`
            )
          );
          console.log(
            chalk.blue(
              `  ${result.viewport.width}×${result.viewport.height} · ${result.renderTimeMs}ms`
            )
          );
        });
      } catch (err) {
        const code = getErrorCode(err);
        if (code === 'NO_DEV_SERVER' || code === 'MISSING_PLAYWRIGHT') {
          outputError(formatError(err), code, { json });
        } else {
          outputError(formatError(err), 'PREVIEW_FAILED', { json }, 2);
        }
      }
    });
}
