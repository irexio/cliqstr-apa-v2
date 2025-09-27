# Cliqstr Feature Spec: Feedback, Upgrades, Promo Codes

This document outlines three features to implement in the Cliqstr app. Cursor should use this as the base spec for development.

---

## 1. Account Page – Feedback Button
**Location:** Account/Settings page  
**Behavior:**
- Button opens a modal or form.
- User can submit feedback with a category dropdown: *Bug, Idea, General Comment.*
- Feedback stored in Convex or emailed via Resend to an admin/support inbox.
- Confirmation message: *“Thanks for your feedback!”*

---

## 2. Upgrade Options
**Location:** Account page (parents only)  
**Behavior:**
- Show current plan details (Basic, Premium, Family, Groups).
- Button: *“Upgrade Plan”* → routes parent to Stripe Customer Portal.
- Children who hit limits see *“Request Upgrade”* → parent notified (in-app + email) → parent completes upgrade in Stripe.
- Once payment clears, Convex updates plan limits automatically.

---

## 3. Promo Codes
**Location:** Signup / Checkout flow  
**Behavior:**
- Parent enters promo code during checkout.
- Valid code applies discount or unlock (e.g., extra invites, trial extension).
- Invalid code shows error message.
- Promo code creation/management handled in Stripe dashboard.

---

## Notes for Cursor
- **Feedback** = frontend form + Convex storage/email hook.
- **Upgrades** = use existing Stripe integration (Customer Portal).
- **Promo Codes** = handled through Stripe coupons/promo system.

---

**Summary:**  
- Add a feedback channel for users.  
- Build parent-facing upgrade options.  
- Enable promo codes through Stripe.  

These features tie into Parent HQ for oversight and Stripe for billing.

09/25/25 RPT