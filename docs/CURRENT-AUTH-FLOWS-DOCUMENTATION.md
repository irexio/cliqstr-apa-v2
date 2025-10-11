# Current Authentication Flows Documentation - Cliqstr

**Date**: December 2024  
**Status**: Complete analysis of current implementation

## Table of Contents

1. [Sign Up Flows](#sign-up-flows)
2. [Invite Flows](#invite-flows)
3. [Child Email Account Treatment](#child-email-account-treatment)
4. [Password Reset Options](#password-reset-options)
5. [Parent HQ Checks & Permissions](#parent-hq-checks--permissions)
6. [Plan/Quota Checks](#planquota-checks)

---

## Sign Up Flows

### 1. Sign Up Adult

**Entry Point**: `/sign-up` → `SignUpForm` component  
**API Endpoint**: `POST /api/sign-up`

**Steps**:
1. User fills: First Name, Last Name, Birthdate
2. System detects age ≥ 18
3. User selects "Adult" role
4. User fills: Email, Password
5. **API Call**: `POST /api/sign-up`
6. **Creates**:
   - `users` table: email, password, isVerified=false
   - `accounts` table: userId, birthdate, role="Adult", isApproved=true, plan=null
   - `myProfiles` table: username, firstName, lastName, birthdate, userId
7. **Sends**: Verification email
8. **Redirects to**: `/verification-pending`
9. User clicks verification email
10. **Account verified** → can access platform

**Plan Check**: No plan required for adults (plan=null)  //temp plan until Stripe is set up.
---

### 2. Sign Up Child → New Parent

**Entry Point**: `/sign-up` → `SignUpForm` component  
**API Endpoint**: `POST /api/parent-approval/request`

**Steps**:
1. Child fills: First Name, Last Name, Birthdate
2. System detects age < 18
3. Child prompted for parent email
4. **API Call**: `POST /api/parent-approval/request`
5. **Creates**: Parent approval record in `parentApprovals` table
6. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
7. **Child redirected** to `/awaiting-approval`

**Parent Approval Process**:
8. Parent receives email with approval link
9. Parent clicks link → `/parent-approval?approvalToken={token}`
10. **System detects** new parent (parentState="new")
11. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
12. Parent fills signup form
13. **API Call**: `POST /api/parent-approval/signup`
14. **Creates**: Parent account with role="Parent"
15. **Redirects to** `/choose-plan?approvalToken={token}`
16. Parent selects plan
17. **API Call**: `POST /api/parent-approval/plan`
18. **Redirects to** `/parents/hq?approvalToken={token}`
19. Parent creates child account and sets permissions
20. **Child can sign in** with credentials

**Plan Check**: Parent must select plan before creating child account

---

### 3. Sign Up Child → Existing Parent

**Entry Point**: `/sign-up` → `SignUpForm` component  
**API Endpoint**: `POST /api/parent-approval/request`

**Steps**:
1. Child fills: First Name, Last Name, Birthdate
2. System detects age < 18
3. Child prompted for parent email
4. **API Call**: `POST /api/parent-approval/request`
5. **System detects** existing parent account
6. **Creates**: Parent approval record with parentState="existing_parent"
7. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
8. **Child redirected** to `/awaiting-approval`

**Parent Approval Process**:
9. Parent receives email with approval link
10. Parent clicks link → `/parent-approval?approvalToken={token}`
11. **System detects** existing parent (parentState="existing_parent")
12. **Redirects to** `/parents/hq?approvalToken={token}`
13. Parent creates child account and sets permissions
14. **Child can sign in** with credentials

**Plan Check**: Existing parent already has plan - MUST CHECK IF PLAN SUPPORTS NEW CHILD

---

### 4. Sign Up Child → Existing Adult

**Entry Point**: `/sign-up` → `SignUpForm` component  
**API Endpoint**: `POST /api/parent-approval/request`

**Steps**:
1. Child fills: First Name, Last Name, Birthdate
2. System detects age < 18
3. Child prompted for parent email
4. **API Call**: `POST /api/parent-approval/request`
5. **System detects** existing adult account
6. **Creates**: Parent approval record with parentState="existing_adult"
7. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
8. **Child redirected** to `/awaiting-approval`

**Parent Approval Process**:
9. Adult receives email with approval link
10. Parent clicks link → `/parent-approval?approvalToken={token}`
11. **System detects** existing adult (parentState="existing_adult")
12. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
13. Adult fills signup form (upgrades to parent) 
14. **API Call**: `POST /api/parent-approval/signup`
15. **Updates**: Account role from "Adult" to "Parent"
16. **Redirects to** `/choose-plan?approvalToken={token}`
17. Parent selects plan (if needed)
18. **Redirects to** `/parents/hq?approvalToken={token}`
19. Parent creates child account and sets permissions
20. **Child can sign in** with credentials

**Plan Check**: Adult must select plan before creating child account

---

## Invite Flows

### 5. Adult Invites Adult

**Entry Point**: Cliq invite page → `InviteClient` component  - invite button on cliqcard or cliq header.
**API Endpoint**: `POST /api/invites/create`

**Steps**:
1. Adult goes to cliq invite 
2. Selects "Adult (18+)"
3. Fills form: Adult email, optional message
4. **API Call**: `POST /api/invites/create`
5. **Creates**: Invite record in `invites` table
6. **Sends email** via `sendInviteEmail`
7. **Redirects to** `/invite/sent`

**Invitee Experience**:
8. Invitee receives email
9. Clicks link → `/invite/accept?code={inviteToken}`
10. **System validates** invite token
11. **Redirects to** `/choose-plan` (if new) or `/my-cliqs-dashboard` (if existing)
12. **Auto-joined** to invited cliq

**Plan Check**: New adults must select plan

---

### 6. Adult Invites Child → New Parent

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Steps**:
1. Adult goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **Creates**: Parent approval record with context="child_invite"
6. **Sends email** to parent via `sendChildInviteEmail`
7. **Redirects to** `/invite/sent`

**Parent Experience**:
8. Parent receives email with approval link
9. Clicks link → `/parent-approval?approvalToken={token}`
10. **System detects** new parent (parentState="new")
11. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
12. Parent fills signup form
13. **API Call**: `POST /api/parent-approval/signup`
14. **Creates**: Parent account with role="Parent"
15. **Redirects to** `/choose-plan?approvalToken={token}`
16. Parent selects plan
17. **API Call**: `POST /api/parent-approval/plan`
18. **Redirects to** `/parents/hq?approvalToken={token}`
19. Parent creates child account and sets permissions
20. **Child can sign in** and access invited cliq

**Plan Check**: Parent must select plan before creating child account

---

### 7. Adult Invites Child → Existing Parent

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Steps**:
1. Adult goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **System detects** existing parent account
6. **Creates**: Parent approval record with parentState="existing_parent"
7. **Sends email** to parent via `sendChildInviteEmail`
8. **Redirects to** `/invite/sent`

**Parent Experience**:
9. Parent receives email with approval link
10. Clicks link → `/parent-approval?approvalToken={token}`
11. **System detects** existing parent (parentState="existing_parent")
12. **Redirects to** `/parents/hq?approvalToken={token}`
13. Parent creates child account and sets permissions
14. **Child can sign in** and access invited cliq

**Plan Check**: Existing parent already has plan

---

### 8. Adult Invites Child → Existing Adult

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Steps**:
1. Adult goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **System detects** existing adult account
6. **Creates**: Parent approval record with parentState="existing_adult"
7. **Sends email** to parent via `sendChildInviteEmail`
8. **Redirects to** `/invite/sent`

**Parent Experience**:
9. Adult receives email with approval link
10. Clicks link → `/parent-approval?approvalToken={token}`
11. **System detects** existing adult (parentState="existing_adult")
12. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
13. Adult fills signup form (upgrades to parent)
14. **API Call**: `POST /api/parent-approval/signup`
15. **Updates**: Account role from "Adult" to "Parent"
16. **Redirects to** `/choose-plan?approvalToken={token}`
17. Parent selects plan (if needed)
18. **Redirects to** `/parents/hq?approvalToken={token}`
19. Parent creates child account and sets permissions
20. **Child can sign in** and access invited cliq

**Plan Check**: Adult must select plan before creating child account

---

### 9. Child Invites Child → New Parent

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Permission Check**: Child must have `canInviteChildren: true` in their settings

**Steps**:
1. Child goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **System checks** child's `canInviteChildren` permission
6. **Creates**: Parent approval record with context="child_invite"
7. **Sends email** to parent via `sendChildInviteEmail`
8. **Redirects to** `/invite/sent`

**Parent Experience**: Same as Adult Invites Child → New Parent

**Plan Check**: Parent must select plan before creating child account

---

### 10. Child Invites Child → Existing Parent

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Permission Check**: Child must have `canInviteChildren: true` in their settings

**Steps**:
1. Child goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **System checks** child's `canInviteChildren` permission
6. **System detects** existing parent account
7. **Creates**: Parent approval record with parentState="existing_parent"
8. **Sends email** to parent via `sendChildInviteEmail`
9. **Redirects to** `/invite/sent`

**Parent Experience**: Same as Adult Invites Child → Existing Parent

**Plan Check**: Existing parent already has plan

---

### 11. Child Invites Child → Existing Adult

**Entry Point**: Cliq invite page → `InviteClient` component  
**API Endpoint**: `POST /api/invites/create`

**Permission Check**: Child must have `canInviteChildren: true` in their settings

**Steps**:
1. Child goes to cliq invite page
2. Selects "Child (Under 18)"
3. Fills form: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/invites/create` with `inviteType: 'child'`
5. **System checks** child's `canInviteChildren` permission
6. **System detects** existing adult account
7. **Creates**: Parent approval record with parentState="existing_adult"
8. **Sends email** to parent via `sendChildInviteEmail`
9. **Redirects to** `/invite/sent`

**Parent Experience**: Same as Adult Invites Child → Existing Adult

**Plan Check**: Adult must select plan before creating child account

---

### 12. Child Invites Child → Direct Child Email

**Current Status**: ❌ **NOT IMPLEMENTED**

**What happens**: If a child tries to invite another child using the child's email directly, the system would:
1. Detect the email doesn't exist in the system
2. Create a parent approval record
3. Send email to the child's email address
4. **Problem**: Child receives parent approval email meant for parents

**This flow is broken and needs to be addressed.**

---

## Child Email Account Treatment

### Current Implementation

**Child Email Collection**:
- **Parent HQ Form**: Collects `childEmail` field during child account creation
- **Real Email Address**: Children get real email addresses (not `@temp.cliqstr.local`)
- **Magic Link Support**: Child emails are used for magic link authentication

**Magic Link Age-Based Routing**:
- **Under 13**: Magic link sent to **parent's email** with message "Your child [FirstName] forgot their password"
- **13+**: Magic link sent to **child's email** directly
- **Cross-Device Support**: Parent can forward magic link to child on different device

**Child Account Creation**:
```typescript
// In /api/parent/children/route.ts
const childUserId = await convexHttp.mutation(api.users.createUserWithAccount, {
  email: childEmail, // Use real child email for magic links
  password: password,
  birthdate: birthdate,
  role: 'Child',
  isApproved: true, // Parent is approving
  plan: 'test', // Default to test plan
  isVerified: true, // Parent approval counts as verification
});
```

---

## Password Reset Options

### Current Implementation

**Two Options Available**:
1. **Traditional Password Reset** (Modal + Email)
   - Entry: "Forgot Password" modal on sign-in page
   - API: `POST /api/send-reset-email`
   - Process: Email with reset link → `/reset-password?code={token}`
   - **Status**: ✅ Available

2. **Magic Link Authentication** (New)
   - Entry: "🪄 Sign in with Magic Link (No Password)" button on sign-in page
   - API: `POST /api/auth/magic/request`
   - Process: Email with magic link → `/auth/magic/verify?token={token}&email={email}`
   - **Status**: ✅ Available

**User Request**: Remove traditional password reset, keep only magic links

---

## Parent HQ Checks & Permissions

### Parent HQ Access Control

**Routes Protected**: `/parents/hq*`
**Middleware**: Allows access if `approvalToken` is present
**Authentication**: Uses `enforceAPA` function

**Permission Checks**:
- **Role Check**: User must have `role: 'Parent'` or `role: 'Admin'`
- **Session Check**: Valid authenticated session required
- **Approval Token**: Special access for parent approval flows

### Child Permission System

**Default Safety Settings** (Restrictive):
```typescript
{
  canPost: true,
  canComment: true,
  canReact: true,
  canViewProfiles: true,
  canReceiveInvites: true,
  canCreatePublicCliqs: false,
  canInviteChildren: false,
  canInviteAdults: false,
  canCreateCliqs: false,
  canUploadVideos: false,
  invitesRequireParentApproval: true,
  isSilentlyMonitored: true,
  aiModerationLevel: 'strict',
  canAccessGames: true,
  canShareYouTube: false,
  visibilityLevel: 'private'
}
```

**Parent HQ Form Fields**:
- Username, Password, Confirm Password
- **Child Email** (required for magic links)
- Red Alert acceptance
- Silent monitoring toggle
- Second parent email (optional)
- All permission toggles

---

## Plan/Quota Checks

### Plan Requirements

**Adults**: 
- **New Adults**: Must select plan before accessing platform
- **Existing Adults**: Already have plan
- **Plan Selection**: `/choose-plan` page with "Test Plan" option

**Parents**:
- **New Parents**: Must select plan before creating child account
- **Existing Parents**: Already have plan
- **Plan Selection**: Required in parent approval flows

**Children**:
- **Default Plan**: `plan: 'test'` assigned automatically
- **No Plan Selection**: Children don't select plans directly

### Quota/Plan Checks

**Current Implementation**:
- **Plan Field**: Stored in `accounts.plan`
- **Default Plans**: `'test'` for children, `null` for adults (must select)
- **Plan Selection**: Required for new adults and parents
- **No Quota Limits**: Currently no usage limits enforced

---

## Key API Endpoints

### Authentication
- `POST /api/sign-up` - Create new user account
- `POST /api/sign-in` - User login
- `GET /api/auth/status` - Check current session
- `POST /api/auth/magic/request` - Request magic link
- `POST /api/auth/magic/verify` - Verify magic link

### Invites
- `POST /api/invites/create` - Create new invite
- `GET /api/invites/validate` - Validate invite token

### Parent Approval
- `POST /api/parent-approval/request` - Request parent approval
- `GET /api/parent-approval/accept` - Check approval token
- `POST /api/parent-approval/signup` - Create parent account
- `POST /api/parent-approval/plan` - Select plan
- `POST /api/parent/children` - Create child account

### Password Reset
- `POST /api/send-reset-email` - Send password reset email
- `POST /api/reset-password` - Reset password with token

---

## Issues Identified

### 1. Child Invites Child → Direct Child Email
**Problem**: If child invites another child using child's email directly, the system sends parent approval email to the child.
**Status**: ❌ Broken flow

### 2. Password Reset Options
**Current**: Both traditional reset and magic links available
**Request**: Remove traditional reset, keep only magic links
**Status**: ⚠️ Needs implementation

### 3. InMotion Email Delivery
**Problem**: InMotion hosting blocks certain email types (magic links, password resets)
**Status**: ⚠️ External issue, affects testing

---

## Recommendations

### 1. Fix Child-to-Child Direct Invites
- Add validation to prevent children from inviting other children directly
- Redirect to parent email collection if child email is provided

### 2. Remove Traditional Password Reset
- Remove "Forgot Password" modal from sign-in page
- Keep only magic link option
- Update all password reset references

### 3. Email Delivery
- Consider switching email providers or domains
- Use Gmail addresses for testing to avoid InMotion issues

### 4. Documentation
- Update user-facing documentation to reflect magic link-only password reset
- Add clear instructions for parent forwarding of magic links
