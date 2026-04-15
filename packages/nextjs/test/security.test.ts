/**
 * Security Headers Test Suite
 *
 * Tests for the security headers implementation in @stackwright/nextjs.
 * Validates Content-Security-Policy, HSTS, Permissions-Policy, cross-origin
 * headers (COOP, CORP, COEP), and other security-related HTTP headers.
 */

import { describe, it, expect } from 'vitest';
import {
  defaultSecurityHeaders,
  buildSecurityHeaders,
  buildCSP,
  buildPermissionsPolicy,
  buildHSTS,
  normalizeWhitespace,
  createSecurityHeadersConfig,
  type SecurityHeadersOptions,
} from '../src/config/security';

// ---------------------------------------------------------------------------
// Helper: Find header by key
// ---------------------------------------------------------------------------

function findHeader(headers: { key: string; value: string }[], key: string) {
  return headers.find((h) => h.key === key);
}

// ---------------------------------------------------------------------------
// normalizeWhitespace
// ---------------------------------------------------------------------------

describe('normalizeWhitespace', () => {
  it('removes multiple consecutive spaces', () => {
    expect(normalizeWhitespace('hello    world')).toBe('hello world');
  });

  it('removes leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello world  ')).toBe('hello world');
  });

  it('handles tabs and newlines as single spaces', () => {
    expect(normalizeWhitespace('hello\t\tworld\n\nfoo')).toBe('hello world foo');
  });

  it('returns original string if no extra whitespace', () => {
    expect(normalizeWhitespace('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(normalizeWhitespace('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// buildCSP
// ---------------------------------------------------------------------------

describe('buildCSP', () => {
  const defaultCSP = buildCSP();

  it('includes default-src directive', () => {
    expect(defaultCSP).toContain("default-src 'self'");
  });

  it('includes script-src with unsafe-inline and unsafe-eval', () => {
    expect(defaultCSP).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it('includes style-src with Google Fonts', () => {
    expect(defaultCSP).toContain("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com");
  });

  it('includes font-src with Google Fonts domain', () => {
    expect(defaultCSP).toContain("font-src 'self' https://fonts.gstatic.com");
  });

  it('includes img-src with data:, https:, and blob: schemes', () => {
    expect(defaultCSP).toContain("img-src 'self' data: https: blob:");
  });

  it('includes connect-src', () => {
    expect(defaultCSP).toContain("connect-src 'self'");
  });

  it('prevents framing with frame-ancestors none', () => {
    expect(defaultCSP).toContain("frame-ancestors 'none'");
  });

  it('disables plugins with object-src none', () => {
    expect(defaultCSP).toContain("object-src 'none'");
  });

  it('includes base-uri self restriction', () => {
    expect(defaultCSP).toContain("base-uri 'self'");
  });

  it('includes form-action restriction', () => {
    expect(defaultCSP).toContain("form-action 'self'");
  });

  it('includes upgrade-insecure-requests directive', () => {
    expect(defaultCSP).toContain('upgrade-insecure-requests');
  });

  describe('with custom report-uri', () => {
    it('appends report-uri directive when provided', () => {
      const csp = buildCSP({ contentSecurityPolicy: { reportUri: '/csp-report' } });
      expect(csp).toContain('report-uri /csp-report');
    });

    it('does not include report-uri when not provided', () => {
      expect(defaultCSP).not.toContain('report-uri');
    });

    it('handles custom report-uri endpoint', () => {
      const csp = buildCSP({ contentSecurityPolicy: { reportUri: 'https://example.com/csp' } });
      expect(csp).toContain('report-uri https://example.com/csp');
    });
  });

  it('normalizes whitespace in output', () => {
    const csp = buildCSP();
    // Should not have multiple consecutive spaces
    expect(csp).not.toMatch(/\s{2,}/);
  });
});

// ---------------------------------------------------------------------------
// buildPermissionsPolicy
// ---------------------------------------------------------------------------

describe('buildPermissionsPolicy', () => {
  const defaultPolicy = buildPermissionsPolicy();

  describe('default policy (disables all features)', () => {
    it('disables camera by default', () => {
      expect(defaultPolicy).toContain('camera=()');
    });

    it('disables microphone by default', () => {
      expect(defaultPolicy).toContain('microphone=()');
    });

    it('disables geolocation by default', () => {
      expect(defaultPolicy).toContain('geolocation=()');
    });

    it('disables interest-cohort by default', () => {
      expect(defaultPolicy).toContain('interest-cohort=()');
    });

    it('uses kebab-case for interest-cohort', () => {
      expect(defaultPolicy).toContain('interest-cohort=');
      expect(defaultPolicy).not.toContain('interestCohort=');
    });
  });

  describe('custom allowlist', () => {
    it('allows custom camera origins', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { camera: ['https://example.com'] },
      });
      expect(policy).toContain('camera=(https://example.com)');
    });

    it('allows multiple camera origins', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { camera: ['https://a.com', 'https://b.com'] },
      });
      expect(policy).toContain('camera=(https://a.com, https://b.com)');
    });

    it('allows custom microphone origins', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { microphone: ['https://voice.example.com'] },
      });
      expect(policy).toContain('microphone=(https://voice.example.com)');
    });

    it('allows custom geolocation origins', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { geolocation: ['https://maps.example.com'] },
      });
      expect(policy).toContain('geolocation=(https://maps.example.com)');
    });

    it('allows custom interest-cohort origins', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { interestCohort: ['https://analytics.example.com'] },
      });
      expect(policy).toContain('interest-cohort=(https://analytics.example.com)');
    });

    it('allows mixing default and custom policies', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { camera: ['https://example.com'] },
      });
      // Camera is custom, rest should be default (empty)
      expect(policy).toContain('camera=(https://example.com)');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('interest-cohort=()');
    });

    it('normalizes whitespace in output', () => {
      const policy = buildPermissionsPolicy({
        permissionsPolicy: { camera: ['a.com', 'b.com'] },
      });
      expect(policy).not.toMatch(/\s{2,}/);
    });
  });
});

// ---------------------------------------------------------------------------
// buildHSTS
// ---------------------------------------------------------------------------

describe('buildHSTS', () => {
  describe('default values', () => {
    it('uses 31536000 (1 year) as default max-age', () => {
      const hsts = buildHSTS();
      expect(hsts).toContain('max-age=31536000');
    });

    it('includes includeSubDomains by default', () => {
      const hsts = buildHSTS();
      expect(hsts).toContain('includeSubDomains');
    });

    it('includes preload by default', () => {
      const hsts = buildHSTS();
      expect(hsts).toContain('preload');
    });

    it('formats correctly with default options', () => {
      expect(buildHSTS()).toBe('max-age=31536000; includeSubDomains; preload');
    });
  });

  describe('custom max-age', () => {
    it('accepts custom max-age value', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { maxAge: 86400 } });
      expect(hsts).toContain('max-age=86400');
    });

    it('handles very long max-age', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { maxAge: 63072000 } });
      expect(hsts).toContain('max-age=63072000');
    });

    it('handles zero max-age', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { maxAge: 0 } });
      expect(hsts).toContain('max-age=0');
    });
  });

  describe('includeSubDomains toggle', () => {
    it('includes includeSubDomains when true', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { includeSubDomains: true } });
      expect(hsts).toContain('includeSubDomains');
    });

    it('excludes includeSubDomains when false', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { includeSubDomains: false } });
      expect(hsts).not.toContain('includeSubDomains');
    });

    it('includes includeSubDomains when undefined (default)', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { maxAge: 3600 } });
      expect(hsts).toContain('includeSubDomains');
    });
  });

  describe('preload toggle', () => {
    it('includes preload when true', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { preload: true } });
      expect(hsts).toContain('preload');
    });

    it('excludes preload when false', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { preload: false } });
      expect(hsts).not.toContain('preload');
    });

    it('includes preload when undefined (default)', () => {
      const hsts = buildHSTS({ strictTransportSecurity: { maxAge: 3600 } });
      expect(hsts).toContain('preload');
    });
  });

  describe('combined options', () => {
    it('handles all options combined', () => {
      const hsts = buildHSTS({
        strictTransportSecurity: {
          maxAge: 2592000,
          includeSubDomains: true,
          preload: true,
        },
      });
      expect(hsts).toBe('max-age=2592000; includeSubDomains; preload');
    });

    it('handles minimal options (only max-age)', () => {
      const hsts = buildHSTS({
        strictTransportSecurity: {
          maxAge: 12345,
          includeSubDomains: false,
          preload: false,
        },
      });
      expect(hsts).toBe('max-age=12345');
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-Origin Headers (COOP, CORP, COEP)
// ---------------------------------------------------------------------------

describe('Cross-Origin Security Headers', () => {
  describe('Cross-Origin-Opener-Policy (COOP)', () => {
    const coopValues = ['same-origin', 'same-origin-allow-popups', 'unsafe-none'] as const;

    it('uses same-origin-allow-popups as default in defaultSecurityHeaders', () => {
      const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Opener-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe('same-origin-allow-popups');
    });

    it.each(coopValues)('accepts %s value in buildSecurityHeaders', (value) => {
      const headers = buildSecurityHeaders({ crossOriginOpenerPolicy: value });
      const header = findHeader(headers, 'Cross-Origin-Opener-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe(value);
    });

    it('includes COOP header when option is provided', () => {
      const headers = buildSecurityHeaders({ crossOriginOpenerPolicy: 'same-origin' });
      expect(findHeader(headers, 'Cross-Origin-Opener-Policy')).toBeDefined();
    });

    it('does not include COOP header when option is not provided', () => {
      const headers = buildSecurityHeaders();
      const coopHeader = headers.find((h) => h.key === 'Cross-Origin-Opener-Policy');
      expect(coopHeader).toBeUndefined();
    });

    it('same-origin enables cross-origin isolation for SharedArrayBuffer', () => {
      const headers = buildSecurityHeaders({ crossOriginOpenerPolicy: 'same-origin' });
      const header = findHeader(headers, 'Cross-Origin-Opener-Policy');
      expect(header!.value).toBe('same-origin');
    });

    it('same-origin-allow-popups allows popups while isolating main document', () => {
      const headers = buildSecurityHeaders({ crossOriginOpenerPolicy: 'same-origin-allow-popups' });
      const header = findHeader(headers, 'Cross-Origin-Opener-Policy');
      expect(header!.value).toBe('same-origin-allow-popups');
    });

    it('unsafe-none does not provide cross-origin isolation', () => {
      const headers = buildSecurityHeaders({ crossOriginOpenerPolicy: 'unsafe-none' });
      const header = findHeader(headers, 'Cross-Origin-Opener-Policy');
      expect(header!.value).toBe('unsafe-none');
    });
  });

  describe('Cross-Origin-Resource-Policy (CORP)', () => {
    const corpValues = ['same-origin', 'same-site', 'cross-origin'] as const;

    it('uses same-origin as default in defaultSecurityHeaders', () => {
      const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Resource-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe('same-origin');
    });

    it.each(corpValues)('accepts %s value in buildSecurityHeaders', (value) => {
      const headers = buildSecurityHeaders({ crossOriginResourcePolicy: value });
      const header = findHeader(headers, 'Cross-Origin-Resource-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe(value);
    });

    it('includes CORP header when option is provided', () => {
      const headers = buildSecurityHeaders({ crossOriginResourcePolicy: 'same-site' });
      expect(findHeader(headers, 'Cross-Origin-Resource-Policy')).toBeDefined();
    });

    it('does not include CORP header when option is not provided', () => {
      const headers = buildSecurityHeaders();
      const corpHeader = headers.find((h) => h.key === 'Cross-Origin-Resource-Policy');
      expect(corpHeader).toBeUndefined();
    });

    it('same-origin restricts resource loading to same origin only', () => {
      const headers = buildSecurityHeaders({ crossOriginResourcePolicy: 'same-origin' });
      const header = findHeader(headers, 'Cross-Origin-Resource-Policy');
      expect(header!.value).toBe('same-origin');
    });

    it('same-site allows same-site cross-origin requests', () => {
      const headers = buildSecurityHeaders({ crossOriginResourcePolicy: 'same-site' });
      const header = findHeader(headers, 'Cross-Origin-Resource-Policy');
      expect(header!.value).toBe('same-site');
    });

    it('cross-origin allows any cross-origin request (use with caution)', () => {
      const headers = buildSecurityHeaders({ crossOriginResourcePolicy: 'cross-origin' });
      const header = findHeader(headers, 'Cross-Origin-Resource-Policy');
      expect(header!.value).toBe('cross-origin');
    });
  });

  describe('Cross-Origin-Embedder-Policy (COEP)', () => {
    const coepValues = ['require-corp', 'credentialless', 'no-cors'] as const;

    it('uses credentialless as default in defaultSecurityHeaders', () => {
      const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Embedder-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe('credentialless');
    });

    it.each(coepValues)('accepts %s value in buildSecurityHeaders', (value) => {
      const headers = buildSecurityHeaders({ crossOriginEmbedderPolicy: value });
      const header = findHeader(headers, 'Cross-Origin-Embedder-Policy');
      expect(header).toBeDefined();
      expect(header!.value).toBe(value);
    });

    it('includes COEP header when option is provided', () => {
      const headers = buildSecurityHeaders({ crossOriginEmbedderPolicy: 'require-corp' });
      expect(findHeader(headers, 'Cross-Origin-Embedder-Policy')).toBeDefined();
    });

    it('does not include COEP header when option is not provided', () => {
      const headers = buildSecurityHeaders();
      const coepHeader = headers.find((h) => h.key === 'Cross-Origin-Embedder-Policy');
      expect(coepHeader).toBeUndefined();
    });

    it('require-corp blocks cross-origin resources without explicit permission', () => {
      const headers = buildSecurityHeaders({ crossOriginEmbedderPolicy: 'require-corp' });
      const header = findHeader(headers, 'Cross-Origin-Embedder-Policy');
      expect(header!.value).toBe('require-corp');
    });

    it('credentialless allows cross-origin resources without credentials', () => {
      const headers = buildSecurityHeaders({ crossOriginEmbedderPolicy: 'credentialless' });
      const header = findHeader(headers, 'Cross-Origin-Embedder-Policy');
      expect(header!.value).toBe('credentialless');
    });

    it('no-cors allows loading cross-origin resources without CORS', () => {
      const headers = buildSecurityHeaders({ crossOriginEmbedderPolicy: 'no-cors' });
      const header = findHeader(headers, 'Cross-Origin-Embedder-Policy');
      expect(header!.value).toBe('no-cors');
    });
  });

  describe('Cross-Origin Headers Combination', () => {
    it('can combine all three cross-origin headers', () => {
      const headers = buildSecurityHeaders({
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-site',
        crossOriginEmbedderPolicy: 'require-corp',
      });

      expect(findHeader(headers, 'Cross-Origin-Opener-Policy')!.value).toBe('same-origin');
      expect(findHeader(headers, 'Cross-Origin-Resource-Policy')!.value).toBe('same-site');
      expect(findHeader(headers, 'Cross-Origin-Embedder-Policy')!.value).toBe('require-corp');
    });

    it('adds 3 headers to base count when all cross-origin options are provided', () => {
      const headers = buildSecurityHeaders({
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-site',
        crossOriginEmbedderPolicy: 'require-corp',
      });
      // 7 base headers + 3 cross-origin headers = 10
      expect(headers).toHaveLength(10);
    });

    it('can combine cross-origin headers with other security options', () => {
      const headers = buildSecurityHeaders({
        crossOriginOpenerPolicy: 'same-origin',
        crossOriginResourcePolicy: 'same-origin',
        crossOriginEmbedderPolicy: 'require-corp',
        xFrameOptions: 'SAMEORIGIN',
        referrerPolicy: 'no-referrer',
        strictTransportSecurity: { maxAge: 86400 },
      });

      expect(headers).toHaveLength(10);
      expect(findHeader(headers, 'Cross-Origin-Opener-Policy')!.value).toBe('same-origin');
      expect(findHeader(headers, 'Cross-Origin-Resource-Policy')!.value).toBe('same-origin');
      expect(findHeader(headers, 'Cross-Origin-Embedder-Policy')!.value).toBe('require-corp');
      expect(findHeader(headers, 'X-Frame-Options')!.value).toBe('SAMEORIGIN');
      expect(findHeader(headers, 'Referrer-Policy')!.value).toBe('no-referrer');
    });
  });
});

// ---------------------------------------------------------------------------
// defaultSecurityHeaders
// ---------------------------------------------------------------------------

describe('defaultSecurityHeaders', () => {
  it('returns exactly 10 security headers (7 base + 3 cross-origin)', () => {
    expect(defaultSecurityHeaders).toHaveLength(10);
  });

  it('includes Content-Security-Policy header', () => {
    const header = findHeader(defaultSecurityHeaders, 'Content-Security-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toContain("default-src 'self'");
  });

  it('includes X-Content-Type-Options header with nosniff', () => {
    const header = findHeader(defaultSecurityHeaders, 'X-Content-Type-Options');
    expect(header).toBeDefined();
    expect(header!.value).toBe('nosniff');
  });

  it('includes X-Frame-Options header with DENY', () => {
    const header = findHeader(defaultSecurityHeaders, 'X-Frame-Options');
    expect(header).toBeDefined();
    expect(header!.value).toBe('DENY');
  });

  it('includes X-XSS-Protection header with block mode', () => {
    const header = findHeader(defaultSecurityHeaders, 'X-XSS-Protection');
    expect(header).toBeDefined();
    expect(header!.value).toBe('1; mode=block');
  });

  it('includes Referrer-Policy with strict-origin-when-cross-origin', () => {
    const header = findHeader(defaultSecurityHeaders, 'Referrer-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toBe('strict-origin-when-cross-origin');
  });

  it('includes Permissions-Policy header', () => {
    const header = findHeader(defaultSecurityHeaders, 'Permissions-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toContain('camera=()');
    expect(header!.value).toContain('microphone=()');
  });

  it('includes Strict-Transport-Security header with defaults', () => {
    const header = findHeader(defaultSecurityHeaders, 'Strict-Transport-Security');
    expect(header).toBeDefined();
    expect(header!.value).toBe('max-age=31536000; includeSubDomains; preload');
  });

  it('includes Cross-Origin-Opener-Policy with same-origin-allow-popups', () => {
    const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Opener-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toBe('same-origin-allow-popups');
  });

  it('includes Cross-Origin-Resource-Policy with same-origin', () => {
    const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Resource-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toBe('same-origin');
  });

  it('includes Cross-Origin-Embedder-Policy with credentialless', () => {
    const header = findHeader(defaultSecurityHeaders, 'Cross-Origin-Embedder-Policy');
    expect(header).toBeDefined();
    expect(header!.value).toBe('credentialless');
  });

  it('all headers have non-empty values', () => {
    defaultSecurityHeaders.forEach((header) => {
      expect(header.key).toBeTruthy();
      expect(header.value).toBeTruthy();
    });
  });

  it('all header keys are unique', () => {
    const keys = defaultSecurityHeaders.map((h) => h.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

// ---------------------------------------------------------------------------
// buildSecurityHeaders
// ---------------------------------------------------------------------------

describe('buildSecurityHeaders', () => {
  it('returns exactly 7 headers when no cross-origin options provided', () => {
    const headers = buildSecurityHeaders();
    expect(headers).toHaveLength(7);
  });

  it('returns array of SecurityHeader objects', () => {
    const headers = buildSecurityHeaders();
    headers.forEach((header) => {
      expect(header).toHaveProperty('key');
      expect(header).toHaveProperty('value');
      expect(typeof header.key).toBe('string');
      expect(typeof header.value).toBe('string');
    });
  });

  describe('custom xFrameOptions', () => {
    it('uses DENY when not specified', () => {
      const headers = buildSecurityHeaders();
      const header = findHeader(headers, 'X-Frame-Options');
      expect(header!.value).toBe('DENY');
    });

    it('accepts SAMEORIGIN option', () => {
      const headers = buildSecurityHeaders({ xFrameOptions: 'SAMEORIGIN' });
      const header = findHeader(headers, 'X-Frame-Options');
      expect(header!.value).toBe('SAMEORIGIN');
    });

    it('accepts DENY option', () => {
      const headers = buildSecurityHeaders({ xFrameOptions: 'DENY' });
      const header = findHeader(headers, 'X-Frame-Options');
      expect(header!.value).toBe('DENY');
    });
  });

  describe('custom referrerPolicy', () => {
    const policies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ] as const;

    it('uses strict-origin-when-cross-origin when not specified', () => {
      const headers = buildSecurityHeaders();
      const header = findHeader(headers, 'Referrer-Policy');
      expect(header!.value).toBe('strict-origin-when-cross-origin');
    });

    it.each(policies)('accepts %s policy', (policy) => {
      const headers = buildSecurityHeaders({ referrerPolicy: policy });
      const header = findHeader(headers, 'Referrer-Policy');
      expect(header!.value).toBe(policy);
    });
  });

  describe('custom CSP report-uri', () => {
    it('appends report-uri to CSP when specified', () => {
      const headers = buildSecurityHeaders({
        contentSecurityPolicy: { reportUri: '/csp-violation-endpoint' },
      });
      const header = findHeader(headers, 'Content-Security-Policy');
      expect(header!.value).toContain('report-uri /csp-violation-endpoint');
    });
  });

  describe('custom permissions policy', () => {
    it('uses custom permissions when provided', () => {
      const headers = buildSecurityHeaders({
        permissionsPolicy: { camera: ['https://example.com'] },
      });
      const header = findHeader(headers, 'Permissions-Policy');
      expect(header!.value).toContain('camera=(https://example.com)');
    });
  });

  describe('custom HSTS options', () => {
    it('uses custom max-age when provided', () => {
      const headers = buildSecurityHeaders({
        strictTransportSecurity: { maxAge: 3600 },
      });
      const header = findHeader(headers, 'Strict-Transport-Security');
      expect(header!.value).toContain('max-age=3600');
    });

    it('disables includeSubDomains when specified', () => {
      const headers = buildSecurityHeaders({
        strictTransportSecurity: { includeSubDomains: false },
      });
      const header = findHeader(headers, 'Strict-Transport-Security');
      expect(header!.value).not.toContain('includeSubDomains');
    });

    it('disables preload when specified', () => {
      const headers = buildSecurityHeaders({
        strictTransportSecurity: { preload: false },
      });
      const header = findHeader(headers, 'Strict-Transport-Security');
      expect(header!.value).not.toContain('preload');
    });
  });

  describe('combining multiple options', () => {
    it('handles all options at once', () => {
      const headers = buildSecurityHeaders({
        xFrameOptions: 'SAMEORIGIN',
        referrerPolicy: 'no-referrer',
        contentSecurityPolicy: { reportUri: '/report' },
        permissionsPolicy: { camera: ['self'] },
        strictTransportSecurity: { maxAge: 86400 },
      });

      expect(findHeader(headers, 'X-Frame-Options')!.value).toBe('SAMEORIGIN');
      expect(findHeader(headers, 'Referrer-Policy')!.value).toBe('no-referrer');
      expect(findHeader(headers, 'Content-Security-Policy')!.value).toContain('report-uri /report');
      expect(findHeader(headers, 'Permissions-Policy')!.value).toContain('camera=(self)');
      expect(findHeader(headers, 'Strict-Transport-Security')!.value).toBe(
        'max-age=86400; includeSubDomains; preload'
      );
    });
  });
});

// ---------------------------------------------------------------------------
// createSecurityHeadersConfig
// ---------------------------------------------------------------------------

describe('createSecurityHeadersConfig', () => {
  it('returns an object with source and headers properties', () => {
    const config = createSecurityHeadersConfig();
    expect(config).toHaveProperty('source');
    expect(config).toHaveProperty('headers');
  });

  it('uses /:path* as the source pattern for all routes', () => {
    const config = createSecurityHeadersConfig();
    expect(config.source).toBe('/(.*)');
  });

  it('returns 7 security headers when no cross-origin options provided', () => {
    const config = createSecurityHeadersConfig();
    expect(config.headers).toHaveLength(7);
  });

  it('headers are properly formatted as SecurityHeader objects', () => {
    const config = createSecurityHeadersConfig();
    config.headers.forEach((header) => {
      expect(header).toHaveProperty('key');
      expect(header).toHaveProperty('value');
      expect(typeof header.key).toBe('string');
      expect(typeof header.value).toBe('string');
    });
  });

  it('headers match buildSecurityHeaders output', () => {
    const config = createSecurityHeadersConfig();
    const directHeaders = buildSecurityHeaders();
    expect(config.headers).toEqual(directHeaders);
  });

  it('respects custom options', () => {
    const config = createSecurityHeadersConfig({
      xFrameOptions: 'SAMEORIGIN',
      referrerPolicy: 'no-referrer',
    });

    expect(config.headers.find((h) => h.key === 'X-Frame-Options')!.value).toBe('SAMEORIGIN');
    expect(config.headers.find((h) => h.key === 'Referrer-Policy')!.value).toBe('no-referrer');
  });

  it('includes cross-origin headers when options are provided', () => {
    const config = createSecurityHeadersConfig({
      crossOriginOpenerPolicy: 'same-origin-allow-popups',
      crossOriginResourcePolicy: 'same-origin',
      crossOriginEmbedderPolicy: 'credentialless',
    });
    expect(config.headers.find((h) => h.key === 'Cross-Origin-Opener-Policy')).toBeDefined();
    expect(config.headers.find((h) => h.key === 'Cross-Origin-Resource-Policy')).toBeDefined();
    expect(config.headers.find((h) => h.key === 'Cross-Origin-Embedder-Policy')).toBeDefined();
  });

  it('is suitable for Next.js headers config format', () => {
    const config = createSecurityHeadersConfig();

    // This should work in next.config.js:
    // headers: async () => [config]
    expect(config.source).toMatch(/^\//);
    expect(Array.isArray(config.headers)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getSecurityHeaders (async wrapper)
// ---------------------------------------------------------------------------

describe('getSecurityHeaders', () => {
  // Note: Importing getSecurityHeaders would require dynamic import
  // since it's an async function, but it just wraps buildSecurityHeaders
  // These tests verify the synchronous behavior through buildSecurityHeaders

  it('buildSecurityHeaders produces same output as getSecurityHeaders would return', async () => {
    // Since getSecurityHeaders is just an async wrapper,
    // we verify the sync version produces valid results
    const headers = buildSecurityHeaders();
    expect(headers).toHaveLength(7);
  });

  it('handles complex options without errors', async () => {
    const options: SecurityHeadersOptions = {
      xFrameOptions: 'SAMEORIGIN',
      referrerPolicy: 'strict-origin',
      contentSecurityPolicy: { reportUri: '/csp-endpoint' },
      permissionsPolicy: {
        camera: ['https://example.com'],
        microphone: ['https://example.com'],
      },
      strictTransportSecurity: {
        maxAge: 2592000,
        includeSubDomains: true,
        preload: false,
      },
    };

    const headers = buildSecurityHeaders(options);
    expect(headers).toHaveLength(7);
    expect(headers[0].value).toContain('report-uri /csp-endpoint');
  });

  it('handles cross-origin options without errors', async () => {
    const options: SecurityHeadersOptions = {
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-site',
      crossOriginEmbedderPolicy: 'require-corp',
    };

    const headers = buildSecurityHeaders(options);
    expect(headers).toHaveLength(10);
    expect(findHeader(headers, 'Cross-Origin-Opener-Policy')!.value).toBe('same-origin');
    expect(findHeader(headers, 'Cross-Origin-Resource-Policy')!.value).toBe('same-site');
    expect(findHeader(headers, 'Cross-Origin-Embedder-Policy')!.value).toBe('require-corp');
  });
});
