# Twilio RED ALERT SMS — Phased Implementation Plan
*Week 4 Safety Feature (Non-Breaking Addition to APA v2)*

---

## 📋 Executive Summary

**RED ALERT SMS is the killer feature that makes parents pay.**

When a child posts something flagged by AI (bullying, grooming signals, oversharing), parents get an SMS *in 60 seconds*, not when they next log into PHQ.

**But it doesn't need to ship with auth.** Here's the phased plan:

| Phase | Week | What | Status |
|-------|------|------|--------|
| **Auth Foundation** | Fri-Sun | State machine, plans, Stripe | ✅ BUILD |
| **Test Stripe** | Week 2 | Subscriptions, billing | ✅ TEST |
| **Silent Monitoring** | Week 2-3 | PHQ feed, child restrictions | ✅ TEST |
| **RED ALERT SMS** | Week 4 | Phone verification + Twilio integration | 📋 ADD |

---

## 🎯 Why Phased?

### **If We Tried to Add Twilio This Weekend:**
- ❌ Adds 4-6 hours of work to Friday-Sunday
- ❌ Phone verification logic is complex (SMS codes, retry logic)
- ❌ Requires Twilio account setup + testing
- ❌ Distracts from core auth (which must be rock solid)
- ❌ Increases risk of breaking auth

### **If We Wait Until Week 4:**
- ✅ Auth is proven + tested
- ✅ Stripe is confirmed working
- ✅ Silent Monitoring is live (email alerts work)
- ✅ We have real data on what flags get sent
- ✅ Twilio is a *feature add*, not a *foundation rebuild*
- ✅ Lower risk of breaking anything

---

## 📱 What We're Preparing Friday (Low Effort)

**Just add schema fields.** No logic yet.

```typescript
// In accounts table:
phoneNumber: v.optional(v.string()),
phoneVerified: v.optional(v.boolean()),

redAlertChannels: v.optional(v.union(
  v.literal("email_only"),
  v.literal("sms_only"),
  v.literal("both")
)),

// In auditEvents table:
isFlagged: v.optional(v.boolean()),
flagSeverity: v.optional(v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
)),
redAlertSent: v.optional(v.boolean()),
redAlertSentVia: v.optional(v.union(
  v.literal("email"),
  v.literal("sms"),
  v.literal("both")
)),
redAlertSentAt: v.optional(v.number()),
```

**That's it.** 10 minutes Friday. Everything else is Week 4.

---

## 🔄 Week 4 Implementation (When Ready)

### **Step 1: Twilio Setup**
```
1. Create Twilio account
2. Get phone number (to send SMS from)
3. Get API keys (Account SID, Auth Token)
4. Enable SMS capability
5. Add to .env.local
```

### **Step 2: Phone Verification Flow**
```
POST /api/auth/v2/request-phone-verification
- Input: { accountId, phoneNumber }
- Generate 6-digit code
- Send via Twilio SMS
- Return: { success, message }

POST /api/auth/v2/verify-phone-code
- Input: { accountId, code }
- Validate code
- Mark phoneVerified=true
- Return: { success, phoneVerified }
```

### **Step 3: RED ALERT Email + SMS**
```typescript
// When content is flagged:
mutation("audit.flagContent", async (ctx, args) => {
  const { postId, severity } = args;
  
  // 1. Log flag to auditEvents
  // 2. Get parent of content author
  // 3. Check parent's redAlertChannels:
  
  if (channel === "email_only" || "both") {
    await sendRedAlertEmail(...);
  }
  
  if (channel === "sms_only" || "both") {
    await twilio.messages.create({
      body: `🚨 RED ALERT: ${reason}. Review: https://cliqstr.com/parents/hq/red-alerts`,
      to: parent.phoneNumber,
    });
  }
  
  // 4. Mark redAlertSent=true, redAlertSentVia=channel
});
```

### **Step 4: Testing**
```
- Send test SMS to yourself
- Verify parent receives alert in 60 seconds
- Test email + SMS together
- Test "email only" preference
- Test "sms only" preference
- Monitor Twilio logs for delivery
```

---

## ✅ Friday Checklist (For Twilio Prep)

**Add to schema:**
- [ ] `phoneNumber: v.optional(v.string())` in accounts
- [ ] `phoneVerified: v.optional(v.boolean())` in accounts
- [ ] `redAlertChannels`, `redAlertSeverityThreshold` in accounts
- [ ] `isFlagged`, `flagSeverity`, `redAlertSent`, `redAlertSentVia`, `redAlertSentAt` in auditEvents

**Add to comments:**
```typescript
// Twilio RED ALERT SMS integration planned for Week 4
// Phone fields are optional until then (null-safe)
```

**Cost:** 10 minutes  
**Benefit:** Zero additional code needed in Week 4 to add Twilio

---

## 📊 Week 2-3 Flow (Email Only)

```
Child posts content
  ↓
AI moderation flags it
  ↓
auditEvent created (isFlagged=true)
  ↓
Email sent to parent (current PHQ notification)
  ↓
Parent sees it in PHQ within minutes
```

**RED ALERT SMS not needed yet.** Email is sufficient for testing.

---

## 📱 Week 4+ Flow (Email + SMS)

```
Child posts content
  ↓
AI moderation flags it
  ↓
auditEvent created (isFlagged=true)
  ↓
Email sent to parent
  AND
SMS sent to parent's phone
  ↓
Parent sees it in 60 seconds (SMS)
AND
Parent sees it in PHQ (email)
```

**This is the magic.** Real-time safety.

---

## 💡 Why This Matters for Fundraising

**Pitch:**
> *"When a child posts something flagged by our AI, parents get an SMS in 60 seconds. Not email. Not push. SMS — the most reliable channel. They can immediately review and respond. That's real parental control."*

**Investors hear:** Safety + Speed + Intentionality

---

## 🚀 Week 4 Execution (Rough Timeline)

**Monday - Wednesday:** Build phone verification  
**Wednesday - Thursday:** Wire Twilio into audit flagging  
**Thursday - Friday:** Test end-to-end  
**Friday:** Deploy to production  

**Total effort:** ~8-12 hours (spread across week)

---

## ✅ Non-Breaking Design

**Key principle:** Phone and RED ALERT are *optional*.

- Parents can use Cliqstr without giving phone number
- Parents can choose email-only alerts
- If Twilio breaks, email still works
- No auth changes needed

**This is why we can add it Week 4 without risk.**

---

## 📋 Summary

**Friday:** Add optional fields to schema (10 min)  
**Week 2-3:** Test auth, Stripe, Silent Monitoring (email alerts)  
**Week 4:** Integrate Twilio + enable SMS (8-12 hours)  

**Result:** Investor-grade platform with real-time safety alerts, built on a solid foundation.

---

## 🎬 Investor Pitch (Week 4+)

```
"Our safety features start with Silent Monitoring 
— parents see everything their child does. 

But Silent Monitoring is passive. For urgent safety concerns,
our AI flags content in real-time, and we SMS the parent immediately. 

That's not just oversight. That's actual protection."
```

---

© 2025 Cliqstr Inc.  
Designed by Aiden + Mimi Thomas  
Built with Cursor AI

