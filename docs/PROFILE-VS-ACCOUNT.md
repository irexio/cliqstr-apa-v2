pmail## Clarifying Account vs MyProfile in Cliqstr

We have been struggling to communicate effectively regarding `Account` vs `MyProfile` flows, and we need to address the issue once and for all. Notes, comments, and annotations have not been sufficient — multiple AI assistants have confused the models and overwritten critical session code. As a result, the app is broken and APA security has been compromised more than once.

This plan will serve as the authoritative reference for what each model means, how they behave, and how they are handled across the app.

---

### Clear Role Separation: `Account` vs `MyProfile`

#### 1. `Account` — System-Level Identity (Private)

* Created automatically at sign-up or invite acceptance
* Purpose: Handle system permissions, billing, session, and APA safety
* Fields:

  * `email`
  * `role` (adult | child | parent)
  * `plan`, `stripeStatus`
  * `isApproved`
  * `birthdate` (immutable, used for age verification)
  * `createdAt`, `suspended`
* Not publicly visible
* NEVER includes social `username`, `image`, or `bio`
* Tied to session cookies via `iron-session`
* Header avatar is derived from initials here (e.g., "MT")
* Used in: `/api/sign-in`, `/api/sign-up`, `/api/parent-approval`, etc.

#### 2. `MyProfile` — Public-Facing Identity tied to the Social App

* Created *after* plan selection, via onboarding
* Purpose: What members see inside Cliqs
* Fields:

  * `username` (e.g., `@mimi`)
  * `birthdate`, `showYear`, `ageGroup` (for birthday display only)
  * `image` (avatar), `bannerImage`, `about`
  * `childSettings` (optional)
* This is what shows up:

  * On `My Cliqs` cards
  * Inside cliq views (`/cliqs/[id]`)
  * On `/profile/[handle]`
* Not tied to Stripe, roles, or session cookies
* Used in: `/api/profile/create`, `/profile/edit`, and onboarding flows

---

### Instructions for Future AI Agents and Devs

* Do not add new models, new routes, or redundant logic. You must work within the existing structure.

* Locate and edit existing code related to Account and MyProfile flows. Do not scaffold replacements.

* Ask questions before proceeding if anything about the model or routing is unclear.

* After making any changes, test your updates thoroughly in both local and production-equivalent environments.

* Fix all related build or runtime errors before committing code or triggering deploys.

* The Account avatar (initials-based) must always be visible in the top right corner of the header whenever a user is signed in, regardless of which page or route they are on.

* On mobile, if space is limited, fallback behavior should be used:

  * Display a simplified avatar (initials or generic icon)
  * Or collapse into a menu icon (e.g., ☰ or 👤) that opens the full account menu
  * The fallback must retain access to plan, billing, and logout controls

* The Account avatar (initials-based) must always be visible in the top right corner of the header whenever a user is signed in, regardless of which page or route they are on.

1. **Do not merge fields across Account and MyProfile.**

   * `username`, `bio`, and `avatar` belong in MyProfile ONLY.
   * `role`, `plan`, `email`, `birthdate` belong in Account ONLY.

2. **Do not create new session logic.**

   * `getCurrentUser()` already exists and is APA-safe.
   * It should always load both Account and MyProfile (if MyProfile exists).

3. **Header avatar menu is Account-only.**

   * Always show initials unless a future feature adds optional avatar override.
   * Clicking should show account menu (plan, billing, logout).

4. **Only show MyProfile data inside Cliq views.**

   * Never expose birthdate, image, or about outside `/my-cliqs`, `/profile/[handle]`, or feed contexts.

---

### Immediate Cleanup Steps

* Rename `Profile` model in Prisma to `MyProfile` to stop confusion
* Refactor all references from `user.profile` to `user.myProfile`
* Prevent MyProfile from being created automatically during sign-up
* Ensure MyCliqs page checks `user.myProfile` before rendering
* Reinstate Account dropdown using initials in header if removed

---

### Planned Controls in Parents HQ

Under the child settings panel (in `ChildSettings` model):

* `canCreatePublicCliqs`: boolean
* `canSendInvites`: boolean
* `inviteRequiresApproval`: boolean
* `isSilentlyMonitored`: boolean
* `canJoinPublicCliqs`: boolean — **"Allow Suzy to join age-appropriate public groups on Cliqstr?"**
* `canJoinPrivateCliqs`: boolean — **"Require approval before joining private or semi-private groups?"**

These toggles must be enforced both in the UI and backend, using APA-safe session checks.

---

This document must be treated as the single source of truth for maintaining separation of APA logic (Account) and social features (MyProfile). Breaking this model separation leads to session errors, invite logic bugs, profile overwrite loops, and unsafe child onboarding.

All future flows — including Pip, onboarding, account dashboard, and public profile display — must adhere to this model separation.

Make sure any Prisma schema or related database query uses the renamed `MyProfile` model explicitly, and updates all relational mappings accordingly.

//UPDATED CODE DUE TO MIGRATION FROM PRISMA TO CONVEX. FUNDEMENTAL GOALS REMAIN THE SAME. 09-17-25

## Enforcement Checklist for Cursor & Future Developers

🔐 **Golden Rule:** Do NOT re-unify Account + MyProfile models or touch auth/session 
   logic while adding Sentinel or new features.

✅ Before committing any auth/profile code:
   - Verify Account has NO username/image/bio fields
   - Verify MyProfile has NO email/role/plan fields
   - Check getCurrentUser returns both account & myProfile
   - Confirm header avatar uses account initials ONLY
   - Run: `grep -r "account.*username" convex/` (should return 0 results)
   - Run: `grep -r "myProfile.*email" convex/` (should return 0 results)

**Last Updated:** 10/31/25 — Sentinel architecture complete, Account/MyProfile separation verified by Cursor audit ✅ 
   