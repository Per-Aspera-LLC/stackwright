# Content Security Policy (CSP) Best Practices for Next.js

*This guide provides practical, implementable patterns for securing Next.js applications with CSP headers, security headers, and Permissions-Policy directives.*

---

## Table of Contents

1. [Quick Start: Complete next.config.js Example](#quick-start-complete-nextconfigjs-example)
2. [Recommended CSP Directives](#recommended-csp-directives)
3. [Next.js 14/15 App Router Patterns](#nextjs-1415-app-router-patterns)
4. [Google Fonts Configuration](#google-fonts-configuration)
5. [Permissions-Policy Directives](#permissions-policy-directives)
6. [Common Gotchas & Mistakes](#common-gotchas--mistakes)
7. [Testing Your CSP](#testing-your-csp)
8. [Report-URI & CSP Violation Monitoring](#report-uri--csp-violation-monitoring)

---

## Quick Start: Complete next.config.js Example

```javascript
// next.config.js
const securityHeaders = [
  {
    // Content Security Policy
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://images.unsplash.com https://*.unsplash.com;
      connect-src 'self' https://api.example.com wss://*.example.com;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim(),
  },
  {
    // X-Content-Type-Options prevents MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // X-Frame-Options prevents clickjacking
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // X-XSS-Protection (legacy browsers)
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Referrer-Policy controls information in the Referer header
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Permissions-Policy restricts browser features
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    // Strict-Transport-Security enforces HTTPS
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Recommended CSP Directives

### Core Directives (Required)

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Fallback for all resource types |
| `script-src` | `'self'` | Restrict JavaScript sources |
| `style-src` | `'self' 'unsafe-inline'` | Stylesheets (unsafe-inline often needed for Next.js) |
| `img-src` | `'self' data: https:` | Images (data: for inline images, https: for external) |
| `font-src` | `'self' https://fonts.gstatic.com` | Web fonts |
| `connect-src` | `'self'` | AJAX, WebSocket, fetch sources |
| `frame-src` | `'none'` | Prevent embedding in iframes |
| `object-src` | `'none'` | Disable Flash and plugins |
| `base-uri` | `'self'` | Restrict `<base>` element |
| `form-action` | `'self'` | Restrict form submission targets |
| `frame-ancestors` | `'none'` | Prevent clickjacking |

### Directive Values Explained

```javascript
// Common source values
'self'           // Same origin only
'none'           // Block completely
'unsafe-inline'  // Allow inline scripts/styles (⚠️ weakens CSP)
'unsafe-eval'    // Allow eval() (⚠️ security risk)
'nonce-abc123'   // Allow specific inline script with nonce
data:            // Data URLs (base64 images, etc.)
https:           // All HTTPS URLs (any domain)
'domain.com'     // Specific domain
'*.domain.com'   // Any subdomain
```

### Script-Src Options for Next.js

Next.js has specific script loading requirements:

```javascript
// Conservative (requires work for Next.js)
'script-src': "'self'"

// Recommended for most Next.js apps
'script-src': "'self' 'unsafe-inline' 'unsafe-eval'"

// If using inline scripts with nonces (most secure)
// Requires nonce generation in _document.tsx
'script-src': "'self' 'nonce-{NONCE_VALUE}'"
```

---

## Next.js 14/15 App Router Patterns

### App Router (app/)

For Next.js 14+ with App Router, use middleware for headers:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https: blob:;
    connect-src 'self' https://api.example.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Pages Router (_app.tsx approach)

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

---

## Google Fonts Configuration

### Using Next.js Font Module (Recommended)

```javascript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

CSP for Next.js fonts (automatically handled):
```javascript
'font-src': "'self' https://fonts.gstatic.com"
```

### Using Google Fonts Link Tag

If using `<link>` tags for Google Fonts:

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
`.replace(/\s{2,}/g, ' ').trim();

// Add to headers...
```

### Preconnect for Performance

```html
<!-- In your _document.tsx or layout.tsx Head -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

---

## Permissions-Policy Directives

The `Permissions-Policy` header controls browser APIs and features.

### Common Directives

```javascript
// Disable all features by default
'Permissions-Policy': 'fullscreen=(self), microphone=(), camera=(), geolocation=(), payment=()'

// More granular control
'Permissions-Policy': `
  camera=(self "https://example.com"),
  microphone=(self "https://example.com"),
  geolocation=(self),
  payment=(),
  usb=(),
  interest-cohort=()
`.replace(/\s{2,}/g, ' ').trim()
```

### Directive Reference

| Directive | Recommended | Notes |
|-----------|-------------|-------|
| `geolocation` | `()` | Disable location tracking |
| `microphone` | `()` | Disable microphone access |
| `camera` | `()` | Disable camera access |
| `payment` | `()` | Disable payment API unless needed |
| `usb` | `()` | Disable USB access |
| `interest-cohort` | `()` | Disable FLoC tracking |
| `accelerometer` | `()` | Disable motion sensors |
| `autoplay` | `()` | Control media autoplay |
| `fullscreen` | `(self)` | Allow only same-origin |
| `web-share` | `()` | Disable Web Share API |

---

## Common Gotchas & Mistakes

### 1. **Whitespace in CSP Values**

```javascript
// ❌ WRONG - extra whitespace breaks CSP parsing
value: `
  default-src 'self';
  script-src 'self';
`

// ✅ CORRECT - normalize whitespace
value: `
  default-src 'self';
  script-src 'self';
`.replace(/\s{2,}/g, ' ').trim()
```

### 2. **Forgetting upgrade-insecure-requests**

```javascript
// ✅ Include this to auto-upgrade HTTP to HTTPS
'upgrade-insecure-requests'
```

### 3. **Blocking Google Fonts**

If fonts don't load:
```javascript
'font-src': "'self' https://fonts.gstatic.com"
'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com"
```

### 4. **Blocking Images in Next.js Image Component**

```javascript
// Next.js Image component needs these
'img-src': "'self' data: blob: https://images.unsplash.com https://*.unsplash.com https://*.maptiler.com"
```

### 5. **Blocking WebSocket Connections**

```javascript
// If using real-time features
'connect-src': "'self' wss://realtime.example.com https://api.example.com"
```

### 6. **Report-Only Mode for Testing**

```javascript
// Use Content-Security-Policy-Report-Only during testing
key: 'Content-Security-Policy-Report-Only',
value: `
  default-src 'self';
  report-uri /api/csp-violations;
  report-to csp-group;
`.trim()
```

### 7. **nonce-* Not Working with React 18**

React 18's streaming SSR doesn't fully support nonces yet:
- Stick with `'unsafe-inline'` for now in most cases
- Or use `report-only` mode for monitoring while developing

---

## Testing Your CSP

### Using Report-Only Mode

```javascript
// next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // Report-only mode - doesn't block, just reports violations
        {
          key: 'Content-Security-Policy-Report-Only',
          value: `
            default-src 'self';
            script-src 'self' 'unsafe-inline';
            report-uri /api/csp-report;
            report-to csp-endpoint;
          `.replace(/\s{2,}/g, ' ').trim(),
        },
      ],
    },
  ];
}
```

### CSP Evaluator

Use Google's [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to check your CSP for weaknesses.

### Browser DevTools

1. Open DevTools → Console
2. CSP violations appear as red error messages
3. Network tab shows blocked resources

### Automated Testing

```javascript
// test/security-headers.test.ts
describe('Security Headers', () => {
  it('should have CSP header', async () => {
    const response = await fetch('https://yoursite.com');
    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
  });

  it('should have X-Frame-Options set to DENY', async () => {
    const response = await fetch('https://yoursite.com');
    const xfo = response.headers.get('X-Frame-Options');
    expect(xfo).toBe('DENY');
  });
});
```

---

## Report-URI & CSP Violation Monitoring

### Setting Up Violation Reports

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  report-uri https://your-csp-reporter.example.com/api/csp-report;
  report-to csp-group;
`.trim();
```

### Report-To Configuration

```javascript
// In headers
{
  key: 'Report-To',
  value: JSON.stringify({
    group: 'csp-group',
    max_age: 10886400,
    endpoints: [
      { url: 'https://your-reporter.example.com/csp-reports' }
    ],
  }),
}
```

### Free CSP Monitoring Services

- **CSP Auditor** (https://csper.io)
- **Report URI** (https://report-uri.com)
- **Safetix** (https://safetix.io)

---

## Stackwright Integration

Stackwright projects can add CSP headers via `createStackwrightNextConfig()`:

```javascript
// next.config.js
const { createStackwrightNextConfig } = require('@stackwright/nextjs');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self';
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      object-src 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim(),
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
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig = createStackwrightNextConfig({
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
});

module.exports = nextConfig;
```

---

## Summary Checklist

- [ ] Add `Content-Security-Policy` header
- [ ] Include `X-Content-Type-Options: nosniff`
- [ ] Add `X-Frame-Options: DENY`
- [ ] Set `Referrer-Policy`
- [ ] Configure `Permissions-Policy` to disable unused features
- [ ] Enable `Strict-Transport-Security`
- [ ] Add `upgrade-insecure-requests` directive
- [ ] Whitelist Google Fonts domains
- [ ] Test with `report-only` mode first
- [ ] Monitor violations before enforcing

---

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Next.js Security Headers Guide](https://nextjs.org/docs/app/guides/security-headers)
- [Mozilla Observatory](https://observatory.mozilla.org/)
