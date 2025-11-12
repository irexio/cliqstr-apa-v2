# Cliqstr Promo Code Management
*Early Tester Lifetime Access + Future Campaign Codes*

---

## 📋 Overview

This document defines how to create, track, and manage promo codes for Cliqstr.

**Two Categories:**
1. **Lifetime Tester Codes** — 100% discount forever (early testers)
2. **Campaign Codes** — Time-limited discounts (launch, referral, holiday, etc.)

---

## 🎯 Lifetime Tester Codes (Private Beta)

### **Purpose**
Reward early testers (mom/dad groups, team members, advisors) with **lifetime free access** to Cliqstr.

### **Code Format**
```
CLIQSTR_LIFETIME_TESTER_{IDENTIFIER}_{NUMBER}

Examples:
CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001
CLIQSTR_LIFETIME_TESTER_VIC_002
CLIQSTR_LIFETIME_TESTER_MOM_GROUP_SOCAL_001
CLIQSTR_LIFETIME_TESTER_ADVISOR_TECH_001
```

### **Stripe Setup**
```
1. Go to Stripe Dashboard → Billing → Coupons
2. Click "Create coupon"
3. Fill:
   - Coupon ID: CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001
   - Discount: 100% off
   - Duration: Forever (applies to all renewals)
   - Max uses: 1 (one-time use per tester)
4. Create coupon
5. Document code + tester name in PROMO-CODES-REGISTRY.md
```

### **Tester Registry** (Private — Keep in Google Sheets or Notion)

| Tester Name | Email | Code | Plan Given | Created Date | Used Date | Notes |
|-------------|-------|------|-----------|--------------|-----------|-------|
| Rachel Hart | rachel@... | CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001 | Family | 2025-11-15 | 2025-11-16 | Early tester, QA feedback |
| Vic | vic@... | CLIQSTR_LIFETIME_TESTER_VIC_002 | Family | 2025-11-15 | — | Team member |
| Michelle | michelle@... | CLIQSTR_LIFETIME_TESTER_MICHELLE_003 | Family | 2025-11-15 | — | Team member |
| Jordan | jordan@... | CLIQSTR_LIFETIME_TESTER_JORDAN_004 | Family | 2025-11-15 | — | Team member |
| Mom Group (SoCal) | ... | CLIQSTR_LIFETIME_TESTER_MOM_GROUP_SOCAL_001 | Family | 2025-11-20 | — | 5-person group |

### **Distribution Method**
```
1. Email tester personalized message:

Subject: Your Cliqstr Early Tester Lifetime Access Code 🎉

Hi Rachel,

Thank you for helping us build Cliqstr! As an early tester, you've earned
a special gift: **lifetime free access** to our platform.

Your Code: CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001

Just enter this code when signing up, and you'll have unlimited access forever.

Thanks for your feedback and trust!
— Mimi & The Cliqstr Team

2. Track in spreadsheet: Used Date = when they actually redeem
3. Follow up at 30 days if not redeemed
```

### **Tracking in Convex**

When a tester redeems their code:

```typescript
// Log to auditEvents
await ctx.db.insert("auditEvents", {
  event: "lifetime_tester_code_redeemed",
  actorId: userId,
  details: {
    code: "CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001",
    testerName: "Rachel Hart",
    planType: "family",
    redeemedAt: Date.now(),
  },
  createdAt: Date.now(),
});

// Update accounts table
await ctx.db.patch(accountId, {
  billingCycle: "lifetime",
  planStatus: "active",
  nextBillingDate: null, // Never charge
});
```

---

## 🎪 Campaign Promo Codes (Future Discounts)

### **Campaign Types**

#### **1. Friends & Family Launch** (November 2025)
```
Code: CLIQSTR_LAUNCH_NOV2025
Discount: 30% off first 3 months (then regular pricing)
Duration: Nov 1 - Nov 30, 2025
Max Uses: Unlimited
Applies To: All plans
Billing: Monthly or annual (discount applies to first billing cycle)
```

#### **2. Referral Code** (Always available)
```
Code: CLIQSTR_REFER_[REFERRER_ID] (personalized)
Discount: 20% off first month
Duration: Ongoing (no end date)
Max Uses: Unlimited
Applies To: All plans
Special: Referrer also gets 20% off next month
```

#### **3. Holiday Promotion** (December)
```
Code: CLIQSTR_HOLIDAY_2025
Discount: 40% off annual plans (2 months free)
Duration: Dec 1 - Dec 31, 2025
Max Uses: Unlimited
Applies To: Annual billing only (not monthly)
```

#### **4. Beta Gratitude** (Alternative to lifetime)
```
Code: CLIQSTR_BETA_THANK_YOU
Discount: 50% off first 6 months
Duration: One-time offer during early access
Max Uses: Limited (e.g., 100 uses)
Applies To: New signups only
```

### **Creating Campaign Codes in Stripe**

```
1. Go to Stripe Dashboard → Billing → Coupons
2. Click "Create coupon"
3. Fill:
   - Coupon ID: CLIQSTR_LAUNCH_NOV2025
   - Discount: 30% off
   - Duration: 
     ○ Repeating (if discount applies to every billing cycle)
     ○ Once (if only first billing cycle)
     ○ Forever (rare, only for lifetime offers)
4. Set max redemptions (optional, e.g., 1000)
5. Set expiration date (Dec 1, 2025)
6. Create coupon
```

### **Campaign Calendar** (Update as you run promotions)

| Campaign | Code | Discount | Start Date | End Date | Max Uses | Status |
|----------|------|----------|-----------|----------|----------|--------|
| Friends & Family Launch | CLIQSTR_LAUNCH_NOV2025 | 30% off 3 mo | 2025-11-01 | 2025-11-30 | Unlimited | Active |
| Holiday 2025 | CLIQSTR_HOLIDAY_2025 | 40% off annual | 2025-12-01 | 2025-12-31 | Unlimited | Planned |
| Beta Gratitude | CLIQSTR_BETA_THANK_YOU | 50% off 6 mo | 2025-11-15 | 2025-12-15 | 100 | Active |

---

## 📊 Promo Code Analytics

### **Queries to Track Success**

```typescript
// Convex query: Get promo code redemption stats
export const getPromoCodeStats = query(async (ctx) => {
  const redeemed = await ctx.db
    .query("auditEvents")
    .filter(q => q.eq(q.field("event"), "promo_code_validated"))
    .collect();

  const stats = {};
  redeemed.forEach(event => {
    const code = event.details.code;
    if (!stats[code]) {
      stats[code] = { count: 0, discount_total: 0 };
    }
    stats[code].count++;
    stats[code].discount_total += event.details.discount;
  });

  return stats;
});

// Example output:
{
  "CLIQSTR_LAUNCH_NOV2025": { count: 47, discount_total: 2350 },
  "CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001": { count: 1, discount_total: 100 },
  "CLIQSTR_BETA_THANK_YOU": { count: 12, discount_total: 1200 }
}
```

### **Metrics to Track**

- Total promo codes created
- Codes redeemed (% of distribution)
- Revenue impact (discount given vs. plan value)
- Campaign effectiveness (which code drives most signups)
- Tester retention (are lifetime testers still active?)

---

## 🔄 Promo Code Lifecycle

### **Phase 1: Create**
```
1. Define campaign (discount, duration, max uses)
2. Create in Stripe
3. Document in PROMO-CODES-REGISTRY.md
4. Generate distribution list
```

### **Phase 2: Distribute**
```
1. Email individuals (testers, referrers, etc.)
2. Post on social (campaigns, public offers)
3. Track distribution date
4. Set reminders (follow-up at 7/14/30 days if not redeemed)
```

### **Phase 3: Monitor**
```
1. Track redemptions via Stripe API
2. Check for fraud (same account redeeming multiple times)
3. Monitor revenue impact
4. Adjust campaigns if needed
```

### **Phase 4: Retire**
```
1. When expiration date hits, mark as "Retired"
2. Archive in spreadsheet
3. Keep for annual reporting
4. Delete from active Stripe coupons (optional, or keep for reporting)
```

---

## 💡 Special Promo Strategies

### **Referral Program (Organic Growth)**

When a user refers a friend:

```typescript
// Create unique referral code for referrer
mutation("referral.createCode", async (ctx, args) => {
  const { userId } = args;
  const referralCode = `CLIQSTR_REFER_${userId}_${Date.now()}`;
  
  // Create in Stripe
  await stripe.coupons.create({
    id: referralCode,
    percent_off: 20,
    duration: "once",
    max_redemptions: 999,
    metadata: {
      referrer_id: userId,
      campaign: "referral",
    }
  });
  
  // Store in database for tracking
  await ctx.db.insert("referralCodes", {
    code: referralCode,
    referrerId: userId,
    createdAt: Date.now(),
    redeemed: 0,
    revenue: 0,
  });
  
  return { referralCode, shareableLink: `https://cliqstr.com/refer/${userId}` };
});

// When referred friend signs up:
// 1. Their discount is 20% off first month
// 2. Referrer gets 20% off next month (separate credit)
// 3. Both tracked in auditEvents for rewards potential
```

### **"Bring a Friend" Family Pricing**

If two families refer each other:
```
Both get 25% off for life (up to 2 years, then regular pricing)
Code: CLIQSTR_BRING_A_FRIEND_[ID]
```

---

## 📝 Promo Code Naming Conventions

**Keep codes:**
- ✅ Clear (easy to remember)
- ✅ Semantic (you know what it is by reading)
- ✅ Unique (no collisions)
- ❌ Not case-sensitive (Stripe auto-lowercases)

**Examples of GOOD codes:**
```
CLIQSTR_LAUNCH_NOV2025      ← Campaign + month
CLIQSTR_LIFETIME_TESTER_001 ← Type + number
CLIQSTR_REFER_RACHEL_123    ← Referral + name + ID
CLIQSTR_HOLIDAY_2025        ← Holiday + year
```

**Examples of BAD codes:**
```
PROMO123              ← Too vague
X7F9Q2                ← Random, hard to remember
CLIQSTR_CODE_1        ← Not semantic enough
```

---

## 🚀 Implementation for APA v2 Launch

### **Testers to Invite (Lifetime Codes)**
1. Rachel Hart
2. Vic
3. Michelle
4. Jordan
5. Your brother (Cory)
6. Mom group (SoCal)
7. Tech advisors/mentors
8. Family friends

**Total estimate: 10-15 lifetime codes**

### **Campaign Codes for Week 1**
1. **CLIQSTR_LAUNCH_NOV2025** (30% off) — Announce on social
2. **CLIQSTR_BETA_THANK_YOU** (50% off) — Email to testers who don't use lifetime code

### **Future Campaigns (Post-Launch)**
1. Referral codes (personalized per user)
2. Holiday promotion (December)
3. Back-to-school (August)
4. New Year resolution (January)

---

## 📊 Revenue Impact Calculation

**Example:**
- Family Plan: $14.99/mo
- 30% launch discount: -$4.50/mo
- Customer pays: $10.49/mo instead

**Aggregate impact (example):**
- 100 signups with CLIQSTR_LAUNCH_NOV2025
- Revenue loss (first month): 100 × $4.50 = $450
- But: 100 new families = LTV over 12 months
- If 50% stay after 3 months: $7,125 annual revenue

**Track this in your fundraising metrics.**

---

## ✅ Checklist for Launch

- [ ] Create Stripe products (Child, Adult, Family, Large Group)
- [ ] Create 10-15 lifetime tester codes in Stripe
- [ ] Create CLIQSTR_LAUNCH_NOV2025 campaign code
- [ ] Create CLIQSTR_BETA_THANK_YOU campaign code
- [ ] Document all codes in internal tracking (spreadsheet)
- [ ] Email codes to testers with instructions
- [ ] Set up Stripe webhook logging for promo redemptions
- [ ] Create Convex audit logging for promo usage
- [ ] Set up weekly reports on promo effectiveness
- [ ] Plan next campaigns (holiday, referral, etc.)

---

© 2025 Cliqstr Inc. — Promo Code Management

