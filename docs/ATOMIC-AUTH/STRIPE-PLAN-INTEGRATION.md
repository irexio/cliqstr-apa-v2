# Stripe Plan Integration for APA v2
*Cliqstr Atomic Authentication + Payment System*

---

## 📋 Overview

This document defines how Stripe plans integrate with the APA v2 `onboardingFlows` state machine and `accounts` table.

**Key Principles:**
- Plans are selected *after* email verification, *before* account creation
- Promo codes (lifetime for testers, future discounts) are validated at plan selection
- 30-day free trial is auto-applied at signup (no credit card required initially)
- Plan is stored atomically in `onboardingFlows` and synced to `accounts` on finalization

---

## 🎯 Plan Structure in Stripe & Convex

### **Cliqstr Plans** (Stripe Product IDs)

| Plan | Stripe Product ID | Monthly Price ID | Annual Price ID | Seats | Max Cliqs | Storage | Trial |
|------|-------------------|------------------|-----------------|-------|-----------|---------|--------|
| **Child Plan** | `prod_child_cliqstr` | `price_child_monthly` | `price_child_annual` | 1 child | 3 | 1 GB | 30 days |
| **Adult Plan** | `prod_adult_cliqstr` | `price_adult_monthly` | `price_adult_annual` | 1 adult | 3 | 3 GB | 30 days |
| **Family Plan** | `prod_family_cliqstr` | `price_family_monthly` | `price_family_annual` | 6 members | 15 | 10 GB | 30 days |
| **Large Group Plan** | `prod_group_cliqstr` | `price_group_monthly` | `price_group_annual` | 20 members | 30 | 25 GB | 30 days |

### **Add-Ons** (Stripe Product IDs)

| Add-On | Stripe Product ID | Price ID |
|--------|-------------------|----------|
| **Extra Cliqs Pack (+5)** | `prod_addon_cliqs` | `price_addon_cliqs` |
| **Vault Storage (+1 GB)** | `prod_addon_vault_1gb` | `price_addon_vault_1gb` |
| **Vault Storage (+5 GB)** | `prod_addon_vault_5gb` | `price_addon_vault_5gb` |
| **Pip & Pippy Pro** | `prod_addon_pippy_pro` | `price_addon_pippy_pro` |
| **Extra Member Seat** | `prod_addon_member_seat` | `price_addon_member_seat` |

---

## 🔑 Promo Code Strategy

### **Promo Code Types**

#### **Type 1: Lifetime Membership (Early Testers)**
```
Code: CLIQSTR_LIFETIME_TESTER_{UUID}
Type: Discount
Discount: 100% (free forever)
Duration: Forever (no expiration)
Max Uses: 1
Applies To: All plans
Admin-Created: Yes (generated per tester)
```

**Use Case:** Parents who test APA v2 during private beta get lifetime free access.

**Implementation:**
```typescript
// In Stripe dashboard:
// 1. Create promo code per tester
// 2. Copy code to docs/PROMO-CODES.md (internal)
// 3. Share code with tester via email
// 4. Track usage: "X testers claimed lifetime access"

// Example:
CLIQSTR_LIFETIME_TESTER_rachel_hart_001
CLIQSTR_LIFETIME_TESTER_vic_002
CLIQSTR_LIFETIME_TESTER_michelle_003
```

#### **Type 2: Future Launch Discounts**
```
Code: CLIQSTR_LAUNCH_{MONTH}
Type: Discount
Discount: 20-50% (depends on campaign)
Duration: Time-limited (e.g., Nov 1 - Nov 30)
Max Uses: Unlimited
Applies To: Specific plans or all plans
Admin-Created: Yes (campaigns)
```

**Use Cases:**
- "Friends & Family Launch": 30% off first 3 months
- "Referral": 20% off when referring a friend
- "Holiday": 40% off Annual plans in December
- "Beta Gratitude": 50% off first month for private beta users (alternative to lifetime)

---

## 📊 Convex Schema Integration

### **Updated `onboardingFlows` Table**

```typescript
onboardingFlows: defineTable({
  // ... existing fields ...
  
  // Plan selection
  selectedPlanType: v.optional(v.union(
    v.literal("child"),
    v.literal("adult"),
    v.literal("family"),
    v.literal("large_group"),
    v.literal("free_trial") // Default while choosing
  )),
  
  billingCycle: v.optional(v.union(
    v.literal("monthly"),
    v.literal("annual")
  )),
  
  // Stripe integration
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()), // which plan/cycle they chose
  stripeTrialEndAt: v.optional(v.number()), // Unix timestamp
  
  // Promo code
  promoCodeUsed: v.optional(v.string()), // e.g., "CLIQSTR_LIFETIME_TESTER_001"
  promoCodeDiscount: v.optional(v.object({
    percentOff: v.optional(v.number()), // 0-100
    amountOff: v.optional(v.number()), // in cents
    duration: v.string(), // "forever", "limited", etc.
  })),
  
  // Plan details
  planDetails: v.optional(v.object({
    maxMembers: v.number(),
    maxCliqs: v.number(),
    storageGB: v.number(),
    autoPurgeImageDays: v.number(),
    autoPurgeThreadDays: v.number(),
  })),
  
  // Status progression
  status: v.union(
    // ... existing statuses ...
    v.literal("plan_selection_pending"), // After email verified, before plan chosen
    v.literal("plan_selected"),          // Plan chosen, waiting for Stripe setup
    v.literal("stripe_setup_pending"),   // Stripe SetupIntent created
    v.literal("stripe_setup_complete"),  // Card verified (or trial started)
    v.literal("subscription_active"),    // Ready for account creation
    // ... rest of existing statuses ...
  ),
})
```

### **Updated `accounts` Table**

```typescript
accounts: defineTable({
  // ... existing fields ...
  
  // Plan info (synced from onboardingFlows)
  planType: v.union(
    v.literal("child"),
    v.literal("adult"),
    v.literal("family"),
    v.literal("large_group"),
    v.literal("free")
  ),
  
  billingCycle: v.union(
    v.literal("monthly"),
    v.literal("annual"),
    v.literal("lifetime"), // For testers with promo
    v.literal("none")      // For children under parents
  ),
  
  // Stripe references
  stripeCustomerId: v.string(),
  stripeSubscriptionId: v.optional(v.string()),
  stripePriceId: v.optional(v.string()),
  
  // Trial tracking
  trialStartedAt: v.number(),
  trialEndsAt: v.number(),
  trialUsed: v.boolean(), // Can only use trial once
  
  // Limits (synced from plan)
  maxMembers: v.number(),
  maxCliqs: v.number(),
  storageGB: v.number(),
  
  // Billing info
  planStartDate: v.number(),
  nextBillingDate: v.optional(v.number()),
  planStatus: v.union(
    v.literal("active"),
    v.literal("trial"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("lifetime")
  ),
  
  // Phone + Twilio (prepared for Week 4 RED ALERT SMS)
  // NOTE: These are optional for now. Phone collection added in Week 4.
  phoneNumber: v.optional(v.string()),
  phoneVerified: v.optional(v.boolean()),
  
  // RED ALERT preferences (for Twilio SMS)
  redAlertChannels: v.optional(v.union(
    v.literal("email_only"),
    v.literal("sms_only"),
    v.literal("both")
  )),
  redAlertSeverityThreshold: v.optional(v.union(
    v.literal("all"),        // Alert on low/medium/high
    v.literal("medium_high"), // Alert on medium+high only
    v.literal("high_only")    // Only critical
  )),
})
```

### **Updated `auditEvents` Table** (Prepared for Week 4 RED ALERT)

```typescript
auditEvents: defineTable({
  actorId: v.id("users"),
  parentId: v.optional(v.id("users")), // if child, link to parent
  event: v.string(), // "post_created", "comment_added", "cliq_joined", etc.
  targetId: v.optional(v.string()), // what was affected
  details: v.optional(v.object({})), // context
  createdAt: v.number(),
  
  // RED ALERT tracking (prepared for Week 4, unused until then)
  // NOTE: These fields will be populated when AI moderation flags content
  isFlagged: v.optional(v.boolean()),
  flagSeverity: v.optional(v.union(
    v.literal("low"),     // Oversharing, minor concerns
    v.literal("medium"),  // Potential bullying, suspicious behavior
    v.literal("high")     // Grooming signals, self-harm indicators
  )),
  redAlertSent: v.optional(v.boolean()),
  redAlertSentVia: v.optional(v.union(
    v.literal("email"),   // Email only (Week 2-3)
    v.literal("sms"),     // SMS only (Week 4+)
    v.literal("both")     // Email + SMS (Week 4+)
  )),
  redAlertSentAt: v.optional(v.number()),
})
  .index("by_parentId", ["parentId"])
  .index("by_actorId", ["actorId"])
  .index("by_isFlagged", ["isFlagged"])
```

---

## 🔄 Plan Selection Flow (State Machine)

### **Step 1: Plan Selection Initiated**
```
Status: plan_selection_pending
User: Sees 4 plan options + monthly/annual toggle
```

### **Step 2: Plan & Promo Code Selected**
```
API Call: POST /api/auth/v2/select-plan
Body: {
  flowId: "...",
  planType: "family",        // child | adult | family | large_group
  billingCycle: "annual",    // monthly | annual
  promoCode: "CLIQSTR_LAUNCH_NOV" // optional
}

Server:
1. Validate promo code (if provided)
   - Check if valid, not expired, not max-uses reached
   - Calculate discount
2. Validate plan eligibility
   - Child plan: only for minors
   - Family plan: only if parent has inviting 2+ children
3. Create Stripe Customer (if not exists)
4. Update onboardingFlows:
   - planDetails: { maxMembers, maxCliqs, storage, ... }
   - promoCodeUsed, promoCodeDiscount
   - stripeCustomerId
   - status: "plan_selected"

Response: { success, planDetails, estimatedCost, stripeClientSecret }
```

### **Step 3: Stripe Setup (Trial or Card)**

**If no promo or discount allows immediate access:**
```
API Call: POST /api/auth/v2/create-setup-intent
Body: { flowId }

Server:
1. Create Stripe SetupIntent
2. Return { clientSecret } for frontend
3. Update onboardingFlows.status: "stripe_setup_pending"

Frontend:
- Shows Stripe card input OR
- Shows "30-day trial starting" (if eligible)
- Collects card info
```

**If promo code is lifetime or full discount:**
```
Skip Stripe setup entirely
Mark status: "subscription_active"
Proceed to account creation
```

### **Step 4: Stripe Webhook Confirmation**
```
Event: setup_intent.succeeded
Action: 
1. Update onboardingFlows:
   - stripePriceId (which plan)
   - stripeTrialEndAt (30 days from now)
   - status: "stripe_setup_complete"
2. Ready for account finalization
```

### **Step 5: Account Finalization**
```
API Call: POST /api/auth/v2/finalize-account
Body: { flowId }

Server:
1. Create user + account + profile atomically
2. Create Stripe subscription with trial
   - SetupIntent → Subscription
   - Apply promo code if needed
   - Start 30-day trial
3. Update onboardingFlows.status: "completed"
4. Sync plan details to accounts table

Result: User created with plan active (or in trial)
```

---

## 💳 Stripe Webhook Events to Handle

| Event | Action |
|-------|--------|
| `customer.created` | Log customer creation |
| `setup_intent.succeeded` | Mark payment method verified → proceed to account creation |
| `subscription.created` | Log subscription start + trial end date |
| `subscription.updated` | Sync plan changes (if upgrade/downgrade mid-cycle) |
| `invoice.created` | Log upcoming invoice |
| `invoice.payment_succeeded` | Confirm payment, keep subscription active |
| `invoice.payment_failed` | Alert user, mark account `past_due` |
| `customer.subscription.deleted` | Mark plan `canceled` |

---

## 🎯 Promo Code Validation Logic

### **Convex Mutation: `stripe.validatePromoCode`**

```typescript
export const validatePromoCode = mutation({
  args: {
    code: v.string(),
    planType: v.string(),
    billingCycle: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // 1. Query Stripe API
      const coupon = await stripe.coupons.retrieve(args.code);
      
      if (!coupon.active) {
        throw new Error("Promo code is expired or inactive");
      }
      
      if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
        throw new Error("Promo code has reached max uses");
      }
      
      // 2. Calculate discount
      let discount = 0;
      if (coupon.percent_off) {
        discount = coupon.percent_off;
      } else if (coupon.amount_off) {
        // Convert to percentage based on plan price
        const planPrice = getPlanPrice(args.planType, args.billingCycle);
        discount = (coupon.amount_off / planPrice) * 100;
      }
      
      // 3. Log promo code usage (for analytics)
      await ctx.db.insert("auditEvents", {
        event: "promo_code_validated",
        details: { code: args.code, discount },
        createdAt: Date.now(),
      });
      
      return {
        valid: true,
        discount,
        duration: coupon.duration, // "once", "repeating", "forever"
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  },
});
```

---

## 📊 Free Trial Details

### **Trial Eligibility**
- ✅ All plans: 30-day free trial
- ✅ Can only use trial once per account
- ✅ Trial doesn't require credit card upfront
- ✅ After trial expires, payment is required (or plan downgrades to free)

### **Trial Tracking**
```typescript
// In accounts table:
trialStartedAt: number,    // Unix timestamp
trialEndsAt: number,       // Unix timestamp (30 days later)
trialUsed: boolean,        // Can't use trial twice

// Convex query to check trial status:
export const isTrialActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.userId);
    return Date.now() < account.trialEndsAt;
  },
});
```

### **Trial Expiration Handling**
```typescript
// Daily cron job (or Stripe webhook):
// 1. Check for accounts with trialEndsAt < now
// 2. If no payment method on file:
   - Downgrade to free tier (1 cliq, limited features)
   - Send email: "Your trial has ended. Upgrade to continue."
// 3. If payment method on file:
   - Charge first month
   - Start recurring subscription
```

---

## 🔐 Security Considerations

### **Promo Code Protection**
- ✅ Validate code server-side (don't trust client)
- ✅ Check code eligibility before applying
- ✅ Rate-limit promo code validation API
- ✅ Log all promo code usage for fraud detection

### **Plan Selection Protection**
- ✅ Validate user age for child plan (must be < 18)
- ✅ Validate family plan requirements (2+ members invoked)
- ✅ Ensure stripeCustomerId is created before billing

### **Trial Protection**
- ✅ Only allow 1 trial per user (check `trialUsed` flag)
- ✅ Verify trial hasn't been previously redeemed
- ✅ Check age eligibility

---

## 📋 Implementation Checklist

- [ ] Create Stripe products & prices (Child, Adult, Family, Large Group, Add-ons)
- [ ] Create promo code templates (lifetime testers, launch discounts)
- [ ] Update Convex schema (onboardingFlows, accounts)
- [ ] Implement `stripe.validatePromoCode` mutation
- [ ] Implement `auth.selectPlan` mutation
- [ ] Implement `auth.createSetupIntent` mutation
- [ ] Create `/api/auth/v2/select-plan` route
- [ ] Create `/api/auth/v2/create-setup-intent` route
- [ ] Add Stripe webhook handlers
- [ ] Create trial expiration cron job
- [ ] Document promo codes for internal use
- [ ] Test with sandbox Stripe keys

---

## 🚀 Testing Checklist

- [ ] Test adult signup → plan selection → Stripe trial
- [ ] Test new parent child invite → family plan required
- [ ] Test promo code application (lifetime, discount)
- [ ] Test trial expiration (no payment → downgrade)
- [ ] Test plan upgrade mid-cycle
- [ ] Test Stripe webhooks in sandbox
- [ ] Test invalid/expired promo codes
- [ ] Test multi-plan family (2 parents, 4 children)

---

© 2025 Cliqstr Inc. — APA v2 + Stripe Integration

