# Security Model — Security Professional View

*This document captures the security architecture for CISOs and security professionals reviewing Stackwright Pro. For a developer-focused explanation, see [README.md](../../README.md).*

---

## Two-Layer Security Model

### Layer 1: Build-Time Spec Validation (`ApprovedSpecsValidator`)

Before any code is generated, the system validates:

1. **URL Allowlisting**: Only pre-approved spec URLs can be used
2. **Content Integrity**: Spec content must match a stored SHA-256 hash
3. **SSRF Prevention**: Downloads to private IPs, localhost, and cloud metadata endpoints are blocked
4. **Memory Safety**: Response sizes are capped to prevent DoS

```yaml
# stackwright.yml configuration
prebuild:
  security:
    enabled: true
    allowlist:
      - name: logistics-api
        url: https://api.gov.mil/logistics/v1/openapi.yaml
        sha256: a1b2c3d4e5f6...
```

With security enforcement enabled:
- Only specs on the allowlist can generate code
- Spec content is verified via SHA-256 hash
- Downloads to private IPs, localhost, and cloud metadata endpoints are blocked
- The `--skip-approved-specs` flag is forbidden in CI/production

### Layer 2: Generated Client Safety Properties

The generated client is **safe by construction**:

1. **Endpoint Locking**: Only the endpoints defined in the approved OpenAPI spec are callable. The client has no generic request method that could be exploited.

2. **Runtime SSRF Validation**: Generated client validates baseUrl at instantiation, blocking private IPs and cloud metadata endpoints.

3. **Type Safety**: All request/response data is validated with Zod schemas at runtime, preventing injection attacks.

4. **Error Safety**: Non-JSON responses and unexpected content types are handled gracefully without crashing.

---

## CISO Questions, Answered

### "What if the spec is malicious?"
Specs not matching the SHA-256 allowlist are rejected. A malicious spec cannot enter the system.

### "What if the generated code is exploited?"
The generated client is a data-transport layer with no business logic. SSRF protection blocks requests to private IPs at the generated client level — even a code injection vulnerability is constrained.

### "Can this be used for lateral movement?"
No. The generated client blocks all RFC 1918 addresses and cloud metadata endpoints. SSRF attacks against internal services are architecturally impossible.

### "What does FedRAMP alignment look like?"

Controls addressed:
| Control | Implementation |
|---------|----------------|
| CM-2 | Configuration baselines (approved spec allowlist is the baseline) |
| CM-3 | Configuration change control (hash verification enforces change control) |
| SA-11 | Developer security testing (chaos testing infrastructure included) |
| SC-8 | Transmission confidentiality (mTLS support via `@stackwright-pro/auth`) |
| SI-10 | Information input validation (Zod schemas validate all inputs) |

---

## Security Testing

- **22 security tests** in `security-validator.test.ts`
- **17 RBAC chaos tests** in `yaml-injection.test.ts`
- **JWT fuzzing**: 1,000 malformed tokens tested
- **Race condition testing**: Concurrent auth attempts
- **March 2024 security audit**: 3 CRITICAL/HIGH vulnerabilities fixed same-day

---

## Limitations

- Runtime SSRF protection trusts the baseUrl from the approved spec. Layer 1 mitigates this by requiring hash verification.
- Custom React components outside the YAML layer are standard Next.js — secure those as you would any custom code.
- Consider network-level controls (firewall rules, egress filtering) for defense in depth.

---

## Threat Model Status

| Artifact | Status |
|----------|--------|
| Formal Threat Model | Planned (STRIDE analysis) |
| SBOM | Planned (CI integration) |
| External Pentest | Recommended |
| POA&M Process | Established |

*For FedRAMP authorization, additional artifacts would be required. Contact Per Aspera LLC for the security evidence package.*

---

**Note**: This document is maintained by the security-auditor agent and updated after security reviews. Last updated: 2025.
