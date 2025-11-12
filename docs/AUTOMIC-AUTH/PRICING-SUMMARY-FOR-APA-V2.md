# Cliqstr Pricing Summary for APA v2
*Complete Integration: Plans + Stripe + Promo Codes*

---

## 📊 Quick Reference

### **Cliqstr Plan Tiers**

| Plan | Monthly | Annual | Seats | Max Cliqs | Storage | Best For |
|------|---------|--------|-------|-----------|---------|----------|
| **Child Plan** | $2.99 | $28.70 | 1 child | 3 | 1 GB | Single child accounts |
| **Adult Plan** | $3.99 | $38.30 | 1 adult | 3 | 3 GB | Solo adults |
| **Family Plan** | $14.99 | $143.90 | 6 (2+4) | 15 | 10 GB | Families with kids |
| **Large Group Plan** | $29.99 | $287.90 | 20 | 30 | 25 GB | PTAs, clubs, teams |

**All plans include:**
- 30-day free trial (no credit card)
- Ad-free, private, family-safe platform
- 60/90-day auto-purge for privacy
- Basic AI moderation tools

---

## 🎁 Promo Codes

### **Lifetime Testers** (100% off forever)
```
Code: CLIQSTR_LIFETIME_TESTER_[NAME]_[NUMBER]
Duration: Forever (one-time setup per tester)
Max Uses: 1
Target: Early beta users, team members, advisors
```

**Testers invited:**
- Rachel Hart
- Vic, Michelle, Jordan (team)
- Your brother + family friends
- Mom/Dad groups
- Tech advisors

**Total: ~10-15 lifetime codes**

### **Campaign Codes** (Time-limited discounts)

| Code | Discount | Duration | Max Uses | Applies To |
|------|----------|----------|----------|-----------|
| **CLIQSTR_LAUNCH_NOV2025** | 30% off 3 months | Nov 1-30 | Unlimited | All plans |
| **CLIQSTR_BETA_THANK_YOU** | 50% off 6 months | Nov 15 - Dec 15 | 100 uses | New signups |
| **CLIQSTR_HOLIDAY_2025** | 40% off annual | Dec 1-31 | Unlimited | Annual only |
| **CLIQSTR_REFER_[ID]** | 20% off 1 month | Ongoing | Unlimited | Referral |

---

## 🔄 Signup Flow with Pricing

```
1. Email verification
   ↓
2. Plan selection screen
   ├─ See all 4 plans
   ├─ Toggle monthly/annual
   └─ Enter promo code (optional)
   ↓
3. Stripe setup
   ├─ If using promo (100% off): skip card
   ├─ If using trial: collect card (not charged yet)
   └─ If promo has partial discount: show adjusted price
   ↓
4. Account creation + Stripe subscription
   ├─ Start 30-day trial (if eligible)
   ├─ Apply promo code discount
   └─ Add to plan limits (seats, cliqs, storage)
   ↓
5. Success → Access platform
```

---

## 💰 Revenue Model

### **Conservative Estimate (Year 1)**

**Assumption: 500 families by end of Year 1**

```
Family Plan: 400 families × $14.99/mo = $71,952/mo = $863,424/yr
Adult Plan: 80 families × $3.99/mo = $319.20/mo = $3,830/yr
Child Plan: 20 accounts × $2.99/mo = $59.80/mo = $718/yr

Total MRR (without promotions): $72,331/mo
Annual: $867,972
```

**After 30% launch discount (first 3 months):**
```
First 3 months: ~$50,631/mo (30% off)
Months 4-12: ~$72,331/mo (full price)

Year 1 conservative revenue: ~$730,000 (accounting for 10% churn)
```

### **Lifetime Tester Impact**
- 15 lifetime codes = ~$225/mo in foregone revenue
- But: **priceless testimonials for fundraising**
- Trade-off: Worth it for user validation

---

## 🎯 Why This Pricing?

### **Alignment with Cliqstr's Mission**
- ✅ **Affordable** ($2.99-$14.99/mo is below TikTok Plus, Discord Nitro)
- ✅ **Transparent** (no hidden fees, auto-purge policies clear)
- ✅ **Fair** (payment goes to safety, not ads)
- ✅ **Family-friendly** (family plan for parents + kids together)
- ✅ **Scalable** (large group plan for PTAs, schools, organizations)

### **Investor Appeal**
- 🎯 SaaS metrics: 30-50% MRR growth is fundable
- 🎯 LTV/CAC: With 40-50% annual retention, strong unit economics
- 🎯 Differentiated: Most kid-safe platforms are freemium + ads (you're paid + safe)
- 🎯 Defensible: Parents will pay for real safety over free + exploitative

---

## 📈 Forecasting for Funding Pitch

### **Slide: "Pricing & Revenue Roadmap"**

```
Q4 2025 (Nov-Dec):
- 50 families sign up (private beta + friends)
- 30% launch discount applied
- MRR: ~$400 (mostly testers, not fully utilized)

Q1 2026 (Jan-Mar):
- 200 families (public launch to mom groups)
- Natural growth + referrals
- MRR: $2,200

Q2 2026 (Apr-Jun):
- 400 families
- 50% annual subscriber conversion
- MRR: $4,500

Year 1 Exit: 500+ families, $867k revenue

Projection (conservative):
- Year 2: 2,000 families, $3.5M revenue
- Year 3: 5,000 families, $9M revenue
```

---

## 🔐 Promo Code Strategy for Fundraising

### **When Pitching:**

> *"We're not racing to million downloads through ads and dark patterns. We're building trust through real families and transparent pricing. Our early testers get lifetime access—not to cheat on unit economics, but to prove product-market fit. That's why we can walk into the room and show real testimonials, not just projections."*

### **Metrics to Show:**
- X families signed up in first 2 weeks
- Y% monthly retention
- Z% annual subscriber conversion
- Testimonials from real parents (video clips)
- Revenue trajectory (even if small, shows monetization works)

---

## ✅ Implementation Checklist for Friday-Sunday Build

### **Friday: Schema Setup**
- [ ] Add `selectedPlanType`, `billingCycle`, `stripePriceId` to `onboardingFlows`
- [ ] Add plan fields to `accounts` table
- [ ] Create Stripe product IDs in `.env`

### **Saturday: API Routes**
- [ ] POST `/api/auth/v2/select-plan` (plan + promo code validation)
- [ ] POST `/api/auth/v2/create-setup-intent` (Stripe card collection)
- [ ] POST `/api/stripe/webhook` (handle subscription events)

### **Sunday: Testing**
- [ ] Test plan selection (all 4 plans, monthly/annual)
- [ ] Test promo code validation (valid, expired, max-uses)
- [ ] Test Stripe SetupIntent flow (sandbox)
- [ ] Test trial start + expiration logic
- [ ] Test lifetime code (100% discount, no card needed)

### **Before Private Beta (Monday)**
- [ ] Create lifetime tester codes in Stripe
- [ ] Email codes to 15 testers
- [ ] Document all codes in private tracking
- [ ] Test end-to-end signup with promo code
- [ ] Confirm Stripe webhooks firing

---

## 🎬 Parent Communication (For Beta Signup Email)

```
Subject: You're Invited to Test Cliqstr (Lifetime Free Access!) 🎉

Hi Rachel,

You've been selected as an early tester for Cliqstr, our new safe social 
platform for families. As a thank you, you're getting **lifetime free 
access** — no monthly fees, ever.

Your Early Access Code: CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001

Cliqstr lets your family:
✅ Create private cliqs (like group chats + shared interests)
✅ Invite kids safely (with parental approval)
✅ Monitor activity invisibly (real-time parent dashboard)
✅ Never see ads or data tracking (just like it should be)

Sign up here: https://cliqstr.com/sign-up?promoCode=CLIQSTR_LIFETIME_TESTER_RACHEL_HART_001

We'd love your feedback. Your insights help us build something better for 
all families.

Thanks for testing!
— Mimi & The Cliqstr Team
```

---

## 📝 Summary for Your Team

**Stripe Pricing = Sustainable Revenue + Trust**

Your pitch to investors:
> *"We're charging fair prices for real safety. Families pay $2.99-$14.99/month because they trust us. That's how we fund engineering, moderation, and compliance. No ads. No dark patterns. No data sales. Just a business model that aligns our success with parent safety."*

**That story sells.**

---

© 2025 Cliqstr Inc. — Pricing Strategy for APA v2
Designed by Aiden + Mimi Thomas
Built with Cursor AI
Updated: November 10, 2025 (V2)

