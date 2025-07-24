# 🛠️ Stackwright

**A declarative framework for building real web apps from structured content**

Stackwright lets you define entire websites — layout, content, and visual design — using simple YAML configuration. It compiles those definitions into a fully-typed, modular React/Next.js application using a real component system and theme engine.

This is **not** a static site builder. It's a **domain-specific UI compiler** designed for engineers and consultants who want to move fast without sacrificing long-term flexibility.

> ⚠️ Stackwright is currently in alpha.  
> This project represents my first fully public release after years of building internal platforms in the defense and consulting world.  
> The architecture is mature — even if the surface is still evolving.

---

## 💡 Why Stackwright?

- **Declarative by Default**  
  Write your content, layout, and theme as structured YAML — versionable, editable, auditable.

- **Outputs Real Code**  
  Generates fully-typed React/Next.js projects. No runtime lock-in. Extend anything.

- **Theming as a First-Class Citizen**  
  YAML-defined design tokens (color, spacing, typography, and component styles) drive consistent visual identity.

- **Made for the Operator Class**  
  Built with the needs of consultants, agencies, and small teams in mind: quick to start, powerful when extended.

---

## ⚙️ Quick Start

```bash
# Install dependencies
pnpm install

# Build the full Stackwright system
pnpm build

# Run an example project (requires brief folder)
pnpm dev:example
```

## 🧱 Core Concepts

🔧 Component Registry
Every layout and content block in Stackwright maps to a typed React component. YAML simply selects and wires them up. You can register your own components, layouts, or structural primitives.

🧾 YAML-First Content Definition
Define your content and page structure in a way that writers, strategists, and developers can all read:

```yaml
pages:
  - name: home
    purpose: brand homepage
    content:
      - type: hero
        title: Welcome to Stackwright
        subtitle: From brief to build in seconds.
      - type: paragraph
        body: |
          This entire page is generated from structured YAML,
          compiled into real, inspectable TypeScript code.
```

🎨 Theme Engine
Design tokens and component styles are defined in YAML and applied consistently throughout your site. You can load and swap themes via configuration or provide custom tokens:

```yaml
name: "Soft"
colors:
  primary:
    500: "#ec4899"
  text:
    primary: "#374151"
components:
  button:
    primary: "bg-pink-600 text-white px-6 py-2 rounded-full"
```

## 🧩 Project Structure

- packages/stackwright-core – Typed React component system + YAML renderer
- packages/stackwright-themes – Theme loader, default themes, YAML tokens
- packages/stackwright-nextjs – Next.js runtime integration (optional)
- packages/stackwright-cli – CLI tool for bootstrapping, AI pipeline, and brief ingestion

## 📈 Roadmap

- ✅ YAML → React Compiler MVP
- ✅ Theme System (YAML + TS)
- 🚧 AI Content Pipeline
- 🚧 Plugin System for New Component Types
- 🚧 Live Preview / Authoring Mode
- 🚧 Website + Showcase

## 🤝 Contributing

This is still early, but if you're interested in structured content systems, typed UI frameworks, or declarative developer tooling, reach out or open a PR.

## 🧠 Philosophy

Stackwright is built on the belief that websites — like software systems — should start from intent, not just layout.

Start with clarity. Compile to code.
Make tools for people who care about both structure and aesthetics.

## 📜 License
MIT