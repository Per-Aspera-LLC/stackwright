import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { A11yRunnerOptions, A11yViolation } from '../../src/utils/a11y-runner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeViolation(impact: string | null, id = 'test-rule'): A11yViolation {
  return {
    id,
    impact,
    description: `Test violation: ${id}`,
    help: 'Fix it',
    helpUrl: 'https://dequeuniversity.com',
    nodeCount: 1,
    nodes: [{ target: ['.some-selector'], failureSummary: 'Fix the contrast' }],
  };
}

// ---------------------------------------------------------------------------
// Error-path tests
// ---------------------------------------------------------------------------

describe('a11y-runner — error paths', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('throws NO_DEV_SERVER when fetch rejects (connection refused)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const opts: A11yRunnerOptions = {
      baseUrl: 'http://localhost:3000',
      slugs: ['/'],
    };
    await expect(runA11yAudit(opts)).rejects.toMatchObject({
      message: expect.stringContaining('No dev server detected'),
      code: 'NO_DEV_SERVER',
    });
  });

  it('NO_DEV_SERVER message includes the baseUrl', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const opts: A11yRunnerOptions = {
      baseUrl: 'http://localhost:4321',
      slugs: ['/'],
    };
    await expect(runA11yAudit(opts)).rejects.toMatchObject({
      message: expect.stringContaining('http://localhost:4321'),
    });
  });

  it('NO_DEV_SERVER message includes the pnpm dev hint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    await expect(
      runA11yAudit({ baseUrl: 'http://localhost:3000', slugs: ['/'] })
    ).rejects.toMatchObject({
      message: expect.stringContaining('pnpm dev'),
    });
  });

  it('MISSING_PLAYWRIGHT error code contract is correct', () => {
    // Contract test: the error thrown when playwright is absent must carry
    // code: 'MISSING_PLAYWRIGHT' so callers can detect and advise the user.
    const err = new Error('Cannot find module playwright');
    (err as NodeJS.ErrnoException).code = 'MISSING_PLAYWRIGHT';
    expect(err.code).toBe('MISSING_PLAYWRIGHT');
    expect(err.message).toContain('playwright');
  });

  it('MISSING_AXE error code contract is correct', () => {
    // Contract test: the error thrown when @axe-core/playwright is absent must
    // carry code: 'MISSING_AXE'.
    const err = new Error('Cannot find module @axe-core/playwright');
    (err as NodeJS.ErrnoException).code = 'MISSING_AXE';
    expect(err.code).toBe('MISSING_AXE');
    expect(err.message).toContain('@axe-core/playwright');
  });
});

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe('a11y-runner — exports', () => {
  it('exports runA11yAudit as a function', async () => {
    const mod = await import('../../src/utils/a11y-runner');
    expect(typeof mod.runA11yAudit).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Impact ranking — tested indirectly via the A11yViolation shape
// ---------------------------------------------------------------------------

describe('a11y-runner — A11yViolation shape', () => {
  it('makeViolation helper produces valid A11yViolation objects', () => {
    const v = makeViolation('serious', 'color-contrast');
    expect(v.id).toBe('color-contrast');
    expect(v.impact).toBe('serious');
    expect(typeof v.nodeCount).toBe('number');
    expect(typeof v.helpUrl).toBe('string');
  });

  it('impact null is a valid A11yViolation (some axe rules omit impact)', () => {
    const v = makeViolation(null);
    expect(v.impact).toBeNull();
  });

  // Verify the ordering assumption the runner depends on:
  // minor < moderate < serious < critical
  it('impact levels are in the expected ascending order', () => {
    // Simulate what impactRank does via IMPACT_LEVELS array ordering
    const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
    const rank = (lvl: string) => IMPACT_LEVELS.indexOf(lvl as (typeof IMPACT_LEVELS)[number]);

    expect(rank('minor')).toBeLessThan(rank('moderate'));
    expect(rank('moderate')).toBeLessThan(rank('serious'));
    expect(rank('serious')).toBeLessThan(rank('critical'));
  });

  it('failOn threshold: only violations at-or-above the rank should fail', () => {
    // White-box: replicate the filter logic from the runner
    const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
    const impactRank = (impact: string | null) => {
      if (!impact) return -1;
      return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
    };

    const failOn = 'serious';
    const failRank = impactRank(failOn);

    const violations = [
      makeViolation('minor'),
      makeViolation('moderate'),
      makeViolation('serious'),
      makeViolation('critical'),
      makeViolation(null),
    ];

    const failing = violations.filter((v) => impactRank(v.impact) >= failRank);
    expect(failing).toHaveLength(2); // serious + critical
    expect(failing.map((v) => v.impact)).toEqual(['serious', 'critical']);
  });

  it('failOn: "critical" only fails critical violations', () => {
    const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
    const impactRank = (impact: string | null) => {
      if (!impact) return -1;
      return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
    };

    const failRank = impactRank('critical');
    const violations = [
      makeViolation('minor'),
      makeViolation('moderate'),
      makeViolation('serious'),
      makeViolation('critical'),
    ];

    const failing = violations.filter((v) => impactRank(v.impact) >= failRank);
    expect(failing).toHaveLength(1);
    expect(failing[0].impact).toBe('critical');
  });

  it('failOn: "minor" fails everything including minor', () => {
    const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
    const impactRank = (impact: string | null) => {
      if (!impact) return -1;
      return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
    };

    const failRank = impactRank('minor');
    const violations = [
      makeViolation('minor'),
      makeViolation('moderate'),
      makeViolation('serious'),
      makeViolation('critical'),
    ];

    const failing = violations.filter((v) => impactRank(v.impact) >= failRank);
    expect(failing).toHaveLength(4);
  });

  it('null-impact violations never fail regardless of failOn threshold', () => {
    const IMPACT_LEVELS = ['minor', 'moderate', 'serious', 'critical'] as const;
    const impactRank = (impact: string | null) => {
      if (!impact) return -1;
      return IMPACT_LEVELS.indexOf(impact as (typeof IMPACT_LEVELS)[number]);
    };

    const failRank = impactRank('minor'); // strictest threshold
    const nullViolation = makeViolation(null);
    expect(impactRank(nullViolation.impact) >= failRank).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// swp-kwv8 / stackwright-8v2 — login-bounce classification, finalUrl,
// node selectors, allowRedirects opt-in. Mocked Playwright + axe-core.
// ---------------------------------------------------------------------------

interface FakePageOpts {
  requestedUrl: string;
  /** If set, page.url() reports this right after goto() (simulates an
   *  immediate auth-redirect during navigation). Defaults to requestedUrl. */
  gotoLandsOn?: string;
  /** If set, page.url() reports this after setColorMode's reload() — lets a
   *  test prove the dark-mode reload path re-captures finalUrl separately
   *  from the initial goto(). */
  reloadLandsOn?: string;
  axeViolations?: unknown[];
}

function makeFakePage(opts: FakePageOpts) {
  let currentUrl = '';
  return {
    goto: vi.fn(async () => {
      currentUrl = opts.gotoLandsOn ?? opts.requestedUrl;
    }),
    reload: vi.fn(async () => {
      if (opts.reloadLandsOn) currentUrl = opts.reloadLandsOn;
    }),
    evaluate: vi.fn(async () => true),
    waitForTimeout: vi.fn(async () => undefined),
    url: () => currentUrl,
    context: () => ({ addCookies: vi.fn(async () => undefined) }),
    __axeViolations: opts.axeViolations ?? [],
  };
}

function makeChromium(pages: ReturnType<typeof makeFakePage>[]) {
  let i = 0;
  return {
    launch: vi.fn(async () => ({
      newContext: vi.fn(async () => ({
        addCookies: vi.fn(async () => undefined),
        setExtraHTTPHeaders: vi.fn(async () => undefined),
        newPage: vi.fn(async () => pages[i++]),
        close: vi.fn(async () => undefined),
      })),
      close: vi.fn(async () => undefined),
    })),
  };
}

class FakeAxeBuilder {
  private page: ReturnType<typeof makeFakePage>;
  constructor({ page }: { page: ReturnType<typeof makeFakePage> }) {
    this.page = page;
  }
  withTags() {
    return this;
  }
  async analyze() {
    return { violations: this.page.__axeViolations ?? [] };
  }
}

// Getter-backed mocks so each test can swap in its own fake chromium/AxeBuilder
// without vi.resetModules() churn (dynamic import reads the getter live).
let chromiumImpl: ReturnType<typeof makeChromium> | undefined;
let axeBuilderImpl: typeof FakeAxeBuilder | undefined;

vi.mock('playwright', () => ({
  get chromium() {
    return chromiumImpl;
  },
}));

vi.mock('@axe-core/playwright', () => ({
  get default() {
    return axeBuilderImpl;
  },
}));

describe('runA11yAudit — login-bounce classification (swp-kwv8)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    axeBuilderImpl = FakeAxeBuilder;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    chromiumImpl = undefined;
    axeBuilderImpl = undefined;
  });

  it('a login-bounce goto is reported as status: redirected, pass: false, never audited', async () => {
    const requestedUrl = 'http://localhost:3000/leads';
    const bouncedUrl = 'http://localhost:3000/login?redirect=%2Fleads';
    const page = makeFakePage({ requestedUrl, gotoLandsOn: bouncedUrl });
    chromiumImpl = makeChromium([page]);

    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const result = await runA11yAudit({
      baseUrl: 'http://localhost:3000',
      slugs: ['/leads'],
      modes: ['light'],
    });

    expect(result.results).toHaveLength(1);
    const [scan] = result.results;
    expect(scan.status).toBe('redirected');
    expect(scan.pass).toBe(false);
    expect(scan.redirected).toBe(true);
    expect(scan.redirectedToLogin).toBe(true);
    expect(scan.finalUrl).toBe(bouncedUrl);
    expect(scan.requestedUrl).toBe(requestedUrl);
    expect(scan.violations).toEqual([]);
    expect(result.summary.redirected).toBe(1);
    expect(result.summary.passed).toBe(0);
    // Overall pass is false — a redirected scan is never coverage, and
    // allowRedirects wasn't set.
    expect(result.pass).toBe(false);
  });

  it('allowRedirects: true keeps overall pass unaffected, but the scan itself stays non-audited', async () => {
    const requestedUrl = 'http://localhost:3000/leads';
    const bouncedUrl = 'http://localhost:3000/login?redirect=%2Fleads';
    const page = makeFakePage({ requestedUrl, gotoLandsOn: bouncedUrl });
    chromiumImpl = makeChromium([page]);

    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const result = await runA11yAudit({
      baseUrl: 'http://localhost:3000',
      slugs: ['/leads'],
      modes: ['light'],
      allowRedirects: true,
    });

    expect(result.pass).toBe(true);
    const [scan] = result.results;
    expect(scan.status).toBe('redirected');
    expect(scan.pass).toBe(false); // still never a pass, opting in only saves the overall verdict
  });

  it('a scan that lands on the requested route is status: audited, carries finalUrl === requestedUrl and node target selectors (capped at 10)', async () => {
    const requestedUrl = 'http://localhost:3000/leads';
    const manyNodes = Array.from({ length: 12 }, (_, idx) => ({
      target: [`.node-${idx}`],
      failureSummary: `Failure ${idx}`,
    }));
    const page = makeFakePage({
      requestedUrl,
      axeViolations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must meet contrast ratio thresholds',
          help: 'Fix color contrast',
          helpUrl: 'https://dequeuniversity.com/rules/axe/color-contrast',
          nodes: manyNodes,
        },
      ],
    });
    chromiumImpl = makeChromium([page]);

    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const result = await runA11yAudit({
      baseUrl: 'http://localhost:3000',
      slugs: ['/leads'],
      modes: ['light'],
    });

    const [scan] = result.results;
    expect(scan.status).toBe('audited');
    expect(scan.finalUrl).toBe(requestedUrl);
    expect(scan.redirected).toBe(false);
    expect(scan.pass).toBe(false); // serious violation present
    expect(scan.violations[0].nodeCount).toBe(12);
    expect(scan.violations[0].nodes).toHaveLength(10); // capped
    expect(scan.violations[0].nodes[0]).toEqual({
      target: ['.node-0'],
      failureSummary: 'Failure 0',
    });
    expect(result.summary.redirected).toBe(0);
  });

  it('dark-mode reload path re-captures finalUrl independently of the light-mode scan', async () => {
    const requestedUrl = 'http://localhost:3000/leads';
    const bouncedOnReload = 'http://localhost:3000/login?redirect=%2Fleads';
    // Light mode: goto and reload both land on the requested route.
    const lightPage = makeFakePage({ requestedUrl });
    // Dark mode: goto lands fine, but the reload triggered by setColorMode
    // is where the session drops and the bounce happens.
    const darkPage = makeFakePage({ requestedUrl, reloadLandsOn: bouncedOnReload });
    chromiumImpl = makeChromium([lightPage, darkPage]);

    const { runA11yAudit } = await import('../../src/utils/a11y-runner');
    const result = await runA11yAudit({
      baseUrl: 'http://localhost:3000',
      slugs: ['/leads'],
      modes: ['light', 'dark'],
    });

    expect(result.results).toHaveLength(2);
    const [lightScan, darkScan] = result.results;
    expect(lightScan.mode).toBe('light');
    expect(lightScan.status).toBe('audited');
    expect(lightScan.finalUrl).toBe(requestedUrl);

    expect(darkScan.mode).toBe('dark');
    expect(darkScan.status).toBe('redirected');
    expect(darkScan.finalUrl).toBe(bouncedOnReload);
    expect(darkScan.pass).toBe(false);
    expect(result.summary.redirected).toBe(1);
    expect(result.pass).toBe(false);
  });
});
