# Stackwright Open Issues - Strategic View 🗺️

**Generated:** 2026-03-26  
**Total Open Issues:** 20  
**Agent:** Stacker (code-puppy-4001d4)

---

## 🎖️ **GOVERNMENT/MILITARY DEMO SHOWSTOPPERS** ⭐⭐⭐

These issues directly address enterprise security, compliance, and governance - **critical** for government/military demos:

### **Security & Compliance Suite (HIGH PRIORITY)**
Issues #240-246 form a **comprehensive security remediation** that would be highly impressive for government clients:

| # | Title | Impact | Demo Value |
|---|-------|--------|------------|
| **#246** | Security: Add secrets scanning to CI pipeline | Prevents credential leaks | ⭐⭐⭐ SOC2, ISO 27001 compliance |
| **#245** | Security: Environment variable resolution for integration secrets | No secrets in version control | ⭐⭐⭐ OWASP ASVS v4.0 2.10.4 compliance |
| **#244** | Docs: Plugin security guidelines | Security baseline for all plugins | ⭐⭐⭐ Establishes security culture |
| **#243** | Security: Content Security Policy headers | XSS prevention, defense-in-depth | ⭐⭐⭐ OWASP Top 10 mitigation |
| **#242** | Security: Plugin config schema registry | Prototype pollution prevention | ⭐⭐⭐ Trust boundary enforcement |
| **#240** | Feat: Integrations config to site schema | Validated plugin architecture | ⭐⭐ Foundation for extensibility |

**🎖️ DEMO NARRATIVE:**  
*"Stackwright implements defense-in-depth security by default: automated secrets scanning in CI/CD, CSP headers to prevent XSS, schema validation to block injection attacks, and compliance with SOC2, ISO 27001, and OWASP ASVS standards. All secrets are env-var-based with automatic resolution - zero secrets in version control."*

**ESTIMATED COMPLETION:** 2-3 weeks (all 6 issues)  
**PRIORITY:** Must complete before first Pro package alpha release

---

## 🤖 **AI-ASSISTED PIPELINE (CUTTING EDGE)**

The "Otter Agents" - AI orchestration for site generation:

| # | Title | Theme | Demo Value |
|---|-------|-------|------------|
| **#236** | Stackwright Otter Agents: AI-assisted site generation pipeline | Full AI workflow | ⭐⭐⭐ **Flagship feature** |
| **#239** | Feat: Add MCP tools for integration management | AI tooling | ⭐⭐ Enables agent autonomy |
| **#238** | Feat: Add CLI commands for integration management | Developer UX | ⭐⭐ Human-friendly CLI |
| **#123** | Feat: Live page preview tool - render and screenshot agent-authored content | AI feedback loop | ⭐⭐ Visual validation |

**🤖 DEMO NARRATIVE:**  
*"Four specialized AI agents orchestrate the entire site build: Foreman Otter coordinates, Brand Otter discovers your identity through conversation, Theme Otter designs your visual system, and Page Otter architects content. The agents use MCP tools to scaffold projects, manage integrations, and validate their work with live previews."*

**STATUS:** #236 is comprehensive and foundational  
**GAPS:** Integration management tooling (#238, #239) needed for agent autonomy

---

## 📊 **COVERAGE & GAPS ANALYSIS**

### **🟢 Well-Covered Areas:**

#### **1. Security & Trust** (6 issues)
- Secrets management (#245, #246)
- CSP headers (#243)
- Schema validation (#242)
- Plugin security guidelines (#244)
- Integration config validation (#240)

**GAP:** No runtime security monitoring or audit logging

#### **2. AI Agent Infrastructure** (4 issues)
- Full agent pipeline (#236)
- Integration tooling (#238, #239)
- Visual preview (#123)

**GAP:** No agent performance metrics or failure recovery

#### **3. Developer Experience** (3 issues)
- CLI enhancement (#185, #188)
- Package publish readiness (#190)

**GAP:** No IDE plugins, linting, or IntelliSense support

---

### **🟡 Partially Covered Areas:**

#### **4. Content Types & Features** (3 issues)
- Text block content type (#170)
- Interactive forms (#126)
- i18n multi-language support (#112)

**GAP:** 
- No advanced content types (data visualization, dashboards, real-time data)
- No CMS integration for non-technical editors
- No content versioning or approval workflows

#### **5. Collections & Data Sources** (1 issue)
- CollectionProvider interface, FileCollectionProvider, S3CollectionProvider (#85)

**GAP:**
- No database connectors (PostgreSQL, MongoDB, etc.)
- No API-based collections (REST, GraphQL live queries)
- No caching strategy for external collections

---

### **🔴 Uncovered Areas / Major Gaps:**

#### **6. Platform Support**
- **Only Next.js Pages Router is supported**
- #80: Next.js App Router support (priority:vision)

**GAP:**
- No Remix, Astro, or static site generator support
- No serverless function generation
- No edge runtime support

#### **7. Testing & QA**
- #141: Before/after screenshot comparison on merge

**GAP:**
- No visual regression testing suite
- No automated accessibility testing (WCAG 2.1 AA)
- No performance testing (Core Web Vitals)
- No load testing for high-traffic scenarios

#### **8. DevOps & Operations**
- #175: Clean up plan files and consumed changesets on main

**GAP:**
- No deployment automation (Vercel/Netlify/AWS)
- No monitoring/observability (errors, performance, usage)
- No blue/green deployments or canary releases
- No disaster recovery or backup strategy

#### **9. Enterprise Features**
- **No multi-tenancy support**
- **No role-based access control (RBAC)**
- **No single sign-on (SSO) integration (SAML, OIDC)**
- **No audit logging for compliance**
- **No data residency controls (GDPR, CCPA)**

#### **10. Content Management**
- **No visual page builder / no-code editor**
- **No content approval workflows**
- **No content scheduling (publish date/time)**
- **No content versioning or rollback**
- **No content search/filtering**

---

## 🎯 **PRIORITY MATRIX**

### **Immediate (HIGH PRIORITY - Complete First)**
1. **Security suite (#240-#246)** - Blocks Pro package alpha release
2. **Otter agents (#236)** - Flagship feature, high demo value
3. **Package publish readiness (#190)** - Blocks public release

### **Near-Term (PRIORITY:NEXT)**
1. **Text block content type (#170)** - Common use case
2. **Before/after screenshot comparison (#141)** - Quality assurance
3. **Clean up changesets (#175)** - Technical debt

### **Future (PRIORITY:LATER)**
1. **Interactive forms (#126)** - High-value content type
2. **CLI enhancements (#185, #188)** - Developer convenience
3. **Live page preview (#123)** - Agent feedback loop
4. **i18n support (#112)** - Enterprise requirement
5. **CollectionProvider interface (#85)** - Data flexibility

### **Vision (PRIORITY:VISION)**
1. **Next.js App Router support (#80)** - Platform evolution

---

## 🚀 **GOVERNMENT/MILITARY DEMO ROADMAP**

### **Phase 1: Security & Compliance (2-3 weeks)**
Complete issues #240-#246 to demonstrate:
- ✅ Secrets scanning in CI/CD
- ✅ No secrets in version control
- ✅ CSP headers & XSS prevention
- ✅ Plugin security baseline
- ✅ SOC2, ISO 27001, OWASP ASVS compliance

**DEMO:** "Zero-trust security architecture with automated compliance validation"

### **Phase 2: AI Orchestration (Concurrent)**
Complete #236, #238, #239 to demonstrate:
- ✅ AI agents build complete sites from conversation
- ✅ MCP tools enable agent autonomy
- ✅ Human-friendly CLI for developers

**DEMO:** "AI-assisted site generation with human-in-the-loop validation"

### **Phase 3: Enterprise Features (Next)**
Address major gaps:
- [ ] RBAC & multi-tenancy
- [ ] SSO integration (SAML, OIDC)
- [ ] Audit logging
- [ ] Visual regression testing
- [ ] Accessibility testing (WCAG 2.1 AA)

**DEMO:** "Enterprise-grade governance and quality assurance"

---

## 🎨 **THEMATIC CLUSTERS**

### **🔒 Security & Trust** (6 issues)
- #246, #245, #244, #243, #242, #240

### **🤖 AI & Automation** (4 issues)
- #236, #239, #238, #123

### **🧩 Content Types** (3 issues)
- #170, #126, #112

### **🔧 Developer Tools** (3 issues)
- #185, #188, #190

### **📦 Data & Collections** (1 issue)
- #85

### **🏗️ Platform & Architecture** (2 issues)
- #80, #141

### **🧹 Technical Debt** (1 issue)
- #175

---

## 💡 **STRATEGIC RECOMMENDATIONS**

### **For Government/Military Demo:**
1. **Complete security suite FIRST** (#240-#246) - This is table stakes for government clients
2. **Demonstrate Otter agents** (#236) - Shows cutting-edge AI capabilities
3. **Add RBAC & SSO** (not in backlog) - Government requires fine-grained access control
4. **Add audit logging** (not in backlog) - Compliance requirement for government
5. **Add WCAG 2.1 AA testing** (not in backlog) - Federal accessibility requirement (Section 508)

### **For Product Completeness:**
1. **Content management workflows** (not in backlog) - Editors need approval flows
2. **Visual page builder** (not in backlog) - Reduces reliance on YAML expertise
3. **Database connectors** (#85 partial) - Enterprise apps need live data
4. **Monitoring & observability** (not in backlog) - Production readiness
5. **Multi-platform support** (#80) - Reduces vendor lock-in concerns

### **Quick Wins for Demo:**
1. **#170 (text_block)** - Easy, high-value content type
2. **#190 (publish readiness)** - Signals production maturity
3. **#175 (cleanup)** - Shows attention to quality
4. **#141 (screenshot comparison)** - Visual proof of quality assurance

---

## 📝 **NOTES**

### **DRY Principle Observation:**
- Security issues (#242-#246) share common validation/scanning patterns - could be consolidated into unified security framework

### **YAGNI Check:**
- #80 (App Router) is priority:vision - defer until Pages Router adoption plateaus
- #112 (i18n) is complex - defer until clear customer demand

### **SOLID Principle Assessment:**
- #85 (CollectionProvider) follows Open/Closed well - plugins can add providers without modifying core
- #242 (plugin schema registry) enforces Interface Segregation - plugins only define what they need

---

**🐶 Stacker's Take:**  
The security suite (#240-#246) is the **most impressive** work for government/military demos - it's comprehensive, well-scoped, and addresses real compliance requirements. Combined with the Otter agents (#236), you've got a killer narrative: **"Secure-by-default, AI-assisted development that meets SOC2 and ISO 27001 standards."**

The biggest gaps are **enterprise features** (RBAC, SSO, audit logging) and **testing automation** (visual regression, a11y, performance). Those aren't in the backlog but would be essential for government production deployments.

Let's knock out that security suite first - it's only 2-3 weeks and it's blocking the Pro alpha release anyway! 🚀
