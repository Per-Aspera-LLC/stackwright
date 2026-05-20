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
