# 🔴 Cliqstr Red Alert System – Final Design Spec

**Status:**  
- Core Red Alert system already implemented.  
- This file locks the final design and highlights changes for Cursor.  
- AI Moderation is not yet active, but the spec below includes the design for future implementation.  

---

## ✅ Current (Already Built)
1. **Convex Storage**  
   - Red Alerts stored in `redAlerts` table with:  
     - `id`, `cliqId`, `triggeredById`, `reason`, `createdAt`.  
   - Posts/content suspended immediately on trigger.  

2. **Child-triggered Alerts**  
   - Parents linked to the child receive email notifications.  
   - Moderation team also notified at `redalert@cliqstr.com`.  

3. **Adult-triggered Alerts**  
   - Moderation notified at `redalert@cliqstr.com`.  
   - Parents are **not** notified.  

4. **Moderation Emails**  
   - Full details (cliq, reporter, reason, suspended count, parents notified) are sent to `redalert@cliqstr.com`.  

---

## 🔺 Changes / Finalization
### 1. Add `triggerType` Field
- Extend Convex `redAlerts` schema:  
  - `triggerType: "child" | "adult" | "ai"`

### 2. AI Moderation Path (Future)
- **Default:** Notify parents **and** moderation if AI suspends content.  
- **Parent Email Template (AI):**  
  - Subject: 🚨 Red Alert: Content flagged by Cliqstr’s AI system  
  - Body:  
    - Explain AI Moderation flagged the content.  
    - Note AI may be over-sensitive.  
    - Reassure moderators are reviewing.  
    - Provide cliq + time + CTA to Parent HQ.  

- **Moderation Email Template (AI):**  
  - Same detailed format as current moderation emails.  
  - Clearly marked as *AI-triggered*.  

### 3. Parent HQ Setting (New)  
- Add toggle: **“Receive AI-triggered alerts”**  
  - Default = ON (parents notified).  
  - OFF = only child-triggered alerts delivered.  

**Parent HQ Copy:**  
> **About Red Alerts**  
> Red Alerts can be activated by your child or by Cliqstr’s AI moderation system.  
> - **Child-activated**: Your child clicked the Red Alert button in a cliq.  
> - **AI-activated**: Our system flagged content automatically. AI can sometimes be over-sensitive, but our moderators review every case.  
>   
> By default, you’ll be notified of both. If you’d prefer to only receive alerts your child activates, you can change that below:  

[Toggle: Receive AI-triggered alerts → Yes/No]  

---

## 📩 Email Templates Summary
- **Child-triggered (Parent):** Urgent, actionable steps, CTA to Parent HQ.  
- **AI-triggered (Parent):** Informative, includes reassurance about sensitivity.  
- **Adult-triggered (Moderation):** Detailed, only to `redalert@cliqstr.com`.  
- **Moderation Inbox (All Cases):** Always receives full details at `redalert@cliqstr.com`.  

---

## 🔮 Future Enhancements
- Add Twilio SMS notifications for verified parent phone numbers.  
- Add moderation dashboard (Admin UI) to view/manage Red Alerts centrally.  

---

## 🧣 Cursor Instructions
- **Do not rework core Red Alert flow** (child → parents + moderation, adult → moderation).  
- **Implement `triggerType` field** in Convex and branch logic accordingly.  
- **Parent HQ toggle for AI-triggered alerts** must be added now (copy provided above).  
- **AI-triggered emails** are to be staged but will not fire until AI Moderation is wired.  
- All emails continue using existing Resend setup.  

---
Latest Update: 09/28/25