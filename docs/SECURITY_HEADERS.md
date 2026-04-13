# Security Headers Guide

*Practical guide to securing your Stackwright applications with HTTP security headers.*

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Default Headers](#default-headers)
4. [Customization](#customization)
5. [CSP Directives Explained](#csp-directives-explained)
6. [Migration Guide](#migration-guide)
7. [Troubleshooting](#troubleshooting)
8. [External Resources](#external-resources)

---

## Overview

Security headers are HTTP response headers that help protect your application against common web vulnerabilities. They're a critical component of **defense-in-depth** — adding layers of protection even when your code is secure.

### Why Security Headers Matter

| Threat | Without Headers | With Headers |
|--------|-----------------|--------------|
| XSS Attacks | Browser executes injected scripts | CSP blocks inline scripts |
| Clickjacking | Site can be embedded in iframe | `X-Frame-Options` blocks embedding |
| MIME Sniffing | Browser may execute wrong content type | `X-Content-Type-Options` stops sniffing |
| Man-in-the-Middle | HTTP connections vulnerable | HSTS forces HTTPS |
| Unwanted Tracking | Browser APIs available by default | `Permissions-Policy` disables unused features |

### OWASP Alignment

Stackwright's security headers implement recommendations from the [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/), which identifies these headers as essential for modern web application security.

### Defense-in-Depth

Security headers don't replace secure coding practices — they complement them:

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                     │
├─────────────────────────────────────────────────────────┤
│  Input Validation │ Output Encoding │ SQL Injection    │ ← Secure Code
├─────────────────────────────────────────────────────────┤
│         CSP │ HSTS │ X-Frame-Options │ Permissions      │ ← Security Headers
├─────────────────────────────────────────────────────────┤
│              WAF │ Network Firewall │ TLS               │ ← Infrastructure
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

Adding security headers to your Stackwright project takes just two steps:

### 1. Update `next.config.ts`

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

module.exports = createStackwrightNextConfig()
export { headers }
```

That's it! Your application now includes all default security headers.

### 2. Verify Headers Are Applied

Start your dev server and check the headers:

```bash
pnpm dev
```

Then in another terminal:

```bash
curl -I http://localhost:3000
```

You should see headers like:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## Default Headers

Stackwright enables ten security headers by default (including three cross-origin isolation headers):

| Header | Default Value | Purpose |
|--------|---------------|---------|
| **Content-Security-Policy** | Complex CSP (see below) | Prevents XSS, clickjacking, and data injection |
| **X-Content-Type-Options** | `nosniff` | Prevents MIME type sniffing |
| **X-Frame-Options** | `DENY` | Prevents clickjacking via iframes |
| **X-XSS-Protection** | `1; mode=block` | Legacy XSS filtering (modern browsers prefer CSP) |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Controls information in the Referer header |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Disables unused browser features |
| **Strict-Transport-Security** | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS connections |
| **Cross-Origin-Opener-Policy** | `same-origin-allow-popups` | Controls browsing context group sharing |
| **Cross-Origin-Resource-Policy** | `same-origin` | Controls cross-origin resource loading |
| **Cross-Origin-Embedder-Policy** | `credentialless` | Controls cross-origin resource embedding |

### Default Content Security Policy

```javascript
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https: blob:;
connect-src 'self';
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

---

## Customization

Stackwright's security headers are fully customizable through the `securityHeaders` option.

### Basic Customization

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

const nextConfig = createStackwrightNextConfig({
  securityHeaders: {
    xFrameOptions: 'SAMEORIGIN',  // Allow embedding from same origin
    referrerPolicy: 'no-referrer',  // Don't send referrer ever
  },
})

module.exports = nextConfig
export { headers }
```

### Advanced Configuration

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

const nextConfig = createStackwrightNextConfig({
  securityHeaders: {
    // Content Security Policy options
    contentSecurityPolicy: {
      reportUri: 'https://your-csp-reporter.example.com/api/csp-violations',
    },

    // Strict Transport Security
    strictTransportSecurity: {
      maxAge: 63072000,  // 2 years (default: 1 year)
      includeSubDomains: true,
      preload: true,
    },

    // X-Frame-Options
    xFrameOptions: 'SAMEORIGIN',

    // Referrer-Policy
    referrerPolicy: 'no-referrer',

    // Permissions-Policy (control browser features)
    permissionsPolicy: {
      camera: ['https://example.com'],    // Allow camera only for example.com
      microphone: ['self'],              // Allow microphone for same origin
      geolocation: ['self'],
      interestCohort: [],                 // Keep disabled
    },
  },
})

module.exports = nextConfig
export { headers }
```

### Production Configuration

For production deployments, you may want to adjust security headers for your specific needs:

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

// Production recommended overrides
const nextConfig = createStackwrightNextConfig({
  securityHeaders: {
    contentSecurityPolicy: {
      // Override for your API domains
      customDirectives: {
        'connect-src': "'self' https://api.yoursite.com wss://yoursite.com",
        'script-src': "'self' 'unsafe-inline'", // Remove unsafe-eval in production
      },
      reportUri: 'https://csper.io/report/your-site-id',
    },
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    crossOriginEmbedderPolicy: 'require-corp',
  },
})

module.exports = nextConfig
export { headers }
```

**Key production changes:**
- Remove `'unsafe-eval'` from `script-src` (or use nonce-based CSP)
- Add your API domains to `connect-src`
- Enable stricter cross-origin isolation with `same-origin` COOP
- Use `require-corp` for COEP (requires CORS/CORP on all cross-origin resources)

> ⚠️ **Important**: Before deploying, test thoroughly! Cross-origin isolation (`COOP: same-origin` + `COEP: require-corp`) can break third-party integrations that don't support CORS.


### Referrer-Policy Reference

| Value | Behavior |
|-------|----------|
| `no-referrer` | Never send referrer |
| `no-referrer-when-downgrade` | Default, send full URL unless going to HTTP |
| `origin` | Only send origin (scheme + host + port) |
| `origin-when-cross-origin` | Full URL for same origin, origin for cross-origin |
| `same-origin` | Only send when same origin |
| `strict-origin` | Origin only when protocol security level same |
| `strict-origin-when-cross-origin` | Full URL same origin, origin for equal security |
| `unsafe-url` | Always send full URL (⚠️ not recommended) |

### Permissions-Policy Values

Each feature can be:
- `()` — Completely disabled
- `(self)` — Enabled only for same-origin
- `('self')` — Same as `self`
- `('https://example.com')` — Enabled for specific origin
- `('self' 'https://example.com')` — Multiple origins


### Cross-Origin Isolation Headers

Stackwright includes three cross-origin isolation headers that enhance security by controlling how your pages interact with cross-origin content.

#### Cross-Origin-Opener-Policy (COOP)

Controls whether the document shares its browsing context group with cross-origin documents.

| Value | Behavior |
|-------|----------|
| `same-origin` | Full isolation — blocks cross-origin windows from accessing this document |
| `same-origin-allow-popups` | **Default** — allows popups but keeps document isolated |
| `unsafe-none` | Allows sharing with cross-origin documents (reduces isolation) |

**Note**: Setting `same-origin` enables cross-origin isolation, which is required for:
- `SharedArrayBuffer` (threading)
- `performance.measureMemory()` API
- `Navigator.share()` with arbitrary files

#### Cross-Origin-Resource-Policy (CORP)

Controls which cross-origin requests can load resources from your pages.

| Value | Behavior |
|-------|----------|
| `same-origin` | **Default** — only same-origin requests can load resources |
| `same-site` | Same-site requests (including cross-origin subdomains) can load |
| `cross-origin` | Any cross-origin request can load (use only for public resources) |

#### Cross-Origin-Embedder-Policy (COEP)

Controls whether the document can load cross-origin resources without explicit permission.

| Value | Behavior |
|-------|----------|
| `credentialless` | **Default** — cross-origin resources load without credentials, or with explicit permission |
| `require-corp` | Cross-origin resources must have CORS or CORP headers to load |
| `no-cors` | Allows loading cross-origin resources without CORS (reduces security) |

**Note**: COEP combined with COOP `same-origin` enables **cross-origin isolation**, unlocking advanced browser features.



---

## CSP Directives Explained

The Content Security Policy is the most powerful security header. Here's what each directive does:

### Source Values

| Value | Meaning |
|-------|---------|
| `'self'` | Same origin (protocol + host + port) |
| `'none'` | Block everywhere |
| `'unsafe-inline'` | Allow inline scripts/styles (⚠️ weakens CSP) |
| `'unsafe-eval'` | Allow `eval()` and similar (⚠️ security risk) |
| `data:` | Data URLs (base64 images, etc.) |
| `https:` | Any HTTPS URL |
| `'nonce-xxx'` | Allow specific inline script with nonce |
| `'strict-dynamic'` | Trust scripts loaded by already-trusted scripts |

### Directive Reference

| Directive | Default in Stackwright | Purpose |
|-----------|------------------------|---------|
| `default-src` | `'self'` | Fallback for unspecified types |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | JavaScript sources |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | Stylesheet sources |
| `font-src` | `'self' https://fonts.gstatic.com` | Font sources |
| `img-src` | `'self' data: https: blob:` | Image sources |
| `connect-src` | `'self'` | XHR, fetch, WebSocket origins |
| `frame-src` | *(inherited from frame-ancestors)* | Iframe sources |
| `frame-ancestors` | `'none'` | Who can embed this page |
| `object-src` | `'none'` | Plugin sources (Flash, Java, etc.) |
| `base-uri` | `'self'` | Valid values for `<base>` element |
| `form-action` | `'self'` | Form submission targets |
| `upgrade-insecure-requests` | enabled | Auto-upgrade HTTP to HTTPS |

### ⚠️ Security Tradeoffs

> **Note on `unsafe-inline` and `unsafe-eval`**: These directives are included for Next.js compatibility out of the box. For production deployments handling sensitive data, consider:
> - Using Next.js's built-in nonce support for inline scripts
> - Using hash-based CSP allowlists for known scripts
> - See the Nonce-Based CSP example below

#### Why `unsafe-inline`?

Next.js requires `'unsafe-inline'` for:
- Component-level styles
- Dynamic styles via CSS-in-JS
- React's internal mechanisms

#### Why `unsafe-eval`?

Required for:
- Some older webpack loaders
- Dynamic code execution patterns
- Certain debugging tools

If you don't use these patterns, you can create a custom CSP without them.

### Nonce-Based CSP (Advanced)

For stricter CSP in production, use Next.js's built-in nonce support:

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

const nextConfig = createStackwrightNextConfig({
  security: {
    generateNonce: true,
  },
})

module.exports = nextConfig
export { headers }
```

Then in your root layout:

```tsx
import { getCspNonce } from 'next/navigation'

export default function RootLayout({ children }) {
  const nonce = getCspNonce()
  
  return (
    <html>
      <head nonce={nonce}>
        <script nonce={nonce} src="..." />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Hash-Based CSP Allowlists

For static scripts, use SHA hashes:

```typescript
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

const nextConfig = createStackwrightNextConfig({
  securityHeaders: {
    contentSecurityPolicy: {
      customDirectives: {
        'script-src': "'self' 'sha256-[your-script-hash]'",
      },
    },
  },
})

module.exports = nextConfig
export { headers }
```

---

## Migration Guide

### For Existing Projects

If you're upgrading an existing Stackwright project to use security headers:

#### Step 1: Update Dependency

```bash
pnpm update @stackwright/nextjs
```

#### Step 2: Update `next.config.ts`

```typescript
// Before
// next.config.ts
const { createStackwrightNextConfig } = require('@stackwright/nextjs')

module.exports = createStackwrightNextConfig({
  // ... existing config
})
```

```typescript
// After
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')

module.exports = createStackwrightNextConfig({
  // ... existing config
})
export { headers }
```

#### Step 3: Test Locally

```bash
pnpm dev
```

Open your browser's DevTools console. You might see CSP violation warnings — this is expected during transition.

#### Step 4: Review Console Violations

Common violations and fixes:

| Violation | Cause | Fix |
|-----------|-------|-----|
| `Refused to load inline script` | Inline `<script>` tag | Move to external file or add nonce |
| `Refused to load style 'inline'` | Inline `<style>` or `style=` attribute | Use CSS classes or allow `unsafe-inline` |
| `Refused to connect` | Fetch/XHR to disallowed origin | Add domain to `connect-src` |
| `Refused to frame` | Embedding in iframe | Remove iframe or adjust `frame-ancestors` |

#### Step 5: Use Report-Only Mode (Optional)

During transition, use report-only to monitor without blocking:

```typescript
// next.config.ts
const { createStackwrightNextConfig, createSecurityHeadersConfig } = require('@stackwright/nextjs')
const { buildSecurityHeaders } = require('@stackwright/nextjs')

module.exports = createStackwrightNextConfig({
  async headers() {
    const securityHeaders = buildSecurityHeaders({
      contentSecurityPolicy: {
        reportUri: '/api/csp-report',
      },
    })

    // Convert to report-only
    const reportOnlyHeaders = securityHeaders.map(h => {
      if (h.key === 'Content-Security-Policy') {
        return { key: 'Content-Security-Policy-Report-Only', value: h.value }
      }
      return h
    })

    return [
      {
        source: '/(.*)',
        headers: reportOnlyHeaders,
      },
    ]
  },
})
```

---

## Troubleshooting

### Headers Not Appearing

**Symptoms:** `curl -I` doesn't show security headers.

**Solutions:**

1. Check that `export { headers }` is present in `next.config.ts`
2. Ensure no typos in the export
3. Restart the dev server after changes
4. Check that headers aren't being overridden elsewhere

### CSP Blocking Legitimate Resources

**Symptoms:** Images don't load, fonts broken, API calls fail.

**Solutions:**

| Issue | Fix |
|-------|-----|
| Images not loading | Add domain to `img-src`: `'self' data: https: blob: https://images.unsplash.com` |
| Fonts broken | Ensure `font-src` includes Google Fonts: `'self' https://fonts.gstatic.com` |
| API calls failing | Add API domain to `connect-src`: `'self' https://api.example.com` |
| CDN resources blocked | Add CDN to appropriate directive |

### HSTS Issues in Development

**Symptoms:** `ERR_SSL_PROTOCOL_ERROR` or redirect loops in local development.

**Solution:** HSTS only applies to HTTPS. In local development over HTTP:
- Headers are still set but browsers won't enforce them
- Production deployments over HTTPS will work correctly
- The `upgrade-insecure-requests` directive only upgrades HTTPS→HTTPS

### Permissions-Policy Blocking Features

**Symptoms:** Camera/microphone/geolocation not working when expected.

**Solution:** Permissions-Policy controls access at the browser level. Ensure:
- The feature is allowed for the origin trying to use it
- User has granted permission (browser prompt)
- Feature is allowed in `permissionsPolicy` config

### Report-URI Not Working

**Symptoms:** CSP violations not being reported.

**Solutions:**

1. Ensure the report endpoint exists and accepts POST requests
2. Check CORS configuration for the report endpoint
3. Verify the `report-uri` directive is in your CSP
4. Consider using `report-to` with a Reporting API endpoint

### Compatibility with Older Browsers

**Symptoms:** Site broken in older browsers.

**Solution:** Security headers are ignored by browsers that don't support them. Stackwright targets modern browsers (last 2 versions of major browsers). For IE11 support, you'll need to either:
- Accept reduced security
- Use polyfills
- Accept CSP violations in older browsers

---

## External Resources

### Tools

- **[CSP Evaluator](https://csp-evaluator.withgoogle.com/)** — Google's tool to check your CSP for weaknesses
- **[Mozilla Observatory](https://observatory.mozilla.org/)** — Scan your site and get security recommendations
- **[Security Headers](https://securityheaders.com/)** — Quick checker with grade rating

### Documentation

- **[OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)** — Official OWASP recommendations
- **[MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)** — Comprehensive CSP documentation
- **[MDN: Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)** — All HTTP security headers
- **[Next.js Security Headers](https://nextjs.org/docs/app/guides/security-headers)** — Official Next.js documentation

### CSP Community

- **[CSP Parser](https://csplite.com/csp/)** — CSP analyzer and validator
- **[CSP Cheat Sheet](https://content-security-policy.com/)** — Quick reference

---

## Summary

Security headers in Stackwright provide:

✅ **Zero-config defaults** — Just export `headers` to get protection  
✅ **Full customization** — Customize any header to fit your needs  
✅ **CSP reporting** — Monitor violations during transition  
✅ **Modern browser support** — Targets current security best practices  
✅ **Defense-in-depth** — Complements secure coding practices  

Get started in 30 seconds:

```typescript
// next.config.ts
const { createStackwrightNextConfig, headers } = require('@stackwright/nextjs')
module.exports = createStackwrightNextConfig()
export { headers }
```

For advanced customization, see the [CSP Best Practices](./CSP-BEST-PRACTICES.md) guide.
