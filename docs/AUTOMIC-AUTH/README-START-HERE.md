# APA v2 Launch Documentation — START HERE 🚀

**Last Updated:** November 10, 2025  
**Status:** Ready for Friday-Sunday Build Sprint  
**Target:** Deploy APA v2 MVP by Sunday evening → Private beta Monday

---

## 📚 Document Index

### **Strategic & Planning**
1. **`APA-Gemini-Auth-Plan.md`** — Technical architecture for state machine auth
2. **`APA-Automic-Framework.md`** — Compliance, safety, parental governance framework
3. **`APA-Comparison.md`** — Why we're rebuilding (current vs. Gemini analysis)

### **Implementation Guides** (For Friday-Sunday)
4. **`STRIPE-PLAN-INTEGRATION.md`** — How plans, Stripe, and auth state machine work together
5. **`PROMO-CODES-MANAGEMENT.md`** — Lifetime testers + campaign codes
6. **`PRICING-SUMMARY-FOR-APA-V2.md`** — Revenue model, investor pitch, forecasting
7. **`TWILIO-RED-ALERT-PHASED-PLAN.md`** — Why SMS RED ALERT safety waits until Week 4 (non-breaking addition)

### **Build Resources** (I'll create these before Friday)
- **`MIGRATION-PLAN.md`** — What to copy from v1, what to rebuild
- **`APA-V2-SCHEMA-BLUEPRINT.md`** — Ready-to-use Convex schema
- **`APA-V2-API-ROUTES.md`** — All API endpoint signatures
- **`FRI-SAT-SUN-EXECUTION-PLAN.md`** — Hour-by-hour schedule

---

## 🎯 Quick Summary

### **What We're Building**
A new authentication system (**APA v2**) that:
- ✅ Uses **atomic Convex state machine** (no more orphaned users)
- ✅ Integrates **Stripe VPC** for COPPA-compliant parental verification
- ✅ Implements **immutable audit logging** (every action traceable)
- ✅ Supports **plan selection + promo codes** from day one
- ✅ Is **investor-grade** (audit-ready, compliant, transparent)

### **Why We're Doing This**
- ❌ Current auth has been broken for 4 months
- ❌ Constant patching instead of fixing root cause (missing state)
- ❌ Not fundraising-ready (investors see fragile code)
- ✅ APA v2 fixes everything + shows real engineering rigor

### **Timeline**
- **This Week:** Prep (you answer questions about pricing, avatars, team availability)
- **Friday-Sunday:** Build (concentrated 36 hours of focused coding)
- **Monday:** Deploy to staging, invite 15 private beta testers
- **Week 2:** Feedback & iteration
- **Week 3:** Public launch to 50-100 families

---

## 💰 Pricing at a Glance

| Plan | Monthly | Annual | For |
|------|---------|--------|-----|
| **Child** | $2.99 | $28.70 | Kids under parent |
| **Adult** | $3.99 | $38.30 | Solo adults |
| **Family** | $14.99 | $143.90 | 2 adults + 4 kids |
| **Large Group** | $29.99 | $287.90 | PTAs, teams, clubs |

**All include:** 30-day free trial, ad-free, family-safe, auto-purge for privacy

### **Special Offers**
- **Lifetime for Testers:** CLIQSTR_LIFETIME_TESTER_[NAME] (100% off forever)
- **Launch Discount:** CLIQSTR_LAUNCH_NOV2025 (30% off 3 months)
- **Beta Gratitude:** CLIQSTR_BETA_THANK_YOU (50% off 6 months)

---

## 🔄 Signup Flow (New)

```
1. Email + Birthdate
   ↓
2. Plan Selection (with promo code option)
   ↓
3. Stripe Setup (trial or card validation)
   ↓
4. Parent/Child Flow (based on age)
   ↓
5. Account Created + Subscription Active
```

---

## 📊 What You Need to Answer (Before Friday)

I've created all the docs, but I need your input on:

### **1. Avatar Organization** 
How do you want avatars organized?
- [ ] **Occupations** (doctors, lawyers, firefighters, etc.) + **Animals** + **Fantasy** + **Families** + **Sports**
- [ ] Some other way (tell me!)

### **2. Team Availability**
Who's helping Friday-Sunday? When?
- Rachel: Available ___?
- Vic: Available ___?
- Michelle: Available ___?
- Jordan: Available ___?

### **3. Private Beta Timing**
- [ ] Private beta starts Monday (10 testers)
- [ ] Take Monday to polish, start Tuesday
- [ ] Other timing?

### **4. Promo Code Recipients**
Confirm the 15 testers who should get lifetime access:
- [ ] Rachel Hart
- [ ] Vic, Michelle, Jordan (team)
- [ ] Your brother (Cory) + family
- [ ] Mom/Dad group (SoCal)
- [ ] Tech advisors: ___?

---

## ✅ Before Friday Morning

**I will have ready for you:**
1. ✅ New Vercel/Convex accounts created
2. ✅ v2 repo initialized with correct structure
3. ✅ Convex schema blueprint (copy-paste ready)
4. ✅ API route templates
5. ✅ Email templates documented
6. ✅ Hour-by-hour execution schedule
7. ✅ All test data scripts

**You just need to:**
1. Answer the 4 questions above
2. Share any last-minute preferences
3. Make coffee Friday morning ☕

---

## 🚀 Friday-Sunday at a Glance

### **Friday (12 hours)**
- 8am-11am: Schema setup + Convex tables
- 12pm-3pm: Core auth mutations (registerInitiate, handleMagicLink, selectPlan)
- 4pm-7pm: API routes + CSRF protection
- 8pm-12am: Testing + bug fixes

### **Saturday (12 hours)**
- 10am-1pm: Copy preserved code (cliqs, posts, calendar, images)
- 2pm-5pm: Build AtomicSignupFlow UI
- 6pm-9pm: Integration testing
- 10pm-12am: Polish + documentation

### **Sunday (8 hours)**
- 10am-12pm: Stripe test mode integration
- 1pm-3pm: End-to-end testing with real data
- 4pm-6pm: Deploy to staging
- 7pm-8pm: Smoke tests + cleanup

**Result by Sunday 8pm:** APA v2 MVP ready for Monday beta launch

---

## 📈 Post-Launch (Week 2-4+)

### **Week 2: Private Beta + Test Stripe**
- Invite 15 testers (lifetime code recipients)
- Collect feedback on auth flows
- Test Stripe subscriptions + plan enforcement
- Track signup completion rate
- Fix bugs found

### **Week 3: Public Launch + Silent Monitoring**
- Announce to mom/dad groups
- Invite 50-100 families
- Deploy Silent Monitoring (PHQ audit feed)
- Test child restrictions (verify permissions enforced)
- Track: signups, retention, plan distribution
- Collect video testimonials

### **Week 4: Add Twilio + RED ALERT SMS**
- Integrate Twilio SDK
- Build phone verification flow (optional during signup or PHQ)
- Enable RED ALERT SMS for flagged content
- Test parent notification in real-time
- Confirm email + SMS alerts working

### **Week 4+: Fundraising Ready**
- Real usage metrics (auth, Stripe, PHQ, RED ALERT)
- Parent testimonials (video clips)
- Revenue trajectory ($300-500/mo by Week 3)
- Solid codebase + audit trail
- Safety features demonstrated (Silent Monitoring + RED ALERT)

---

## 🎯 Success Metrics (For You to Track)

**By end of Week 1 (private beta):**
- ✅ 15 testers signed up
- ✅ 80%+ plan selection completion
- ✅ 0 abandoned flows mid-signup
- ✅ No "USER NOT FOUND" errors

**By end of Week 2 (public beta):**
- ✅ 50+ families signed up
- ✅ 30+ cliqs created
- ✅ 10+ child accounts created
- ✅ 50%+ parents used PHQ

**By end of Week 3:**
- ✅ 100+ families signed up
- ✅ $300-500/mo MRR
- ✅ 5-10 parent testimonials recorded
- ✅ Ready for investor presentation

---

## 💡 Investor Talking Points (When You're Ready)

**"Cliqstr isn't a startup guessing at what families want. We've built something real, and real families are already using it. Our authentication is COPPA-compliant, our moderation is AI-assisted, and our parents have real oversight—not fake permission screens. We're charging fair prices ($3-15/mo) because we're serious about building a sustainable business, not an ad-driven nightmare. And because we're not selling data or showing ads, families actually trust us."**

---

## 📞 Questions?

**By Thursday EOD, send me:**
1. Avatar organization preference
2. Team availability Friday-Sunday
3. Confirmed list of 15 lifetime tester recipients
4. Any other concerns or preferences

**I'll have everything else ready.**

---

## 🎬 What Success Looks Like (Friday-Sunday)

**Sunday evening, you'll have:**
- ✅ New APA v2 codebase (clean, organized, documented)
- ✅ All auth flows working (adult, child, invited adult, invited child, new parent, existing parent, existing adult)
- ✅ Plan selection + Stripe test mode integrated
- ✅ Promo codes working (lifetime + campaign)
- ✅ Audit trail logging all actions
- ✅ Phone fields in schema (optional, prepared for Twilio Week 4)
- ✅ RED ALERT framework in auditEvents (prepared for SMS Week 4)
- ✅ Ready for Monday morning beta launch

**And you'll know:** This isn't a patch. This is a foundation. Plus, Twilio will bolt on cleanly in Week 4 without breaking anything.

---

## 🚨 Phased Safety Rollout

| Phase | Week | Feature | Status |
|-------|------|---------|--------|
| **Auth** | Fri-Sun | State machine, plans, Stripe | ✅ BUILD |
| **Stripe** | Week 2 | Subscriptions, billing | ✅ TEST |
| **Silent Monitoring** | Week 2-3 | PHQ feed, child restrictions | ✅ TEST |
| **Twilio RED ALERT** | Week 4 | SMS to parents for flagged content | 📋 ADD |

**Why phased?** Builds confidence. Each phase is tested before adding the next.

---

## 🙌 You've Got This

You have:
- ✅ Solid architecture (APA v2)
- ✅ Supportive team (Rachel, Vic, Michelle, Jordan)
- ✅ Real users waiting (mom groups)
- ✅ Clear mission (safety for kids)
- ✅ Funding goal (Mozilla, tech grants, VCs)

**This weekend, you're going to build something investors will respect and families will trust.**

Let's go. 🚀

---

**Next Step:** Answer the 4 questions above, send by Thursday EOD. I'll have everything ready for Friday morning.

© 2025 Cliqstr Inc. — APA v2 Launch

