# APA Atomic Framework Summary  
*Aiden’s Power Auth v2 — Cliqstr Adaptive Protection & Parental Authorization*

---

## 1. Overview

**APA (Aiden’s Power Auth)** is the backbone of Cliqstr’s safety architecture — a unified, multi-layered framework that protects minors, empowers parents, and guarantees traceable, regulatory-grade accountability across all user interactions.

The **APA Atomic Framework** integrates authentication, parental control, AI-assisted moderation, and immutable audit logging into one cohesive system.  
It transforms social media authentication into *authentic digital guardianship.*

---

## 2. Mission and Core Principles

| Principle | Description |
|------------|-------------|
| **Verified Identity** | Every account verified through APA sessions (age, Stripe-backed ID, email). No anonymous use. |
| **Adaptive Roles** | Dynamic permissions based on age and role: Parent, Child, Adult, Admin, Guardian. |
| **Parental Governance** | Parents control child memberships through PHQ — approvals, Silent Monitoring, Red Alerts. |
| **Ethical AI** | AI moderation detects harm; never manipulates engagement or serves ads. |
| **Event-Level Traceability** | Every action logged immutably; accessible to parents or auditors. |
| **Zero Exploitation** | No ads, no data tracking, no DMs. All interactions are supervised and consent-based. |

---

## 3. APA Framework Layers

| Layer | Function | Description |
|--------|-----------|-------------|
| **Identity Layer** | Verification | Age & ID validation via Stripe and Convex. |
| **Auth Layer** | Session Management | Secure, encrypted Iron Sessions; centralized session logging. |
| **Role Layer** | Access Control | Role-scoped permissions enforced by Convex. |
| **Moderation Layer** | AI + Human Review | Content scanning, pattern detection, Red Alerts. |
| **Audit Layer** | Logging & Reporting | Immutable logs for every event; parent-requested reports. |

---

## 4. Parent HQ (PHQ)

### Purpose  
**PHQ** is the administrative center for parents and guardians.  
It provides real-time oversight, controls, and historical insight for all linked child accounts.

### Core Functions
- **Silent Monitoring:** Passive, invisible viewing of child posts, comments, and joins.  
- **Activity Reports:** Generate daily/weekly summaries of child activity.  
- **Join Approvals:** Parents approve or deny child requests to join new Cliqs.  
- **Red Alerts:** Immediate notifications for flagged content or unsafe behavior.  
- **Permissions Dashboard:** Manage per-child settings — visibility, privacy, and interaction scope.

### Implementation Notes
- Powered by Convex reactive queries; updates in real time.  
- PHQ reads audit events (`auditEvents` table) instead of direct child content queries.  
- Parent interactions are **read-only**; no child notification of monitoring.  
- All parent reads generate `auditRead` entries for transparency.

---

## 5. Silent Monitoring

Silent Monitoring is an **APA-governed audit stream** that allows parents to view a child’s activity in real time without interfering.

### Mechanism
1. Each child action (post, comment, cliq join) triggers a Convex mutation writing an `auditEvent`.  
2. Parents subscribed through PHQ see these events instantly.  
3. Monitoring can be toggled by parent consent but defaults **on** for minors.  
4. Events are retained per compliance rules (rolling deletion after N days).  

### Privacy & Safety
- Only linked parents (via verified relationship) can access the feed.  
- All monitoring actions are logged for legal traceability.  
- Parents cannot alter or inject into the child feed.  

---

## 6. AI-Assisted Moderation Layer

The APA Moderation Core combines **machine detection** and **human review**.  
AI flags are strictly safety-oriented.

| Function | Description |
|-----------|--------------|
| **Text/Image Analysis** | Detects bullying, grooming, or self-harm cues. |
| **Behavioral Signals** | Identifies repeated risky patterns (e.g., oversharing). |
| **Red Alert Integration** | Sends alerts directly to PHQ and Admin Review dashboards. |
| **Ethics Rule** | AI never manipulates engagement or serves content for retention. |
| **Transparency** | Every AI flag logged; parents can view flagged posts in PHQ. |

---

## 7. Compliance Alignment

APA meets or exceeds:
- **COPPA** – Verified parental consent before data collection.  
- **CCPA** – Right to know, delete, and restrict processing.  
- **GDPR** – Data minimization and lawful basis logging.  
- **FERPA-style** parental access – Full record visibility for minors’ guardians.  

### Data Residency
All records stored within Convex’s managed region; export/delete tools satisfy user requests within 30 days.

---

## 8. Integration with Gemini Authentication

The **Gemini Auth Plan** (see `APA-Gemini-Auth-Plan.md`) is the operational layer of APA’s Identity and Auth tiers.  
Together, they form the **APA Atomic System**, where every identity and consent event is tracked as part of the same atomic transaction.

| Integration Point | Function |
|--------------------|----------|
| **onboardingFlows** | Tracks every parental approval and child creation event. |
| **Stripe VPC** | Confirms card-backed identity for parents. |
| **Convex auditEvents** | Feeds PHQ and moderation dashboards. |
| **Session hooks** | Enforce role-based access at runtime. |

---

## 9. Security Hardening Roadmap (Appendix)

| Area | Action | Complexity | Priority |
|------|---------|-------------|-----------|
| **CSRF Protection** | Add Origin/Referer validation for all write routes. | Moderate | 🔴 Critical |
| **Session Hardening** | `sameSite:'strict'`, rolling renewal, idle timeout per role. | Low–Medium | 🟠 High |
| **Rate Limiting** | Replace memory limiter with Redis/Upstash persistent limiter. | Medium | 🟠 High |
| **Approval Tokens** | One-time, short-lived parental approval links. | Low | 🔴 Critical |
| **Security Headers** | Global CSP, Permissions-Policy, Referrer-Policy. | Low | 🟡 Medium |
| **Logging Consistency** | Standardize Convex audit schema for all modules. | Medium | 🟢 Recommended |
| **Periodic Review** | Quarterly security + compliance audits. | — | 🟢 Ongoing |

---

## 10. Summary

APA Atomic Framework transforms authentication into **protection**.  
It fuses identity, parental control, AI moderation, and auditing into a single enforceable protocol that keeps every user—especially children—safe, verified, and visible to their guardians.

> *APA ensures that safety isn’t a feature — it’s the foundation.*

---

© 2025 Cliqstr — Aiden’s Power Auth (APA) v2
