# Stackwright Philosophy

This document captures the product intent and architectural principles behind Stackwright. It is written for agents, contributors, and future maintainers who need to understand not just *what* the framework does, but *why* it is built the way it is — so that new decisions align with the long-term direction rather than inadvertently working against it.

CLAUDE.md tells you how to work in this repo. ROADMAP.md tells you what to build next. This document tells you what Stackwright is and why it is built the way it is.

---

## The Problem

The people who need websites — small businesses, nonprofits, early-stage startups, internal teams — are permanently bottlenecked on developers. Every solution that has tried to fix this falls into one of two traps:

**The lock-in trap**: Hosted no-code tools (Wix, Webflow, Squarespace, WordPress.com) are fast to start but expensive to escape. The content lives in a proprietary database, the templates are platform-specific, and the exit cost is a full rewrite. Every company that grows past a certain point pays this tax.

**The complexity trap**: Developer-facing tools (Gatsby, Next.js, Contentlayer, MDX) give you full ownership but require enough technical literacy to configure, maintain, and extend. Non-technical teammates can't contribute content without help from the developer the tool was supposed to free them from.

Stackwright's position: both traps are avoidable if you make the right architectural choices early.

---

## The Core Thesis

**Stackwright is a domain-specific language with a typed grammar. YAML is the syntax. The schema is the grammar. The Next.js application is the runtime.**

This is not incidental to the design — it is the design. Understanding it is the key to understanding every other architectural decision in this project.

In formal terms: the YAML content files are *programs* written in the Stackwright DSL. The type system in `@stackwright/types` defines the grammar of that language — what constructs are valid, what fields are required, what values are permitted. The `contentRenderer` is the interpreter that transforms those programs into rendered UI. The JSON schemas generated from the type system are the machine-readable grammar specification — they enable validation at authoring time, before interpretation.

YAML was chosen deliberately as the syntax layer: it is the most human-readable, schema-capable markup format available without inventing a custom parser. The choice of YAML is an implementation detail of the syntax layer. The grammar — the type system — is the real artifact.

**Why this framing matters**: Most "YAML-driven" tools treat YAML as configuration. Stackwright treats YAML as source code. The difference is that source code has a grammar, and grammars can be validated, tooled, and reasoned about at a level that configuration cannot. This is what makes AI-driven authoring tractable, what makes validation possible before render time, and what makes the escape hatch real — because a program written in a well-defined language can always be translated.

**Stackwright is not a no-code platform. It is a structured interface over a standard Next.js application.**

The distinction matters:

- A no-code platform owns your content and your runtime. You are a tenant.
- Stackwright produces a Next.js app that you own, can fork, can hand to any React developer, and can extend with arbitrary code. Stackwright is a tool you use to build it, not a platform you live inside.

The YAML files are not a proprietary format. They are programs in a typed language that compiles to a standard application. The moment a user outgrows what Stackwright provides, a developer can open the repo and write React components alongside the YAML-driven ones — in the same codebase, with no migration, no "export," no rewrite. The transition from "non-developer-maintained site" to "developer-extended web app" is a git commit, not a project.

---

## The Escape Hatch Is a Feature

Most framework documentation acknowledges migration paths reluctantly. For Stackwright, the escape hatch is a selling point that should be stated clearly and kept real.

**The promise**: your content is always a `git clone` away from being completely free of Stackwright. The output is always a standard Next.js app. Any React developer can pick it up and work in it immediately.

**The constraint this imposes on architecture**: Any decision that increases lock-in to Stackwright-specific primitives works against the product. The framework should make it *easier* to write standard React alongside YAML-driven content, not harder. Extension points should be explicit and well-documented. The framework should never require users to stay inside its abstraction longer than they want to.

When evaluating a new architectural decision, ask: does this make the project more or less forkable and developer-extensible? If less, there needs to be a strong reason.

---

## The Constraint Is the Moat

The grammar is narrow by design. This is the most important thing to understand about Stackwright's approach to content types.

**Why a narrow grammar matters for AI authoring**: The fundamental problem with AI-generated applications is not that AI can't write code — it's that unconstrained code generation produces an output space too large to verify. Every generated application becomes a unique artifact. There is no structural basis for "is this correct?" beyond reading all of it.

Stackwright's answer is to reduce the output space to a verified vocabulary. An AI agent authoring a Stackwright site generates YAML against a known typed grammar. The verifiable surface is the YAML, not the React. Correctness becomes: does this YAML conform to the schema, and does it express the intent? Both are tractable problems — for humans reviewing AI output, for AI generating content, and for tooling validating either.

This is the key architectural insight: **constrained generation over a typed grammar is qualitatively more reliable than unconstrained code generation.** If the grammar is tight and well-specified, generation is reliable and errors are catchable at validation time. If the grammar is loose or highly flexible, generation becomes unpredictable and errors surface at render time as broken layouts.

The narrow grammar is not a limitation of the framework. It is the mechanism by which the framework makes AI authoring useful. A wider grammar means a larger output space means a harder verification problem. Resist the impulse to "add flexibility" — every degree of freedom added to the grammar is a degree of freedom that must be verified.

**Implication for new content types**: Add content types deliberately. A new content type should represent a genuinely distinct layout pattern that cannot be reasonably achieved by combining existing types. Do not add escape hatches for one-off customizations — those belong in developer-written React components outside the YAML layer.

**Implication for schema fields**: Required fields should be truly required. Optional fields should have sensible defaults. Avoid `any`-typed or unvalidated fields. Every field an agent can write should be validatable before render time. The schema fields are the terminals of the grammar — they define the atomic units of expression. Treat them with the same rigor as an API contract.

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

1. **Day 1**: A non-developer (founder, marketer, designer) uses an AI agent to generate a Stackwright site from a description. They get a running Next.js app with pages, theme, navigation, and content — all in YAML, all in a git repo they own.

2. **Day 30**: The non-developer updates content by describing changes to an AI agent, which writes YAML and opens PRs. No developer involvement required for content.

3. **Day 180**: The company hires a developer or the founder learns to code. The developer opens the repo, sees a standard Next.js app, and begins extending it — adding custom React components, API routes, database connections — alongside the YAML-driven pages. No migration required.

4. **Day 365**: The site is a hybrid: some pages are still YAML-driven and maintained by non-developers, some are custom React. The YAML layer handles the 80% (marketing, content, documentation); the custom layer handles the 20% (application features, dynamic data). Both live in the same repo, same codebase, same deployment.

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

**Not a CMS replacement in the traditional sense.** The core framework does not have a content API, a headless delivery layer, or a media asset management system. It is a static site framework. Dynamic, user-generated, or frequently-updated content is the domain of pro components or developer-written React components — not something to push into the core YAML schema.

**Not a design tool.** Themes provide color, typography, and spacing. Stackwright does not attempt to give users pixel-level layout control. Users who need that level of control should use developer-written React components, not try to push the YAML schema to accommodate it.

**Not a platform.** Stackwright does not host anything, manage deployments, or own any user data. It produces a Next.js app that the user deploys wherever they want (Vercel, Netlify, their own infrastructure). This is intentional and should remain true.

**Not a WordPress replacement.** WordPress solves a different problem for a different audience. Stackwright is for organizations that are willing to use git as their content workflow, either because they already do (developer teams) or because they have an AI agent that does it for them.

---

## Architectural Principles Derived from the Above

For contributors and agents making implementation decisions:

1. **Output is always standard Next.js.** No Stackwright-specific runtime, no proprietary deployment target. If a feature requires a Stackwright-specific server, reconsider the feature.

2. **The schema is the grammar. The grammar is the contract.** Types in `@stackwright/types` are not documentation — they are the formal specification of the language. Changes to the schema are breaking changes to the language. Additions should be deliberate; removals require a deprecation path. The JSON schemas generated from these types are the machine-readable grammar specification; they must be kept in sync. Think of `@stackwright/types` the way you would think of a language specification — it is the single source of truth for what is expressible.

3. **Validate at grammar time, not at render time.** The prebuild step and CLI validation tools should catch content errors before they reach the browser — analogous to a compiler catching syntax errors before execution. At runtime, errors should degrade gracefully (error boundaries, fallback UI) rather than crash the page — but the goal is to never reach runtime with invalid content. Runtime validation failures are compiler bugs, not user errors.

4. **The adapter pattern is the extension mechanism.** `@stackwright/nextjs` demonstrates the right pattern: framework-specific implementations are registered explicitly, not assumed. New adapters (App Router, other frameworks) should follow the same pattern. Do not hardcode framework assumptions into `@stackwright/core`.

5. **Agent-facing docs are part of the grammar specification.** The content type reference tables in AGENTS.md must be kept in sync with the TypeScript types. This is as important as keeping the JSON schemas in sync. Stale agent docs produce exactly the same class of bugs as stale type definitions — an agent writing against a stale grammar will produce syntactically invalid programs that fail at validation or render time.

6. **Constrain first, extend later — in the free tier.** When in doubt about whether to add a new content type or field to `@stackwright/core`, wait. The cost of adding something is low; the cost of maintaining it, keeping it in the schema reference, making it agent-writable, and eventually removing it is high. The right answer to "I need something the core schema doesn't support" is either a developer-written React component or a pro component package — not a core schema extension. This principle does not apply to pro packages, which exist specifically to serve specialized use cases.

7. **The grammar must be introspectable.** Tooling — the MCP server, the CLI, the WYSIWYG editor — must be able to reason about what is valid without parsing source code. This is why schema generation is a first-class build step and why the Zod migration is architecturally significant: Zod schemas are inspectable at runtime via `.shape`, making it possible to enumerate valid fields, describe required vs. optional, and validate input without a separate JSON Schema pass. A grammar that only a human can read is not a grammar — it is documentation.
