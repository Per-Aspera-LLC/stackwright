# Stackwright Pro — Vision Document

*Draft, March 2026. Rough and specific by design.*

---

## What This Repo Is

`stackwright-pro` contains closed-source packages that extend the open-source Stackwright framework into paid territory. The OSS monorepo defines interfaces; this repo ships implementations of those interfaces that are too specialized, too maintenance-intensive, or too commercially sensitive to maintain in the open.

The OSS/pro split is clean by design:
- OSS: interfaces, rendering engine, file-backed implementations, framework adapters
- Pro: third-party API integrations, backend compilation, serverless service definitions, OpenAPI tooling

A user's application never takes a hard dependency on pro packages. They register a pro provider the same way they register any Stackwright provider. Removing the pro package degrades gracefully to the file-backed fallback.

---

## Near-Term Pro Tier (CMS Collection Providers)

The first pro packages are CMS backends for the `CollectionProvider` interface introduced in the OSS `@stackwright/collections` package.

### Why these are paid

Third-party CMS SDKs break. Contentful has shipped 3 major SDK versions in 5 years. Sanity's GROQ API has evolved continuously. Shopify's Storefront API versioning is aggressive. Maintaining these integrations so that Stackwright users don't have to is a real, ongoing service — not a one-time implementation.

### Planned providers

| Package | Backend | Notes |
|---|---|---|
| `@stackwright-pro/collections-contentful` | Contentful Delivery API | GROQ-style filtering via CollectionListOptions |
| `@stackwright-pro/collections-sanity` | Sanity GROQ | Portable Text → ContentItem[] conversion |
| `@stackwright-pro/collections-shopify` | Shopify Storefront API | Products, collections, variants as Stackwright entries |
| `@stackwright-pro/collections-airtable` | Airtable REST API | Table = collection, row = entry |
| `@stackwright-pro/collections-notion` | Notion API | Database = collection, page = entry |

Each provider implements `CollectionProvider` exactly. Switching backends is a one-line change in `layout.tsx`. The YAML content files never change.

---

## Medium-Term: OpenAPI Integration

### The problem it solves

Government agencies, enterprises, and API-first startups have OpenAPI specs. Today, consuming a new API requires: reading the spec, writing TypeScript types, writing fetch wrappers, wiring up error handling, building UI components. That's days of work per integration.

### `@stackwright-pro/openapi`

A prebuild plugin that takes an OpenAPI spec (URL or local file) and emits:

1. **A typed `CollectionProvider`** backed by the API's list/get endpoints
2. **Zod schemas** inferred from the OpenAPI response schemas
3. **TypeScript types** for all response shapes
4. **A client module** with typed fetch functions for every endpoint

Configuration in `stackwright.yml`:

```yaml
integrations:
  - type: openapi
    name: reports
    spec: https://api.example.gov/openapi.json
    # or: spec: ./specs/reports-api.yaml
    auth:
      type: bearer
      token: $API_TOKEN
    collections:
      - endpoint: /reports
        slug_field: id
      - endpoint: /reports/{id}
```

Prebuild output:
```
public/stackwright-content/collections/reports/_index.json
public/stackwright-content/collections/reports/<id>.json
src/generated/reports/types.ts
src/generated/reports/client.ts
src/generated/reports/schemas.ts   ← Zod schemas for runtime validation
```

The UI layer doesn't change. A `collection_listing` content type pointing at `reports` renders the API data the same way it renders blog posts. The SME describes the data source; the framework generates the wiring.

### Why this matters for government/defense use cases

Government IT environments often have:
- Existing APIs with OpenAPI specs (or at least a Swagger UI endpoint)
- Data that must be presented in a specific, validated format
- No tolerance for applications that break on bad data
- Very short timelines for prototyping

Stackwright + `@stackwright-pro/openapi` turns "here is an API spec" into "here is a working, validated, typed UI" in hours. The schema constraint isn't a limitation — it's the safety guarantee that lets you demo to a general officer without the app blowing up on unexpected data.

---

## Long-Term Vision: Full-Stack Composition Compiler

*This is the ambitious direction. Write it down now so it doesn't get lost.*

### The thesis

Stackwright currently compiles YAML → Next.js frontend. The same compositional approach — declarative definitions, schema-constrained, AI-writable, escape-hatch-preserving — can be extended to the backend. The result is a full-stack application compiler where the entire system is described in validated YAML and the output is a deployable, production-ready application.

This is not "AI writes your app." It is "your app is a validated composition of typed, schema-constrained pieces." AI fills in the pieces. The framework enforces correctness and generates the wiring.

### `@stackwright-pro/services`

YAML-defined serverless endpoints. Each service definition specifies:
- Trigger (HTTP, queue, schedule, event)
- Data source (RDS, DynamoDB, S3, external API)
- Input/output schema (Zod schema reference)
- Auth requirements

```yaml
# services/get-report.yaml
type: lambda
trigger: http_get
path: /api/reports/:id
auth: bearer
data_source:
  type: rds
  connection: $RDS_CONNECTION_STRING
  query: SELECT * FROM reports WHERE id = :id
response_schema: Report
```

Prebuild (or a separate `stackwright-compile` step) emits:
- A typed Lambda handler (TypeScript)
- IAM role definition (least privilege, derived from data_source)
- API Gateway route configuration
- A typed client module importable by the frontend (`import { getReport } from '@/generated/services/get-report'`)
- Infrastructure-as-code (CDK or Terraform, configurable)

The frontend YAML can reference services directly:

```yaml
# content/pages/reports/content.yaml
- type: collection_listing
  collection: reports
  data_source: service:get-reports   # ← references services/get-reports.yaml
  label: Field Reports
```

### `@stackwright-pro/infra`

Infrastructure composition layer. Describes the full deployment target:

```yaml
# stackwright-infra.yaml
provider: aws
region: us-east-1
frontend:
  type: nextjs
  deployment: vercel   # or: cloudfront, amplify
backend:
  type: lambda
  runtime: nodejs20
database:
  type: rds
  engine: postgres
  instance: t3.micro
storage:
  type: s3
  buckets:
    - name: content
      public: false
    - name: uploads
      public: true
```

`stackwright-compile` reads this alongside service definitions and page definitions and emits a complete, deployable application: frontend build, Lambda functions, CDK stack, environment variable definitions, IAM policies.

### What this unlocks at a hackathon

**The NDIA scenario (or similar government/defense innovation event):**

Day 1 morning: a government team shows up with:
- An existing API with an OpenAPI spec (or a CSV export from a legacy system)
- Subject matter experts who know what the data means
- A problem statement and a general sense of what a solution looks like

Day 1 afternoon, with Stackwright Pro:
1. Point `@stackwright-pro/openapi` at the spec → typed collection provider, Zod schemas, client generated
2. AI agent writes YAML page definitions describing the UI: dashboards, report listings, detail views
3. `@stackwright-pro/services` generates any needed backend logic (filtering, aggregation, auth)
4. `stackwright-compile` generates the full deployment package

Day 2: working application, deployed, available to demo. The remaining days are spent refining the UI (more YAML, AI-assisted), adding features, and rehearsing the pitch.

**The pitch to the brass:** "This is not a mockup. This is a production-ready application that runs on your infrastructure, owns nothing to us, and can be handed to your in-house developers the day after the hackathon to extend however they need." The escape hatch — the fact that the output is standard Next.js + Lambda + CDK — is the thing that closes the room.

---

## Monetization Structure

### OSS (free, always)
- Stackwright core framework
- File-backed collection provider
- S3 collection provider
- shadcn/Tailwind/Lucide UI adapter
- MCP server, CLI, build scripts
- Next.js adapter

### Pro (subscription, per-seat or per-project TBD)
- CMS collection providers (Contentful, Sanity, Shopify, Airtable, Notion)
- `@stackwright-pro/openapi` — API spec → typed collection provider + client
- `@stackwright-pro/services` — YAML → serverless function compiler
- `@stackwright-pro/infra` — full-stack deployment compiler
- Priority support + integration maintenance SLA

### Why subscription over one-time

Third-party APIs change. The value of pro is not the initial implementation — it's that we track API changes, update the providers, and test against the live APIs continuously. That is an ongoing service, priced accordingly.

---

## Constraints That Must Not Be Violated

Even as Stackwright grows toward full-stack, these constraints from the OSS philosophy must hold:

1. **Output is always standard code.** Lambda handlers are TypeScript. CDK stacks are CDK. The user can eject from Stackwright and maintain the output directly. No proprietary runtime.

2. **The schema is the contract.** Every service definition, infrastructure block, and collection schema is validated at compile time. The system fails loudly before deployment, not silently in production.

3. **The escape hatch is real.** A developer should be able to open any Stackwright-compiled application and work in it immediately without knowing Stackwright exists.

4. **AI writes the YAML; the framework enforces correctness.** The constraint is the moat. A loose schema produces unpredictable AI output. A tight schema produces reliable, reviewable, deployable output.

---

Additional pro differentiator:  maintainer was CAC auth and OIDC expert at Leidos, including writing a custom keycloak/api gateway/cac auth authentication system fronting an 8 billion dollar contract.  YAML defined out of the box CAC auth would kill at a government demo.  Just avoid keycloak support unless someone pays you a lot of money...

auth:
  type: oidc
  provider: cognito        # or: azure_ad, ping, okta — keycloak is a valid value but unsupported
  roles:
    - ANALYST
    - ADMIN
  cac_required: true


*Keep this document rough. Refine it when building, not before.*
