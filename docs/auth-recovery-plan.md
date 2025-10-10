# Auth Recovery & Next Steps Plan

## 1. Immediate Priorities (Fix Broken Child Approval Flows)

1. **Ship real data from `/api/parent-approval/check`**  
   * Replace the placeholder response with a call to the Convex `pendingChildSignups.getApprovalByToken` query.  
   * Return `{ approval: { ... } }` in the exact shape Smart Router + Parents HQ expects (`status`, `child`, `parent`, `context`, `accountState`).  
   * Handle 404 vs. 410 cases (missing vs. expired) to keep UX clear.

2. **Smoke-test every approval path on Vercel (prod Convex)**  
   * New parent approval via child signup.  
   * Existing parent logging in from invite.  
   * Existing adult converting to parent.  
   * Log each request/response in Vercel + Convex dashboard so we can inspect live data quickly.

3. **Verify follow-on routes** (`/api/parent-approval/accept`, `/api/parent-approval/signup`, `/api/parent-approval/plan`) still match the Convex mutations after the migration.  
   * Pay special attention to how `parentLinks` and `accounts` are written.  
   * Re-run migrations if schema drifted after the switch to Convex.

4. **Capture production evidence**  
   * For each flow, screenshot the Convex data explorer showing the new/updated rows.  
   * Document timestamps + tokens so we can trace problems later.

## 2. Stabilize the Environment

1. **Spin up a real `dev` Convex deployment**  
   * Clone the production deployment so tests are safe.  
   * Point a Vercel preview branch at `dev` and keep `main` on `prod`.  
   * Add environment readme describing which branch uses which deployment.

2. **Add reproducible seed scripts**  
   * Use existing `create-admin.js` / `check-convex-data.js` patterns to produce known-good test accounts.  
   * Automate creating one parent + child + approval token for QA checks.

3. **Automate regression checks**  
   * Write Playwright smoke tests that hit the Smart Router endpoints and assert the approval flow renders (stub email step by grabbing token from Convex).  
   * Run them against Vercel preview + production before merges.

## 3. Process Changes Before New Features

1. **Lock `main`** until child approval flow has passing smoke tests.  
   * Use short-lived feature branches for fixes; merge only after live verification.  
   * Require a checklist (routes verified, Convex tables confirmed) on every auth-related PR.

2. **Document the Smart Router contract**  
   * Write a short doc describing the JSON shapes expected from each `/api/parent-approval/*` endpoint.  
   * Helps keep frontend + backend in sync as we refactor.

3. **Centralize logging + observability**  
   * Stream Next.js route logs to a retained service (Vercel, Logtail) so we can debug failed tokens without redeploying.  
   * Add structured logs in Convex functions for token state transitions.

## 4. After Auth Is Stable

1. **Billing / plans**  
   * Once approval flow is verified, wire Stripe Checkout.  
   * Gate parent dashboard access on an active subscription.

2. **Feature roadmap**  
   * Parents HQ enhancements (permissions UI, silent monitoring toggle, audit trail).  
   * Child onboarding UX improvements.  
   * Notifications + parental reminders.

3. **Data safety**  
   * Regular Convex export backups.  
   * Privacy review for stored child data.

## 5. Working Agreement

* All live testing is on Vercel + Convex prod until dev sync is ready.
* Every auth change must include the test evidence + Convex screenshots.
* No new feature branches until child approval flows pass end-to-end.

## Appendix: Auth Provider Scope

* The recovery work keeps the existing email + token approval flow only—no OAuth providers were added or enabled during these fixes.
* Any legacy OAuth dependencies in the repo remain unused stubs from earlier experiments and are **not** part of the current deployment.
