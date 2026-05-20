/**
 * Portable WCAG 2.1 AA accessibility runner for Stackwright sites.
 *
 * Uses axe-core via @axe-core/playwright to test pages in both light and dark
 * color modes. Both Playwright and @axe-core/playwright are optional peer
 * dependencies — this module throws a clear error if either is missing.
 */

export type A11yColorMode = 'light' | 'dark';

export interface A11yViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodeCount: number;
}

export interface A11yPageResult {
  slug: string;
  url: string;
  mode: A11yColorMode;
  pass: boolean;
  violations: A11yViolation[];
  /** Violations at critical or serious impact level */
  failingViolations: A11yViolation[];
}

export interface A11yAuditResult {
  /** Overall pass — true only if all pages/modes pass */
  pass: boolean;
  baseUrl: string;
  slugs: string[];
  modes: A11yColorMode[];
  results: A11yPageResult[];
  /** Summary counts */
  summary: {
    total: number;
    passed: number;
    failed: number;
    violations: number;
  };
}

export interface A11yRunnerOptions {
  baseUrl: string;
  slugs: string[];
  /** Which color modes to test. Defaults to ['light', 'dark']. */
  modes?: A11yColorMode[];
  /** axe-core rule tags. Defaults to WCAG 2.1 AA. */
  tags?: string[];
  /** Minimum impact level that causes a page to fail. Defaults to 'serious'. */
  failOn?: 'minor' | 'moderate' | 'serious' | 'critical';
}

const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;

function impactRank(impact: string | null): number {
  if (!impact) return -1;
  return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
}

/**
 * Set the Stackwright color mode on a Playwright page by writing the
 * sw-color-mode cookie and reloading. Falls back to class/data-attribute
 * manipulation if the cookie approach doesn't take effect.
 */
async function setColorMode(page: any, mode: A11yColorMode, baseUrl: string): Promise<void> {
  // Set cookie before navigation so ColorModeScript picks it up on load
  await page.context().addCookies([
    {
      name: 'sw-color-mode',
      value: mode,
      url: baseUrl,
    },
  ]);

  await page.reload({ waitUntil: 'networkidle' });

  // Verify the mode took effect; apply directly if not
  const applied = await page.evaluate((targetMode: string) => {
    const html = document.documentElement;
    const current =
      html.classList.contains('dark') || html.dataset.theme === 'dark' ? 'dark' : 'light';
    if (current !== targetMode) {
      html.classList.toggle('dark', targetMode === 'dark');
      html.dataset.theme = targetMode;
      return false;
    }
    return true;
  }, mode);

  if (!applied) {
    // Give React a moment to reconcile after the direct DOM change
    await page.waitForTimeout(200);
  }
}

/**
 * Run a WCAG 2.1 AA accessibility audit against a running Stackwright dev server.
 *
 * Requires:
 *   - A running dev server at opts.baseUrl (default: http://localhost:3000)
 *   - playwright installed (optional peer dependency)
 *   - @axe-core/playwright installed (optional peer dependency)
 */
export async function runA11yAudit(opts: A11yRunnerOptions): Promise<A11yAuditResult> {
  const {
    baseUrl,
    slugs,
    modes = ['light', 'dark'],
    tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    failOn = 'serious',
  } = opts;

  // -- Validate dev server is reachable --
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    await fetch(baseUrl, { signal: controller.signal });
  } catch {
    const err = new Error(`No dev server detected at ${baseUrl}.\nStart it with: pnpm dev`);
    (err as NodeJS.ErrnoException).code = 'NO_DEV_SERVER';
    throw err;
  } finally {
    clearTimeout(timer);
  }

  // -- Dynamic import: playwright --
  let chromium: any;
  try {
    const pw = await import('playwright' as string);
    chromium = pw.chromium;
  } catch {
    const err = new Error(
      'The test:a11y command requires Playwright.\n' +
        'Install it with: pnpm add -D playwright\n' +
        'Then install the browser: pnpm exec playwright install chromium'
    );
    (err as NodeJS.ErrnoException).code = 'MISSING_PLAYWRIGHT';
    throw err;
  }

  // -- Dynamic import: @axe-core/playwright --
  let AxeBuilder: any;
  try {
    const axeMod = await import('@axe-core/playwright' as string);
    AxeBuilder = axeMod.default ?? axeMod.AxeBuilder;
  } catch {
    const err = new Error(
      'The test:a11y command requires @axe-core/playwright.\n' +
        'Install it with: pnpm add -D @axe-core/playwright'
    );
    (err as NodeJS.ErrnoException).code = 'MISSING_AXE';
    throw err;
  }

  const failRank = impactRank(failOn);
  const results: A11yPageResult[] = [];

  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const slug of slugs) {
      const url = new URL(slug.startsWith('/') ? slug : `/${slug}`, baseUrl).toString();

      for (const mode of modes) {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          // Navigate initially without color mode cookie
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });

          // Apply color mode
          await setColorMode(page, mode, baseUrl);

          // Run axe scan
          const axeResults = await new AxeBuilder({ page }).withTags(tags).analyze();

          const violations: A11yViolation[] = axeResults.violations.map((v: any) => ({
            id: v.id,
            impact: v.impact ?? null,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodeCount: v.nodes.length,
          }));

          const failingViolations = violations.filter((v) => impactRank(v.impact) >= failRank);

          results.push({
            slug,
            url,
            mode,
            pass: failingViolations.length === 0,
            violations,
            failingViolations,
          });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.pass).length;
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);

  return {
    pass: results.every((r) => r.pass),
    baseUrl,
    slugs,
    modes,
    results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      violations: totalViolations,
    },
  };
}
