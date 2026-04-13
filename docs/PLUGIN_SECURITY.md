# Plugin Security Guide

*This guide establishes security requirements and best practices for Stackwright plugin developers. For framework security architecture, see [security-model-for-docs.md](./security-model-for-docs.md).*

---

## Trust Model

Plugins are **user-controlled code** that executes during the prebuild phase with the same filesystem access as the CLI user. Stackwright provides hooks, not sandboxing.

### Security Contract

By registering a plugin, you acknowledge:

- Plugins can read/write any file accessible to the CLI process
- Plugins execute before static content is generated
- Plugin failures during `beforeBuild` hooks **abort the build**
- Plugin failures during `afterBuild` hooks **do not** abort the build (non-critical)
- The framework validates plugin context but not plugin output

---

## Plugin Author Responsibilities

### 1. Input Validation

Always validate all `PrebuildPluginContext` fields before use:

```typescript
// ✅ DO: Validate context fields
const projectRoot = context.projectRoot;
if (!path.isAbsolute(projectRoot)) {
  throw new Error('projectRoot must be an absolute path');
}

// ✅ DO: Validate user-provided config with Zod schemas
import { z } from 'zod';
const ConfigSchema = z.object({
  apiUrl: z.string().url(),
  timeout: z.number().positive().max(30000).default(5000),
});
const config = ConfigSchema.parse(context.config);

// ❌ DON'T: Use .passthrough() without plugin-specific validation
const unsafe = yaml.load(userInput); // Dangerous!
```

### 2. Path Safety

Use canonical path resolution and prefix checks for all file operations:

```typescript
import path from 'path';
import fs from 'fs';

// ✅ DO: Validate paths stay within projectRoot
function safeWrite(projectRoot: string, relativePath: string, content: string) {
  const resolved = path.resolve(projectRoot, relativePath);
  if (!resolved.startsWith(projectRoot + path.sep)) {
    throw new Error('Path traversal blocked: ' + relativePath);
  }
  fs.writeFileSync(resolved, content, 'utf8');
}

// ❌ DON'T: Arbitrary file write with user input
fs.writeFileSync(path.join(projectRoot, userInput), content); // Dangerous!
```

### 3. Command Execution

Use parameterized execution only:

```typescript
import { execFile } from 'child_process';

// ✅ DO: Parameterized execution
execFile('tar', ['-xzf', tarFile, '--strip-components=1'], { cwd: targetDir }, (err) => {
  // Handle error
});

// ❌ DON'T: Shell execution with user input
exec(`tar -xzf ${tarFile}`); // Shell injection risk!
```

### 4. Error Handling

Catch and log errors gracefully; don't let unhandled exceptions crash builds:

```typescript
// ✅ DO: Graceful error handling
try {
  await processUserConfig(context);
} catch (error) {
  console.error(`[plugin:my-plugin] Config processing failed:`, error);
  throw new PluginError('Failed to process config', { cause: error });
}

// ❌ DON'T: Swallow errors silently
try { ... } catch {}

## 5. Secret Management

- ✅ DO: Accept env var references (`$API_TOKEN`)
- ✅ DO: Read secrets from environment variables
- ❌ DON'T: Log secret values, even in debug mode
- ❌ DON'T: Write secrets to generated code or output files

```typescript
// ✅ DO: Resolve env var references
function resolveSecret(value: string): string {
  if (value.startsWith('$')) {
    const envKey = value.slice(1);
    const envValue = process.env[envKey];
    if (!envValue) {
      throw new Error(`Environment variable ${envKey} is not set`);
    }
    return envValue;
  }
  return value;
}

// ❌ DON'T: Log secrets
console.log('API Token:', apiToken); // Dangerous!
```

### 6. Generated Code Safety

- ✅ DO: Generate TypeScript with strict typing
- ✅ DO: Use Zod schemas for runtime validation
- ❌ DON'T: Generate `eval()`, `Function()`, or inline event handlers
- ❌ DON'T: Interpolate user input into code without escaping

---

## SSRF Prevention

If your plugin fetches remote resources, implement SSRF protection:

### URL Validation

```typescript
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;

    // Allow localhost for development (127.x.x.x and IPv6 loopback)
    if (/^(localhost|127\.\d+\.\d+\.\d+|::1)$/.test(host)) {
      return true;
    }

    // Block RFC 1918 private ranges
    if (/^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/.test(host)) {
      return false; // RFC 1918 — blocked
    }

    // Block cloud metadata endpoints
    if (host.endsWith('.metadata.google.internal') ||
        host === '169.254.169.254' ||
        host === 'metadata.azure.com') {
      return false; // Cloud metadata — blocked
    }

    // Enforce HTTPS in production
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
```

### Response Size Limits

```typescript
// ✅ DO: Limit response sizes to prevent memory exhaustion
const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

async function safeFetch(url: string): Promise<string> {
  const response = await fetch(url);
  const contentLength = response.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
    throw new Error('Response too large');
  }
  
  const text = await response.text();
  if (text.length > MAX_RESPONSE_SIZE) {
    throw new Error('Response too large');
  }
  
  return text;
}
```

### Rate Limiting Guidance

Protect against abuse and resource exhaustion with rate limiting:

```typescript
// ✅ DO: Implement request throttling for external APIs
const rateLimiter = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  requests: new Map<string, number[]>(),

  check(identifier: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(identifier) || [];
    const recent = timestamps.filter(t => now - t < this.windowMs);
    
    if (recent.length >= this.maxRequests) {
      return false; // Rate limit exceeded
    }
    
    recent.push(now);
    this.requests.set(identifier, recent);
    return true;
  },

  getRetryAfter(identifier: string): number {
    const timestamps = this.requests.get(identifier) || [];
    const now = Date.now();
    const oldest = timestamps.find(t => now - t < this.windowMs);
    return oldest ? Math.ceil((this.windowMs - (now - oldest)) / 1000) : 0;
  }
};

// ✅ DO: Use rate limiter before making API calls
function safeApiCall(url: string, identifier: string): void {
  if (!rateLimiter.check(identifier)) {
    const retryAfter = rateLimiter.getRetryAfter(identifier);
    throw new Error(`Rate limit exceeded. Retry after ${retryAfter}s`);
  }
  // Proceed with API call
}

// ✅ DO: Set appropriate timeouts for all network requests
const DEFAULT_TIMEOUT = 10_000; // 10 seconds

async function fetchWithTimeout(url: string, timeout = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
```

**Recommended rate limits:**
- External API calls: 60-100 requests/minute per identifier
- File downloads: 10-20 requests/minute per host
- Build-time fetches: 30-second timeout maximum
- Use exponential backoff for retry logic

---

## Security Review Checklist

Before releasing a plugin, verify:

### Configuration Validation
- [ ] All config fields validated with Zod schemas
- [ ] Schema uses `.parse()` not `.passthrough()`
- [ ] Invalid config fails build with clear error message
- [ ] TypeScript types match schema validation

### Secret Handling
- [ ] No hardcoded credentials in source code
- [ ] Secrets read from environment variables
- [ ] No secret values logged (even at debug level)
- [ ] Secrets not written to output files

### Path Safety
- [ ] All file paths validated with prefix checks
- [ ] Symlinks are rejected or validated
- [ ] No path traversal vulnerabilities (test with `../../../etc/passwd`)
- [ ] Files written only to intended directories

### Generated Code
- [ ] No `eval()`, `Function()`, or `setTimeout(string)`
- [ ] User input escaped when interpolated into code
- [ ] Generated TypeScript is syntactically valid
- [ ] Tests include malicious input scenarios

### Network Security
- [ ] URLs validated against allowlist (if applicable)
- [ ] RFC 1918 addresses blocked
- [ ] Cloud metadata endpoints blocked
- [ ] Response sizes limited
- [ ] TLS/HTTPS enforced

### Testing
- [ ] Unit tests for validation functions
- [ ] Integration tests with malicious inputs
- [ ] Path traversal test cases
- [ ] SSRF prevention test cases

---

## Third-Party Plugin Auditing

Before using a third-party plugin:

1. **Review the source code** for filesystem/network access patterns
2. **Check for hardcoded secrets** or credential embedding
3. **Verify error handling** — no unhandled rejections
4. **Test in a sandbox project** before production use
5. **Check for dependencies** with known vulnerabilities
6. **Review maintainer reputation** and release history

### Red Flags

🚨 **DO NOT USE** a plugin that:
- Contains obfuscated or minified code you can't review
- Requests excessive permissions (e.g., network access when not needed)
- Has not been updated in over 6 months
- Has unresolved security issues in its dependencies
- Requires you to disable security features

---

## Reporting Plugin Security Issues

Contact security@per-aspera.dev with:
- Plugin name and version
- Vulnerable code pattern
- Proof-of-concept (if applicable)
- Steps to reproduce

---

## Related Documents

- [CONTRIBUTING.md](../CONTRIBUTING.md) — General contribution guidelines
- [AGENTS.md](../AGENTS.md) — AI agent guidance
- [security-model-for-docs.md](./security-model-for-docs.md) — Framework security architecture

---

*Last updated: 2026-04-13*
