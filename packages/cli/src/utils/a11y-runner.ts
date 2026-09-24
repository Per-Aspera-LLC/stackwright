/**
 * Portable WCAG 2.1 AA accessibility runner for Stackwright sites.
 *
 * Uses axe-core via @axe-core/playwright to test pages in both light and dark
 * color modes. Both Playwright and @axe-core/playwright are optional peer
 * dependencies — this module throws a clear error if either is missing.
 *
 * swp-kwv8 (stackwright-8v2): every scan runs in a brand-new, cookie-less
 * browser.newContext() per slug × mode. If auth doesn't hold (or was never
 * supplied), the browser silently lands on /login instead of the requested
 * route — a real, chrome-less page that axe scans clean. Before this fix,
 * `A11yPageResult.url` was computed BEFORE navigation and never corrected,
 * so a login bounce was structurally indistinguishable from a genuine
 * `pass: true`. Every scan now carries `finalUrl`/`requestedUrl`/`redirected`
 * and a `status` ('audited' | 'redirected' | 'error'); `pass` is only
 * meaningful when `status === 'audited'` — a redirected scan is NEVER
 * reported as a pass. A redirect is auth-coverage evidence, not audit
 * coverage (R2.6 / swp-hyvg doctrine): it proves *something* answered, not
 * that the intended page was measured.
 */

export type A11yColorMode = 'light' | 'dark';

/** Meaningful only when the scan is 'audited' — see A11yPageResult.pass. */
export type A11yScanStatus = 'audited' | 'redirected' | 'error';

export interface A11yViolationNode {
  /** axe's CSS selector(s) identifying the failing DOM node. */
  target: string[];
  failureSummary: string;
}

export interface A11yViolation {
  id: string;
  impact: string | null;
  description: string;
  help: string;
  helpUrl: string;
  nodeCount: number;
  /** Per-node selectors, capped at 10 so results stay a sane size. */
  nodes: A11yViolationNode[];
}

export interface A11yPageResult {
  slug: string;
  /** @deprecated kept for back-compat; identical to requestedUrl. Use requestedUrl/finalUrl. */
  url: string;
  /** The URL this scan was asked to load. */
  requestedUrl: string;
  /** Where the browser actually ended up after goto (+ dark-mode reload). */
  finalUrl: string;
  mode: A11yColorMode;
  /** 'audited': real scan ran. 'redirected': landed somewhere else, not scanned.
   *  'error': navigation/scan threw (timeout, crash, etc). */
  status: A11yScanStatus;
  /** Only meaningful when status === 'audited'. Always false otherwise. */
  pass: boolean;
  /** finalUrl's pathname !== requestedUrl's pathname (trailing slash normalized). */
  redirected: boolean;
  /** redirected AND it looks like an auth bounce to /login (simple, documented heuristic). */
  redirectedToLogin: boolean;
  violations: A11yViolation[];
  /** Violations at critical or serious impact level */
  failingViolations: A11yViolation[];
  /** Present only when status === 'error'. */
  error?: string;
}

export interface A11yAuditResult {
  /** Overall pass — true only if every audited page passed, no scan errored,
   *  and no scan redirected (unless opts.allowRedirects: true). */
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
    /** Scans that landed somewhere other than requested — not counted as passed or failed. */
    redirected: number;
    violations: number;
  };
}

export interface A11yCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
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
  /** Cookies to seed into every browser context (e.g. a persona/auth cookie),
   *  so a caller can authenticate directly instead of relying on the target
   *  app to carry auth across a fresh, cookie-less context on its own. */
  cookies?: A11yCookie[];
  /** Extra HTTP headers to send with every request in every context. */
  extraHTTPHeaders?: Record<string, string>;
  /** When false (default), any redirected scan forces overall `pass: false`.
   *  When true, redirected scans still aren't 'audited' (evidence of auth
   *  coverage, not audit coverage — they never contribute a pass/fail
   *  verdict) but no longer sink the overall result on their own. */
  allowRedirects?: boolean;
}

const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
const MAX_NODES_PER_VIOLATION = 10;

function impactRank(impact: string | null): number {
  if (!impact) return -1;
  return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
}

/** Strip a single trailing slash (but keep root '/' as-is) so '/leads' and
 *  '/leads/' compare equal. */
function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/**
 * Simple, documented heuristic for "this redirect looks like an auth bounce":
 * the final path IS /login, or the final URL carries a `redirect=` query
 * param that points back at the originally-requested path (the shape
 * StackwrightLayout's login page and pro's mock-login route both use).
 * Deliberately conservative — false negatives (missed logins) are safer
 * here than false positives, since `redirected` (not just `redirectedToLogin`)
 * is already enough to keep a scan out of `status: 'audited'`.
 */
function looksLikeLoginRedirect(finalUrl: string, requestedPath: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(finalUrl);
  } catch {
    return false;
  }
  const finalPath = normalizePath(parsed.pathname);
  if (finalPath === '/login') return true;

  const redirectParam = parsed.searchParams.get('redirect');
  if (!redirectParam) return false;
  try {
    const decodedPath = normalizePath(
      new URL(decodeURIComponent(redirectParam), parsed.origin).pathname
    );
    return decodedPath === requestedPath;
  } catch {
    return false;
  }
}

function mapAxeViolation(v: any): A11yViolation {
  const rawNodes: any[] = Array.isArray(v.nodes) ? v.nodes : [];
  return {
    id: v.id,
    impact: v.impact ?? null,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    nodeCount: rawNodes.length,
    nodes: rawNodes.slice(0, MAX_NODES_PER_VIOLATION).map((n) => ({
      target: Array.isArray(n.target) ? n.target.map((t: unknown) => String(t)) : [],
      failureSummary: typeof n.failureSummary === 'string' ? n.failureSummary : '',
    })),
  };
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
  // NOTE: Use (globalThis as Record<string, unknown>)['document'] instead of
  // bare `document` — the CLI tsconfig has no lib:dom, so the DTS build
  // rejects DOM globals even inside page.evaluate() callbacks.
  const applied = await page.evaluate((targetMode: string): boolean => {
    const doc = (globalThis as Record<string, unknown>)['document'] as {
      documentElement: {
        classList: { contains: (c: string) => boolean; toggle: (c: string, v: boolean) => void };
        dataset: Record<string, string>;
      };
    };
    const html = doc.documentElement;
    const current =
      html.classList.contains('dark') || html.dataset['theme'] === 'dark' ? 'dark' : 'light';
    if (current !== targetMode) {
      html.classList.toggle('dark', targetMode === 'dark');
      html.dataset['theme'] = targetMode;
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
    cookies,
    extraHTTPHeaders,
    allowRedirects = false,
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
      const requestedUrl = new URL(slug.startsWith('/') ? slug : `/${slug}`, baseUrl).toString();
      const requestedPath = normalizePath(new URL(requestedUrl).pathname);

      for (const mode of modes) {
        const context = await browser.newContext();

        if (cookies && cookies.length > 0) {
          await context.addCookies(
            cookies.map((c) =>
              c.domain
                ? { name: c.name, value: c.value, domain: c.domain, path: c.path ?? '/' }
                : { name: c.name, value: c.value, url: baseUrl }
            )
          );
        }
        if (extraHTTPHeaders) {
          await context.setExtraHTTPHeaders(extraHTTPHeaders);
        }

        const page = await context.newPage();

        try {
          let finalUrl = requestedUrl;
          try {
            // Navigate initially without color mode cookie
            await page.goto(requestedUrl, { waitUntil: 'networkidle', timeout: 30_000 });
            // Apply color mode (this reloads the page — capture url again after)
            await setColorMode(page, mode, baseUrl);
            finalUrl = page.url();
          } catch (navErr) {
            let landedUrl = requestedUrl;
            try {
              landedUrl = page.url();
            } catch {
              // page may not exist in a usable state — keep requestedUrl
            }
            results.push({
              slug,
              url: requestedUrl,
              requestedUrl,
              finalUrl: landedUrl,
              mode,
              status: 'error',
              pass: false,
              redirected: false,
              redirectedToLogin: false,
              violations: [],
              failingViolations: [],
              error: navErr instanceof Error ? navErr.message : String(navErr),
            });
            continue;
          }

          const finalPath = normalizePath(new URL(finalUrl).pathname);
          const redirected = finalPath !== requestedPath;

          if (redirected) {
            results.push({
              slug,
              url: requestedUrl,
              requestedUrl,
              finalUrl,
              mode,
              status: 'redirected',
              // A redirected scan is NEVER a pass — it didn't audit the
              // requested page at all (R2.6 / swp-hyvg: auth coverage, not
              // audit coverage).
              pass: false,
              redirected: true,
              redirectedToLogin: looksLikeLoginRedirect(finalUrl, requestedPath),
              violations: [],
              failingViolations: [],
            });
            continue;
          }

          // Run axe scan — only ever on the page we actually meant to test.
          const axeResults = await new AxeBuilder({ page }).withTags(tags).analyze();
          const violations: A11yViolation[] = axeResults.violations.map(mapAxeViolation);
          const failingViolations = violations.filter((v) => impactRank(v.impact) >= failRank);

          results.push({
            slug,
            url: requestedUrl,
            requestedUrl,
            finalUrl,
            mode,
            status: 'audited',
            pass: failingViolations.length === 0,
            redirected: false,
            redirectedToLogin: false,
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

  const redirectedCount = results.filter((r) => r.status === 'redirected').length;
  const erroredCount = results.filter((r) => r.status === 'error').length;
  const auditedFailedCount = results.filter((r) => r.status === 'audited' && !r.pass).length;
  const passedCount = results.filter((r) => r.status === 'audited' && r.pass).length;
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);

  const overallPass =
    auditedFailedCount === 0 && erroredCount === 0 && (redirectedCount === 0 || allowRedirects);

  return {
    pass: overallPass,
    baseUrl,
    slugs,
    modes,
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: auditedFailedCount + erroredCount,
      redirected: redirectedCount,
      violations: totalViolations,
    },
  };
}
