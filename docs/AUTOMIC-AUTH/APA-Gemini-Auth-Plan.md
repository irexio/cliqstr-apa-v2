# APA-Gemini-Auth-Plan  
*Aiden’s Power Auth v2 — Convex Atomic Authentication & Parental Framework Integration*

---

## 1. Overview

This document captures the **Gemini-auth redesign plan** and Aiden’s technical assessment of its fit for Cliqstr’s architecture.  
It merges engineering details with CTO-level commentary, risk tables, and implementation guidance for Cursor and Windsurf.

APA (Aiden’s Power Auth) governs all authentication, parental oversight, and safety operations inside Cliqstr.  
The Gemini plan introduces a **Convex-centric state machine** that resolves the fragility and friction of the current flow.

---

## 2. Core Goals

1. **Eliminate onboarding friction** while keeping verifiable parental consent.  
2. **Replace scattered Prisma logic** with **atomic Convex mutations**.  
3. **Ensure every step is recoverable**—no abandoned or half-created users.  
4. **Integrate Stripe verification** for card-backed identity (COPPA VPC).  
5. **Centralize audit and monitoring** under APA for traceable compliance.

---

## 3. Proposed Architecture

### Key Concept: `onboardingFlows` State Machine

| Table | Purpose |
|--------|----------|
| `users` | Account-level data (Convex Auth). |
| `myProfiles` | Social-level persona data. |
| `onboardingFlows` | **New atomic controller** for invites and signups. |

Each onboarding flow is a finite state machine controlling invitations, approvals, and final user creation.

**Flow lifecycle example:**

initiated → parent_email_sent → parent_email_verified →
parent_identity_pending → parent_identity_verified →
permissions_set → child_created_pending_login → completed


Each state transition is performed by a Convex mutation or action and logged to the audit layer.

---

## 4. Convex State Machine Design

### A. Entry Point: `auth.registerInitiate`

- Inputs: `email`, `birthdate`, optional `inviteToken`.
- Determines age → assigns flow type (`adult_signup`, `child_invite_new_parent`, etc.).
- Creates a new `onboardingFlows` record.
- If child, waits for parent email; if adult, proceeds to Stripe.

### B. Parent Email & Magic Link

`auth.sendParentApprovalEmail`
- Generates secure, single-use magic link (`inviteToken`).
- Stores token + `expiresAt`.
- Sends via Resend/Twilio.
- Updates status → `parent_email_sent`.

### C. Parent Handling

`parent.handleMagicLink`
- Validates token and expiration.
- Finds or creates parent user via Convex Auth.
- **If existing adult:** prompts for **explicit role conversion** to parent.
- Updates `onboardingFlows.status = parent_email_verified`.

### D. VPC (Verifiable Parental Consent)

`parent.submitStripeVPC`
- Executes Stripe SetupIntent or Identity.
- On success: `vpcStatus='verified'`, updates flow → `parent_identity_verified`.

### E. Child Permissions

`parent.setChildPermissions`
- Saves `tempParentSettings`.
- Status → `permissions_set`.

### F. Finalization

`parent.finalizeChildAccount`
- Creates child account atomically.
- Links `parentId`.
- Marks flow `completed`.
- Sends child login credentials.
- Triggers `auth.evaluateActivation(childId)`.

---

## 5. Stripe / VPC Flow

- Each adult or parent must have a valid Stripe Customer + PaymentMethod.  
- Child activation depends on linked parent’s verified card.

**Webhook events handled:**
| Event | Action |
|-------|--------|
| `payment_method.attached` | `hasPaymentMethod=true` |
| `setup_intent.succeeded` | confirm customer setup |
| `customer.updated` | double-check integrity |
| (future) `subscription.updated` | plan synchronization |

All webhook actions call `auth.evaluateActivation()` to ensure account gating.

---

## 6. Risk & Oversight Table

| Risk | Description | Mitigation |
|------|--------------|-------------|
| Token reuse | Magic links reused or intercepted | 64-byte random token; single-use + `consumedAt`. |
| Silent role promotion | Adult auto-converted to parent | Explicit consent modal + audit log. |
| Stripe downtime | Flow stalls | Async retry + admin review fallback. |
| Username collision | Child username taken at finalize | Reserve at `permissions_set`. |
| Orphaned flows | Abandoned invites clutter DB | Cron cleanup: mark `abandoned` after 7 days. |
| Validation mismatch | Malformed temp data | Shared Zod schemas between client/server. |
| Duplicate accounts | Race conditions on signup | Query-and-lock before insert. |
| Cost creep | Convex/Stripe actions sprawl | Monitor via usage dashboard. |

---

## 7. Security Reinforcements

1. **CSRF protection:** validate Origin/Referer for all POST, PUT, DELETE.  
2. **Session hardening:** `sameSite:'strict'`, rolling renewal, idle cutoff.  
3. **Rate limiting:** Upstash/Redis persistent limiter.  
4. **One-time approval tokens:** auto-expire + revoke on consume.  
5. **Security headers:** global CSP, Permissions-Policy, Referrer-Policy.  
6. **Logging:** all auth actions → immutable `auditEvents`.

---

## 8. Aiden’s CTO Commentary & Comparison

### A. Reliability

| Aspect | Current Repo | Gemini Plan |
|--------|---------------|-------------|
| Auth model | Fragmented, sequential | Atomic state machine |
| Recovery | Manual | Auto-resumable |
| Logging | Minimal | Full audit trail |

✅ **Improvement:** no more infinite loading or lost invites.

### B. Safety & Compliance

| Aspect | Current | Gemini |
|--------|----------|--------|
| Parental consent | Basic email | COPPA-compliant Stripe VPC |
| Role assignment | Implicit | Explicit + logged |
| AI moderation tie-in | Manual | Integrated with APA |

✅ **Improvement:** defensible COPPA/GDPR compliance.

### C. UX

| Aspect | Current | Gemini |
|--------|----------|--------|
| Error recovery | Restart from scratch | Resume exact step |
| Messaging | Generic errors | Step-specific |
| Testing | Needs Stripe | Can simulate Stripe bypass |

✅ **Improvement:** smoother onboarding, easier QA.

### D. Maintainability

| Aspect | Current | Gemini |
|--------|----------|--------|
| Code dispersion | Multi-file spaghetti | Modular Convex actions |
| Adding flow types | Hard | Simple new `flowType` |
| Testing hooks | Weak | Built-in via state table |

✅ **Improvement:** lower dev cost; safer iteration.

---

## 9. PHQ & Silent Monitoring Integration

**Parent HQ (PHQ)** evolves into the live guardian dashboard.

- Queries `auditEvents` for child activity.  
- Shows silent real-time feed of posts/comments.  
- Red-alerts flagged by AI moderation (APA layer).  
- Parents cannot post or appear in thread; read-only mirror.  
- All reads logged as `auditRead` events.

**Silent Monitoring Implementation:**

```ts
// convex/audit.ts (conceptual)
mutation("audit.logChildAction", async (ctx, args) => {
  const { actorId, event, targetId } = args;
  const actor = await ctx.db.get(actorId);
  if (actor.role === "child" && actor.parentId) {
    await ctx.db.insert("auditEvents", {
      actorId,
      parentId: actor.parentId,
      event,
      targetId,
      createdAt: Date.now()
    });
  }
});


PHQ subscribes:

query("parentHQ.feed", async (ctx) => {
  return await ctx.db
    .query("auditEvents")
    .withIndex("by_parentId", q => q.eq(q.field("parentId"), ctx.user._id))
    .order("desc")
    .take(50);
});


10. Implementation Phasing (Cursor Hand-off)
Phase 1 — Staging Prototype

Add onboardingFlows table.

Implement auth.registerInitiate, sendParentApprovalEmail, handleMagicLink.

Seed promo or simulateStripeEvent to bypass live Stripe.

Test adult/child flow end-to-end.

Phase 2 — Full Parent HQ Integration

Add PHQ feed + auditEvents.

Implement silent monitoring and red alerts.

Phase 3 — Security Sprint

CSRF, rate limits, headers, rolling sessions.

Phase 4 — Production Cutover

Flip AUTH_PROVIDER=v2.

Keep v1 fallback until validation complete.

Rollback

Flip env var → AUTH_PROVIDER=v1.

Delete v2 Convex instance if needed.

11. Summary

The Gemini-auth plan with APA integration provides:

Atomic reliability

Legal safety

Real-time parental oversight

Future-proof scalability

It replaces a brittle sign-up chain with a resilient, transparent state machine —
a true APA Atomic Authentication System worthy of Cliqstr’s mission.

© 2025 Cliqstr — Aiden’s Power Auth (APA) v2

