# Stackwright Philosophy

This document captures the product intent and architectural principles behind Stackwright. It is written for agents, contributors, and future maintainers who need to understand not just *what* the framework does, but *why* it is built the way it is — so that new decisions align with the long-term direction rather than inadvertently working against it.

Stackwright's one-sentence thesis: **Visual rendering + constrained DSL + AI iteration = non-technical people building enterprise apps that are safe by construction.**

[CONTRIBUTING.md](./CONTRIBUTING.md) tells you how to work in this repo. [ROADMAP.md](./ROADMAP.md) tells you what to build next. This document tells you what Stackwright is and why it is built the way it is.

---

## The Problem

The people who need websites — small businesses, nonprofits, early-stage startups, internal teams — are permanently bottlenecked on developers. Every solution that has tried to fix this falls into one of two traps:

**The lock-in trap**: Hosted no-code tools (Wix, Webflow, Squarespace, WordPress.com) are fast to start but expensive to escape. The content lives in a proprietary database, the templates are platform-specific, and the exit cost is a full rewrite. Every company that grows past a certain point pays this tax.

**The complexity trap**: Developer-facing tools (Gatsby, Next.js, Contentlayer, MDX) give you full ownership but require enough technical literacy to configure, maintain, and extend. Non-technical teammates can't contribute content without help from the developer the tool was supposed to free them from.

Stackwright's position: both traps are avoidable if you make the right architectural choices early.

---

## The Core Thesis

**Stackwright is not a no-code platform. It is a structured interface over a standard Next.js application.**

The distinction matters:

- A no-code platform owns your content and your runtime. You are a tenant.
- Stackwright produces a Next.js app that you own, can fork, can hand to any React developer, and can extend with arbitrary code. Stackwright is a tool you use to build it, not a platform you live inside.

The YAML files are not a proprietary format. They are configuration for a standard application. The moment a user outgrows what Stackwright provides, a developer can open the repo and write React components alongside the YAML-driven ones — in the same codebase, with no migration, no "export," no rewrite. The transition from "non-developer-maintained site" to "developer-extended web app" is a git commit, not a project.

---

## The Escape Hatch Is a Feature

Most framework documentation acknowledges migration paths reluctantly. For Stackwright, the escape hatch is a selling point that should be stated clearly and kept real.

**The promise**: your content is always a `git clone` away from being completely free of Stackwright. The output is always a standard Next.js app. Any React developer can pick it up and work in it immediately.

**The constraint this imposes on architecture**: Any decision that increases lock-in to Stackwright-specific primitives works against the product. The framework should make it *easier* to write standard React alongside YAML-driven content, not harder. Extension points should be explicit and well-documented. The framework should never require users to stay inside its abstraction longer than they want to.

When evaluating a new architectural decision, ask: does this make the project more or less forkable and developer-extensible? If less, there needs to be a strong reason.

---

## The Constraint Is the Moat

The YAML schema is narrow by design. This is the most important thing to understand about Stackwright's approach to content types.

**Why narrow schemas matter for AI authoring**: When a language model generates content for a Stackwright site, it is generating YAML against a known schema. If the schema is tight and well-specified, generation is reliable and errors are catchable at validation time. If the schema is loose or highly flexible, generation becomes unpredictable and errors surface at render time as broken layouts.

This is the key competitive insight: unconstrained code generation (asking an LLM to write arbitrary React/JSX) is fragile. Schema-constrained YAML generation is tractable. The narrow schema is what makes AI-driven content authoring work reliably — it is not a limitation of the framework, it is the mechanism by which the framework makes AI useful.

**Implication for new content types**: Add content types deliberately. A new content type should represent a genuinely distinct layout pattern that cannot be reasonably achieved by combining existing types. Do not add escape hatches for one-off customizations — those belong in developer-written React components outside the YAML layer. Resist pressure to make the schema "more flexible" in ways that sacrifice predictability.

**Implication for schema fields**: Required fields should be truly required. Optional fields should have sensible defaults. Avoid `any`-typed or unvalidated fields. Every field an agent can write should be validatable before render time.

---

## Verifiable Safety by Construction

The constrained YAML grammar creates a security model that is fundamentally different from traditional application development. This is the insight that makes Stackwright viable as an enterprise platform, not just a website builder.

### The Two-Layer Model

**Layer 1: Build-time enforcement** — Every content file is validated against Zod schemas before it reaches the browser. The prebuild pipeline (`stackwright-prebuild`) runs `siteConfigSchema.safeParse()` and `pageContentSchema.safeParse()` as a gate. If the YAML is invalid, the build fails with a descriptive error.

**Layer 2: Typed generated output** — The validated YAML is compiled into typed JSON that powers React components with full TypeScript discriminated unions. For pro components (OpenAPI integrations), generated clients are **locked at generation time**: they can *only* call endpoints defined in the approved spec. There's no `fetch(url)` — only `getEquipment()`, `listSupplies()`, etc.

### Why This Is Different from "We Scanned It and It Looks Okay"

Traditional security review audits every application individually. The attack surface is unbounded because arbitrary code can do arbitrary things. A reviewer must understand the entire codebase to sign off.

Stackwright's approach is different:

1. The **schema is the security policy**. Every field in `@stackwright/types` defines what is expressible. New fields expand the attack surface; removing fields contracts it.

2. You **audit the schema once**. The `ContentItem` discriminated union, the `integrationConfigSchema`, the `mediaItemSchema` — these are the trust boundary. When a security team reviews Stackwright, they're reviewing a bounded, enumerable codebase.

3. **Every application inherits the guarantees**. An AI agent generates YAML. The YAML is validated. The validated YAML is compiled into typed components. The generated client can only call spec-defined endpoints. There's no step where "this looks reasonable" substitutes for "this is provably safe."

### The Escape Hatch Is Safe, Not a Backdoor

The output is standard Next.js. You can fork it, extend it, and write custom React components. This is intentional — it's the "no lock-in" guarantee.

But the escape hatch is designed to be **obvious when you're using it**. Custom components are written in `src/components/`, not defined in YAML. The YAML layer is clearly demarcated: `pages/` contains `content.yml`, `content/` contains collections. The Stackwright-specific parts are locked down; the standard parts are standard.

### The "Safe by Construction" Claim, Defined

**"Safe" means**: Safe from the classes of vulnerabilities that are endemic to AI-generated code and hand-written content systems:
- Content injection (YAML is parsed as data, never evaluated as code)
- XSS via unsanitized content (text is never interpolated as HTML)
- SSRF via arbitrary fetch calls (generated clients only call spec-defined endpoints)
- Schema drift between API and client (Zod schemas are the source of truth; TypeScript types are derived from them)

**"By construction" means**: The safety guarantees are inherent in the generated output, not added by linters, runtime checks, or human review. The code that renders your content is produced by a deterministic pipeline: YAML → Zod validation → typed JSON → React components with discriminated unions. At no point is there a step where "trust this input" substitutes for "validate this input."

**"What it doesn't protect against"**: Custom React components written outside the YAML layer are standard Next.js. Dynamic data fetching in custom components must be secured by the developer. Stackwright constrains the platform; it doesn't constrain arbitrary code you add to the platform.

### Implication for Schema Design

Every field added to the schema expands the set of expressible behaviors. This is why the "constrain first" principle exists — it is not just about simplicity, it is about maintaining the safety guarantees that make the enterprise use case viable.

When evaluating a new content type or field, ask: *What unsafe behavior does this enable, and is that behavior bounded and auditable?* If the answer is "it enables unbounded dynamic rendering" or "it allows arbitrary URLs," the feature belongs in a developer-written React component, not in the schema.

---

## Git Is the CMS

Content-as-code means the repository is the content management system. This is not a compromise — it is a better model for most organizations once the initial friction is overcome.

**What git provides that CMSes charge for**:
- Version history on every content change, with authorship
- Branching for draft content that isn't ready to publish
- PRs as editorial review — a non-developer proposes a change, a developer (or senior editor) approves it, it deploys automatically on merge
- Diffing: see exactly what changed between any two versions of any page
- Rollback: revert any change with a single command

**The non-developer access problem**: The legitimate objection is that non-technical users cannot open a YAML file in a text editor and contribute content. The answer to this is not to abandon the model — it is to build better interfaces on top of it. The MCP server roadmap item exists for this reason: an AI agent with access to `stackwright_create_page`, `stackwright_validate_yaml`, and `stackwright_open_pr` tools gives a non-technical user a natural language interface to the git-backed content model. They describe what they want, the agent writes valid YAML, validates it, and opens a PR. The developer reviews and merges.

This is a better workflow than a CMS dashboard, not a worse one. It produces reviewable, auditable, rollbackable content changes as a natural output of the authoring process.

**Implication for tooling**: Future Stackwright tooling — the MCP server, any WYSIWYG editor, any publishing interface — should be wrappers around the git-backed YAML model, not replacements for it. The content store is the repo. Everything else is a view.

---

## The Target User Trajectory

Stackwright is designed for a specific user journey, and architectural decisions should support the full arc:

0. **Day 0**: A non-developer chats with a branding agent about their company, values, and the feeling they want to convey. The agent generates a theme, writes content, renders each variation visually, and iterates until the result matches the brand. The output is a complete, deployed site — all within a single conversation.

1. **Day 1**: A non-developer (founder, marketer, designer) uses an AI agent to generate a Stackwright site from a description. They get a running Next.js app with pages, theme, navigation, and content — all in YAML, all in a git repo they own.

2. **Day 30**: The non-developer updates content by describing changes to an AI agent, which writes YAML and opens PRs. No developer involvement required for content.

3. **Day 180**: The company hires a developer or the founder learns to code. The developer opens the repo, sees a standard Next.js app, and begins extending it — adding custom React components, API routes, database connections — alongside the YAML-driven pages. No migration required.

4. **Day 365**: The site is a hybrid: some pages are still YAML-driven and maintained by non-developers, some are custom React. The YAML layer handles the 80% (marketing, content, documentation); the custom layer handles the 20% (application features, dynamic data). Both live in the same repo, same codebase, same deployment.

5. **Day 365+**: The company adds pro backend components — data tables, forms, approval flows — all defined in YAML, all constrained by schemas, all verifiably safe. Subject matter experts define workflows; the platform guarantees safety. Enterprise IT signs off on the schema, not on individual apps.

The framework should never require a migration between any of these stages. Stage 3 and 4 should be a natural extension of stage 1 and 2, not a break from it.

---

## The GUI Is AI

The traditional answer to "non-developers need a form, not YAML" is to build a visual editor. Stackwright's answer is different: the AI agent *is* the form.

This is not a workaround for not having built a GUI. It is a deliberate product decision based on what AI agents are now capable of. A non-developer describing a page in natural language and having an agent produce valid, schema-compliant YAML is a better interaction model than a drag-and-drop interface for most of the content tasks that matter.

**What this means for architectural priorities**:
- Schema reliability matters more than schema expressiveness. An agent needs to be able to generate valid YAML with high confidence.
- Validation tooling matters more than runtime flexibility. Errors should be caught before render, not during.
- The MCP server is not a nice-to-have — it is the primary non-developer interface. It should be designed as such.
- Agent-facing documentation (AGENTS.md, content type reference tables) is first-class infrastructure, not an afterthought. Stale agent docs cause the same class of errors as stale API docs.

---

## The Visual Feedback Loop

AI agents that generate content without seeing the result are flying blind. Stackwright's visual rendering infrastructure closes this loop.

**The render tools** (MCP server): `stackwright_render_page` screenshots any page, `stackwright_render_diff` captures before/after comparisons, `stackwright_render_yaml` renders raw YAML without saving permanently. AI agents can iterate visually — write content, render it, evaluate the result, adjust, and converge.

**The CLI**: `stackwright preview` renders pages to screenshot files for human review.

**Why this matters**: Schema validation catches structural errors — missing required fields, wrong types, invalid values. It cannot catch aesthetic errors — poor visual hierarchy, clashing colors, awkward spacing, brand inconsistency. Visual rendering gives agents and humans a shared feedback channel for the qualities that schema validation alone cannot address.

**The branding agent trajectory**: With visual rendering in place, the next evolution is an AI agent that can:
1. Have a short conversation about a company's values, audience, and aesthetic preferences
2. Generate theme and content variations
3. Render each variation and evaluate it against brand criteria
4. Iterate toward a design that captures the right "feel"
5. Open a PR with the converged result

This is the interaction model that makes Stackwright accessible to non-technical users for design-sensitive work — the thing that has historically required a designer and a developer working together over weeks.

**Implication for tooling**: Visual rendering infrastructure is first-class, not optional. The render tools are as important as the validation tools. Any content authoring workflow that produces visual output should include a visual verification step.

---

## The Extension Model and Paid Components

The `registerComponent()` API in `@stackwright/core` is intentionally open. It is the primary extension mechanism for the framework, and premium component libraries are a first-class and expected use of it — not a workaround or a violation of the "constrain first" principle.

A paid `@stackwright/components-pro` package (or similar) registers its components exactly like any other extension:

```ts
// in _app.tsx, after registerNextJSComponents()
import { registerProComponents } from '@stackwright/components-pro';
registerProComponents();
```

Each pro component follows the same contract as a free component: a YAML key, a typed schema, a React implementation. The difference is the level of complexity those components can handle — dynamic data fetching, OpenAPI spec rendering, form handling, interactive charts — things that are too specialized or maintenance-intensive for the free tier, but that fit naturally into the YAML-driven authoring model.

**"Not a CMS for dynamic content" applies to the core framework, not to pro components.** The core is and should remain a static site framework. Pro components can consume external APIs and dynamic data by virtue of being React components — they are not constrained to static rendering. The YAML for a pro component simply describes *which* data source and *how* to display it; the component handles the fetch.

**The "constrain first" principle applies to the free tier.** It is a guideline for what belongs in `@stackwright/core` and `@stackwright/types` — not a ceiling on what the ecosystem can express. Pro components exist precisely to serve use cases that are too specialized for the open-source core.

**Agents and contributors should not remove or discourage pro component types** on the grounds that they exceed the static site scope. If a component type is in a pro package, its presence there is deliberate. Scope questions about whether something belongs in the free tier vs. a pro tier are product decisions, not correctness issues.

---

## What Stackwright Is Not

These boundaries are as important as the principles above:

**Not a CMS replacement in the traditional sense.** The core framework does not have a content API, a headless delivery layer, or a media asset management system. The core is a static site framework. Dynamic, user-generated, or frequently-updated content is the domain of pro backend components or developer-written React components. However, the trajectory toward enterprise backend components (data tables, forms, approval flows) is explicit and deliberate — see "Verifiable Safety by Construction" above. The core framework is the foundation; pro components extend the same schema-constrained, verifiably-safe model to dynamic use cases.

**Not a design tool.** Themes provide color, typography, and spacing. Stackwright does not attempt to give users pixel-level layout control. Users who need that level of control should use developer-written React components, not try to push the YAML schema to accommodate it.

**Not a platform.** Stackwright does not host anything, manage deployments, or own any user data. It produces a Next.js app that the user deploys wherever they want (Vercel, Netlify, their own infrastructure). This is intentional and should remain true.

**Not a WordPress replacement.** WordPress solves a different problem for a different audience. Stackwright is for organizations that are willing to use git as their content workflow, either because they already do (developer teams) or because they have an AI agent that does it for them.

---

## Architectural Principles Derived from the Above

For contributors and agents making implementation decisions:

1. **Output is always standard Next.js.** No Stackwright-specific runtime, no proprietary deployment target. If a feature requires a Stackwright-specific server, reconsider the feature.

2. **The schema is the contract.** Types in `@stackwright/types` define what agents and users can express. Changes to the schema are high-stakes decisions. Additions should be deliberate; removals are breaking changes.

3. **Fail loudly at build time, gracefully at runtime.** The prebuild step and CLI validation tools should catch content errors before they reach the browser. At runtime, errors should degrade gracefully (error boundaries, fallback UI) rather than crash the page — but the goal is to never reach runtime with invalid content.

4. **The adapter pattern is the extension mechanism.** `@stackwright/nextjs` demonstrates the right pattern: framework-specific implementations are registered explicitly, not assumed. New adapters (App Router, other frameworks) should follow the same pattern. Do not hardcode framework assumptions into `@stackwright/core`.

5. **Agent-facing docs are part of the build.** The content type reference tables in AGENTS.md must be kept in sync with the TypeScript types. This is as important as keeping the JSON schemas in sync. Stale agent docs produce exactly the same class of bugs as stale type definitions.

6. **Constrain first, extend later — in the free tier.** When in doubt about whether to add a new content type or field to `@stackwright/core`, wait. The cost of adding something is low; the cost of maintaining it, keeping it in the schema reference, making it agent-writable, and eventually removing it is high. The right answer to "I need something the core schema doesn't support" is either a developer-written React component or a pro component package — not a core schema extension. This principle does not apply to pro packages, which exist specifically to serve specialized use cases.
