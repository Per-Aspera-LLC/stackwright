export interface SecurityHeadersOptions {
  contentSecurityPolicy?: {
    reportUri?: string;
    customDirectives?: Record<string, string>;
  };
  strictTransportSecurity?: {
    maxAge?: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xFrameOptions?: 'DENY' | 'SAMEORIGIN';
  referrerPolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  permissionsPolicy?: {
    camera?: string[];
    microphone?: string[];
    geolocation?: string[];
    interestCohort?: string[];
  };
  /**
   * Cross-Origin-Opener-Policy controls whether the document can share browsing context group with cross-origin documents.
   * - 'same-origin': Enables cross-origin isolation (required for SharedArrayBuffer, performance.measureMemory)
   * - 'same-origin-allow-popups': Allows popups from cross-origin pages while isolating the document
   * - 'unsafe-none': Default, allows sharing with cross-origin documents (not recommended)
   */
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  /**
   * Cross-Origin-Resource-Policy controls which cross-origin requests can load resources from this document.
   * - 'same-origin': Only same-origin requests can load resources
   * - 'same-site': Same-site requests (including cross-origin on same site) can load resources
   * - 'cross-origin': Any cross-origin request can load resources (not recommended)
   */
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin';
  /**
   * Cross-Origin-Embedder-Policy controls whether the document can load cross-origin resources without explicit permission.
   * - 'require-corp': Cross-origin resources must explicitly grant permission via CORS or CORP headers
   * - 'credentialless': Like require-corp but doesn't block cross-origin resources without credentials
   * - 'no-cors': Allows loading cross-origin resources without CORS (not recommended)
   */
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | 'no-cors';
}

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s{2,}/g, ' ').trim();
}

export function buildCSP(options?: SecurityHeadersOptions): string {
  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  // Apply custom directives (allows overriding default directives)
  if (options?.contentSecurityPolicy?.customDirectives) {
    for (const [directive, value] of Object.entries(
      options.contentSecurityPolicy.customDirectives
    )) {
      // Remove existing directive if present, then add custom one
      const existingIndex = directives.findIndex((d) => d.startsWith(`${directive} `));
      if (existingIndex !== -1) {
        directives.splice(existingIndex, 1);
      }
      directives.push(`${directive} ${value}`);
    }
  }

  if (options?.contentSecurityPolicy?.reportUri) {
    directives.push(`report-uri ${options.contentSecurityPolicy.reportUri}`);
  }

  return normalizeWhitespace(directives.join('; '));
}

export function buildPermissionsPolicy(options?: SecurityHeadersOptions): string {
  const defaultPolicies = {
    camera: '()',
    microphone: '()',
    geolocation: '()',
    interestCohort: '()',
  };

  const userPolicies = options?.permissionsPolicy || {};
  const policies = [
    `camera=${userPolicies.camera?.length ? `(${userPolicies.camera.join(', ')})` : defaultPolicies.camera}`,
    `microphone=${userPolicies.microphone?.length ? `(${userPolicies.microphone.join(', ')})` : defaultPolicies.microphone}`,
    `geolocation=${userPolicies.geolocation?.length ? `(${userPolicies.geolocation.join(', ')})` : defaultPolicies.geolocation}`,
    `interest-cohort=${userPolicies.interestCohort?.length ? `(${userPolicies.interestCohort.join(', ')})` : defaultPolicies.interestCohort}`,
  ];

  return normalizeWhitespace(policies.join(', '));
}

export interface SecurityHeader {
  key: string;
  value: string;
}

export const defaultSecurityHeaders: SecurityHeader[] = [
  {
    key: 'Content-Security-Policy',
    value: buildCSP(),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: buildPermissionsPolicy(),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless',
  },
];

export function buildSecurityHeaders(options?: SecurityHeadersOptions): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    {
      key: 'Content-Security-Policy',
      value: buildCSP(options),
    },
    {
      key: 'X-Content-Type-Options',
      value: 'nosniff',
    },
    {
      key: 'X-Frame-Options',
      value: options?.xFrameOptions || 'DENY',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
    {
      key: 'Referrer-Policy',
      value: options?.referrerPolicy || 'strict-origin-when-cross-origin',
    },
    {
      key: 'Permissions-Policy',
      value: buildPermissionsPolicy(options),
    },
    {
      key: 'Strict-Transport-Security',
      value: buildHSTS(options),
    },
  ];

  // Add cross-origin isolation headers
  if (options?.crossOriginOpenerPolicy) {
    headers.push({
      key: 'Cross-Origin-Opener-Policy',
      value: options.crossOriginOpenerPolicy,
    });
  }

  if (options?.crossOriginResourcePolicy) {
    headers.push({
      key: 'Cross-Origin-Resource-Policy',
      value: options.crossOriginResourcePolicy,
    });
  }

  if (options?.crossOriginEmbedderPolicy) {
    headers.push({
      key: 'Cross-Origin-Embedder-Policy',
      value: options.crossOriginEmbedderPolicy,
    });
  }

  return headers;
}

export function buildHSTS(options?: SecurityHeadersOptions): string {
  const maxAge = options?.strictTransportSecurity?.maxAge ?? 31536000;
  const includeSubDomains = options?.strictTransportSecurity?.includeSubDomains !== false;
  const preload = options?.strictTransportSecurity?.preload !== false;

  const parts = [`max-age=${maxAge}`];
  if (includeSubDomains) {
    parts.push('includeSubDomains');
  }
  if (preload) {
    parts.push('preload');
  }

  return parts.join('; ');
}

/**
 * Gets security headers synchronously.
 * @deprecated This function is kept for future extensibility but currently adds no value over buildSecurityHeaders.
 */
export function getSecurityHeaders(options?: SecurityHeadersOptions): SecurityHeader[] {
  return buildSecurityHeaders(options);
}

/**
 * Creates Next.js headers configuration for security headers.
 * This is a convenience function that wraps buildSecurityHeaders for Next.js config format.
 */
export function createSecurityHeadersConfig(options?: SecurityHeadersOptions): {
  source: string;
  headers: SecurityHeader[];
} {
  return {
    source: '/(.*)',
    headers: buildSecurityHeaders(options),
  };
}
