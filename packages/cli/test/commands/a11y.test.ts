import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { A11yAuditResult } from '../../src/utils/a11y-runner';

// ---------------------------------------------------------------------------
// Hoisted mock functions — created before vi.mock factories run
// ---------------------------------------------------------------------------

const { mockDiscoverPageSlugs, mockRunA11yAudit } = vi.hoisted(() => ({
  mockDiscoverPageSlugs: vi.fn(),
  mockRunA11yAudit: vi.fn(),
}));

vi.mock('../../src/utils/a11y-page-discovery', () => ({
  discoverPageSlugs: mockDiscoverPageSlugs,
}));

vi.mock('../../src/utils/a11y-runner', () => ({
  runA11yAudit: mockRunA11yAudit,
}));

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import { testA11y } from '../../src/commands/a11y';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePassingResult(slugs: string[] = ['/']): A11yAuditResult {
  return {
    pass: true,
    baseUrl: 'http://localhost:3000',
    slugs,
    modes: ['light', 'dark'],
    results: [],
    summary: { total: 0, passed: 0, failed: 0, violations: 0 },
  };
}

// ---------------------------------------------------------------------------
// Page discovery
// ---------------------------------------------------------------------------

describe('testA11y — page discovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunA11yAudit.mockResolvedValue(makePassingResult());
  });

  it('calls discoverPageSlugs with the project root when --pages not given', async () => {
    mockDiscoverPageSlugs.mockReturnValue(['/about', '/contact']);
    await testA11y('/fake/project', {});
    expect(mockDiscoverPageSlugs).toHaveBeenCalledWith('/fake/project');
  });

  it('passes discovered slugs to runA11yAudit', async () => {
    mockDiscoverPageSlugs.mockReturnValue(['/about', '/contact']);
    await testA11y('/fake/project', {});
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.slugs).toEqual(['/about', '/contact']);
  });

  it('does NOT call discoverPageSlugs when --pages is given', async () => {
    await testA11y('/fake/project', { pages: '/home,/about' });
    expect(mockDiscoverPageSlugs).not.toHaveBeenCalled();
  });

  it('passes explicit slugs to runA11yAudit when --pages is given', async () => {
    await testA11y('/fake/project', { pages: '/home,/about' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.slugs).toEqual(['/home', '/about']);
  });

  it('throws NO_PAGES when discovery returns empty and no explicit pages given', async () => {
    mockDiscoverPageSlugs.mockReturnValue([]);
    await expect(testA11y('/fake/project', {})).rejects.toMatchObject({
      code: 'NO_PAGES',
      message: expect.stringContaining('No pages found'),
    });
  });

  it('NO_PAGES error message includes prebuild hint', async () => {
    mockDiscoverPageSlugs.mockReturnValue([]);
    await expect(testA11y('/fake/project', {})).rejects.toMatchObject({
      message: expect.stringContaining('prebuild'),
    });
  });
});

// ---------------------------------------------------------------------------
// Color modes
// ---------------------------------------------------------------------------

describe('testA11y — color modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscoverPageSlugs.mockReturnValue(['/']);
    mockRunA11yAudit.mockResolvedValue(makePassingResult());
  });

  it('tests both light and dark modes by default (no darkMode option)', async () => {
    await testA11y('/fake/project', {});
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.modes).toEqual(['light', 'dark']);
  });

  it('tests only light mode when darkMode: false (--no-dark-mode)', async () => {
    await testA11y('/fake/project', { darkMode: false });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.modes).toEqual(['light']);
  });

  it('tests both modes when darkMode: true (explicit)', async () => {
    await testA11y('/fake/project', { darkMode: true });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.modes).toEqual(['light', 'dark']);
  });
});

// ---------------------------------------------------------------------------
// Options passthrough
// ---------------------------------------------------------------------------

describe('testA11y — options passthrough', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscoverPageSlugs.mockReturnValue(['/']);
    mockRunA11yAudit.mockResolvedValue(makePassingResult());
  });

  it('parses comma-separated --pages into trimmed slug array', async () => {
    await testA11y('/fake/project', { pages: '/a, /b, /c' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.slugs).toEqual(['/a', '/b', '/c']);
  });

  it('filters out empty entries from --pages', async () => {
    await testA11y('/fake/project', { pages: '/a,,/b,' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.slugs).toEqual(['/a', '/b']);
  });

  it('uses the provided baseUrl', async () => {
    await testA11y('/fake/project', { baseUrl: 'http://localhost:4321', pages: '/' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.baseUrl).toBe('http://localhost:4321');
  });

  it('defaults baseUrl to http://localhost:3000', async () => {
    await testA11y('/fake/project', { pages: '/' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.baseUrl).toBe('http://localhost:3000');
  });

  it('parses comma-separated --tags', async () => {
    await testA11y('/fake/project', { pages: '/', tags: 'wcag2a,wcag2aa' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.tags).toEqual(['wcag2a', 'wcag2aa']);
  });

  it('passes undefined tags when --tags not given (let runner use defaults)', async () => {
    await testA11y('/fake/project', { pages: '/' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.tags).toBeUndefined();
  });

  it('passes failOn through to the runner', async () => {
    await testA11y('/fake/project', { pages: '/', failOn: 'critical' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.failOn).toBe('critical');
  });

  it('defaults failOn to "serious"', async () => {
    await testA11y('/fake/project', { pages: '/' });
    const opts = mockRunA11yAudit.mock.calls[0][0];
    expect(opts.failOn).toBe('serious');
  });
});

// ---------------------------------------------------------------------------
// Return value pass-through
// ---------------------------------------------------------------------------

describe('testA11y — return value', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiscoverPageSlugs.mockReturnValue(['/']);
  });

  it('returns the A11yAuditResult from runA11yAudit', async () => {
    const fakeResult = makePassingResult(['/about']);
    mockRunA11yAudit.mockResolvedValue(fakeResult);
    const result = await testA11y('/fake/project', { pages: '/about' });
    expect(result).toBe(fakeResult);
  });
});
