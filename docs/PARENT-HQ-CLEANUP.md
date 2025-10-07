# 🧩 TASK: Parent HQ Cleanup & Deprecation Pass

## 🎯 Objective
Remove or archive legacy Parent HQ and parent-approval files that are now obsolete after the unified `/parents/hq` implementation.  
This will simplify routing, prevent regressions, and eliminate duplicate logic.

---

## 🧠 Step-by-Step Plan

### 1️⃣ Confirm No Active Imports (Safety Check)
Run these searches first to ensure nothing is still importing the old components:

```bash
grep -R "ParentsHQWizard" src/
grep -R "ParentsHQWithSignup" src/
grep -R "ParentsHQContent" src/
grep -R "ChildInviteApprovalFlow" src/
grep -R "parent-approval/complete" src/
```

If no import or route references are found, proceed with cleanup.

---

### 2️⃣ Remove / Archive Deprecated Files

| File Path | Action |
|------------|---------|
| `src/components/parents/ParentsHQWizard.tsx` | **Delete** – replaced by unified `/parents/hq` context-based setup. |
| `src/components/parents/ParentsHQWithSignup.tsx` | **Delete** – legacy pre-session version. |
| `src/app/parents/hq/dashboard/page.tsx` | **Delete** – all dashboard logic now in `/parents/hq/page.tsx`. |
| `src/app/parent-approval/page.tsx` | **Delete** – superseded by unified flow. |
| `src/app/api/auth/upgrade-to-parent/route.ts` | **Delete** – handled by `/api/parent-approval/signup`. |
| `docs/PARENTS-HQ-WIZARD.md` | **Delete or move to `/docs/archive/`** – describes obsolete multi-step wizard. |

---

### 3️⃣ Files to Audit, Then Remove (after grep confirms unused)

| File Path | Action |
|------------|---------|
| `src/components/parents/ParentsHQContent.tsx` | **Audit then delete** – merge any useful logic into `ParentDashboard` if still imported. |
| `src/components/parents/ChildInviteApprovalFlow.tsx` | **Audit then delete** – keep only `ChildSignupApprovalFlow.tsx`. |
| `src/app/api/parent-approval/complete/route.ts` | **Audit then delete** – confirm logic merged into `/api/parent/children`. |
| `docs/PARENTS-HQ-DOCUMENTATION.md` | **Keep & Update** – still valuable, but revise to describe unified flow. |

---

### 4️⃣ Keep These Files (Active & Required)

- `src/app/parents/hq/page.tsx` – unified entry point  
- `src/components/parents/ParentDashboard.tsx` – main dashboard  
- `src/components/parents/ChildSignupApprovalFlow.tsx` – setup mode component  
- `src/components/parents/PendingApprovalsSection.tsx`  
- `src/components/parents/ChildPermissionManager.tsx`  
- `src/app/api/parent-approval/signup/route.ts`  
- `src/app/api/parent-approval/plan/route.ts`  
- `src/app/api/parent/children/route.ts`  
- `src/app/parent-approval/smart/page.tsx` (simplified redirect only)

---

### 5️⃣ Optional: Archive Safely Instead of Hard Delete
If you prefer to keep copies for reference, move them into a new folder:

```
/src/deprecated/parents-hq/
├── ParentsHQWizard.tsx
├── ParentsHQWithSignup.tsx
├── ParentsHQContent.tsx
├── parent-approval/
│   ├── page.tsx
│   ├── complete.ts
```

Add this header to each:
```tsx
/**
 * @deprecated
 * Replaced by unified ParentDashboard (/parents/hq)
 * Safe to delete after confirmation testing.
 */
```

---

## ✅ Acceptance Criteria
- All obsolete Parent HQ and approval files removed or archived.  
- Grep confirms no active imports before deletion.  
- `/parents/hq` remains the **only** functional entry point for parents.  
- Smart Router still redirects correctly to `/parents/hq?approvalToken=`.  
- Codebase builds cleanly (`npm run build` passes with no missing import errors).

---

## 🧪 Post-Cleanup Test Checklist
1. Run `npm run build` — no import or module errors.  
2. Test:
   - New invite → `/parents/hq?approvalToken=xyz` loads setup mode.  
   - Direct login → `/parents/hq` loads manage mode.  
   - Header “Parent HQ” link works.  
   - Smart router redirects properly.  
3. Confirm all removed files no longer exist and no code references them.  
4. Commit with message:  
   ```
   chore: remove deprecated Parent HQ and approval components
   ```

---


---

## 🧩 Simplified Copyable Section (for Cursor Copy/Paste)

### 2️⃣ Remove / Archive Deprecated Files (Plain List)

- **src/components/parents/ParentsHQWizard.tsx** → Delete – replaced by unified /parents/hq context-based setup.
- **src/components/parents/ParentsHQWithSignup.tsx** → Delete – legacy pre-session version.
- **src/app/parents/hq/dashboard/page.tsx** → Delete – all dashboard logic now in /parents/hq/page.tsx.
- **src/app/parent-approval/page.tsx** → Delete – superseded by unified flow.
- **src/app/api/auth/upgrade-to-parent/route.ts** → Delete – handled by /api/parent-approval/signup.
- **docs/PARENTS-HQ-WIZARD.md** → Delete or move to /docs/archive/ – describes obsolete multi-step wizard.

These lines can be safely copied directly into Cursor without breaking formatting.

Aiden Assisted Clean up 10/7/25 rpt