# Complete Authentication Flows - Cliqstr

This document outlines all authentication flows in the Cliqstr platform, including signup, invites, and parent approval processes.

## Table of Contents

1. [Adult Sign Up](#adult-sign-up)
2. [Child Sign Up](#child-sign-up)
3. [Adult Invited Flows](#adult-invited-flows)
   - [New Adult](#new-adult-invited)
   - [Existing Adult](#existing-adult-invited)
   - [Existing Parent](#existing-parent-invited)
4. [Invite Adult Flows](#invite-adult-flows)
   - [New Adult](#invite-new-adult)
   - [Existing Adult](#invite-existing-adult)
   - [Existing Parent](#invite-existing-parent)
5. [Invite Child Flows](#invite-child-flows)
   - [New Parent](#invite-child-new-parent)
   - [Existing Parent](#invite-child-existing-parent)
   - [Existing Adult](#invite-child-existing-adult)

---

## Adult Sign Up

### Flow Overview
Direct adult signup through the main signup page.

### Steps
1. **User goes to** `/sign-up`
2. **Fills form**: First Name, Last Name, Birthdate
3. **System detects** age ≥ 18
4. **User selects** "Adult" role
5. **Fills credentials**: Email, Password
6. **API Call**: `POST /api/sign-up`
7. **Creates**: User account with role="Adult"
8. **Sends**: Verification email
9. **Redirects to**: `/verification-pending`
10. **User clicks** verification email
11. **Account verified** → can access platform

### Data Created
- `users` table: email, password, isVerified=true
- `accounts` table: userId, birthdate, role="Adult", isApproved=true, plan=null
- `myProfiles` table: username, firstName, lastName, birthdate, userId

---

## Child Sign Up

### Flow Overview
Child initiates signup, parent approval required.

### Steps
1. **Child goes to** `/sign-up`
2. **Fills form**: First Name, Last Name, Birthdate
3. **System detects** age < 18
4. **Child prompted** for parent email
5. **API Call**: `POST /api/parent-approval/request`
6. **Creates**: Parent approval record in `pendingChildSignups`
7. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
8. **Child redirected** to `/awaiting-approval`

### Parent Approval Process
9. **Parent receives** email with approval link
10. **Parent clicks** link → `/invite/accept?code={approvalToken}`
11. **System checks** parent state:
    - **New parent**: Signup → Plan Selection → Parents HQ
    - **Existing parent**: Direct to Parents HQ
12. **Parent creates** child account in Parents HQ
13. **Child can sign in** with credentials

### Data Created
- `pendingChildSignups` table: child info, parent email, approval token
- Parent account (if new)
- Child account and profile (after parent approval)

---

## Adult Invited Flows

### New Adult Invited

#### Flow Overview
New adult receives invite, creates account, joins cliq.

#### Steps
1. **Adult receives** invite email
2. **Clicks link** → `/invite/accept?code={inviteToken}`
3. **System validates** invite token
4. **Redirects to** `/choose-plan`
5. **Selects plan** (currently "Test Plan")
6. **API Call**: `POST /api/user/plan`
7. **Redirects to** `/my-cliqs-dashboard`
8. **Auto-joined** to invited cliq

#### Data Created
- User account with role="Adult"
- Account with selected plan
- Membership in invited cliq

### Existing Adult Invited

#### Flow Overview
Existing adult receives invite, joins cliq directly.

#### Steps
1. **Adult receives** invite email
2. **Clicks link** → `/invite/accept?code={inviteToken}`
3. **System validates** invite token
4. **Checks existing** account
5. **Redirects to** `/my-cliqs-dashboard`
6. **Auto-joined** to invited cliq

#### Data Created
- Membership in invited cliq (account already exists)

### Existing Parent Invited

#### Flow Overview
Existing parent receives invite, joins cliq directly.

#### Steps
1. **Parent receives** invite email
2. **Clicks link** → `/invite/accept?code={inviteToken}`
3. **System validates** invite token
4. **Checks existing** parent account
5. **Redirects to** `/my-cliqs-dashboard`
6. **Auto-joined** to invited cliq

#### Data Created
- Membership in invited cliq (account already exists)

---

## Invite Adult Flows

### Invite New Adult

#### Flow Overview
Adult creates invite for new adult user.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Adult (18+)"
3. **Fills form**: Adult email, optional message
4. **API Call**: `POST /api/invites/create`
5. **Creates**: Invite record in `invites` table
6. **Sends email** via `sendInviteEmail`
7. **Redirects to** `/invite/sent`

#### Invitee Experience
8. **Invitee receives** email
9. **Clicks link** → follows "New Adult Invited" flow above

### Invite Existing Adult

#### Flow Overview
Adult creates invite for existing adult user.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Adult (18+)"
3. **Fills form**: Adult email, optional message
4. **API Call**: `POST /api/invites/create`
5. **System detects** existing adult account
6. **Creates**: Invite record
7. **Sends email** via `sendInviteEmail`
8. **Redirects to** `/invite/sent`

#### Invitee Experience
9. **Invitee receives** email
10. **Clicks link** → follows "Existing Adult Invited" flow above

### Invite Existing Parent

#### Flow Overview
Adult creates invite for existing parent user.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Adult (18+)"
3. **Fills form**: Parent email, optional message
4. **API Call**: `POST /api/invites/create`
5. **System detects** existing parent account
6. **Creates**: Invite record
7. **Sends email** via `sendInviteEmail`
8. **Redirects to** `/invite/sent`

#### Invitee Experience
9. **Parent receives** email
10. **Clicks link** → follows "Existing Parent Invited" flow above

---

## Invite Child Flows

### Invite Child - New Parent

#### Flow Overview
Adult creates child invite, new parent creates account and approves child.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Child (Under 18)"
3. **Fills form**: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/parent-approval/request`
5. **Creates**: Parent approval record with context="direct_signup"
6. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
7. **Redirects to** `/awaiting-approval`

#### Parent Experience
8. **Parent receives** email with approval link
9. **Clicks link** → `/invite/accept?code={approvalToken}`
10. **System detects** new parent (parentState="new")
11. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
12. **Parent fills** signup form
13. **API Call**: `POST /api/parent-approval/signup`
14. **Creates**: Parent account with role="Parent"
15. **Redirects to** `/choose-plan?approvalToken={token}`
16. **Parent selects** plan
17. **API Call**: `POST /api/parent-approval/plan`
18. **Redirects to** `/parents/hq/dashboard?approvalToken={token}`
19. **Parent creates** child account and sets permissions
20. **Child can sign in** and access invited cliq

### Invite Child - Existing Parent

#### Flow Overview
Adult creates child invite, existing parent approves child directly.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Child (Under 18)"
3. **Fills form**: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/parent-approval/request`
5. **System detects** existing parent account
6. **Creates**: Parent approval record with parentState="existing_parent"
7. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
8. **Redirects to** `/awaiting-approval`

#### Parent Experience
9. **Parent receives** email with approval link
10. **Clicks link** → `/invite/accept?code={approvalToken}`
11. **System detects** existing parent (parentState="existing_parent")
12. **Redirects to** `/parents/hq/dashboard?approvalToken={token}`
13. **Parent creates** child account and sets permissions
14. **Child can sign in** and access invited cliq

### Invite Child - Existing Adult

#### Flow Overview
Adult creates child invite, existing adult upgrades to parent and approves child.

#### Steps
1. **Adult goes to** cliq invite page
2. **Selects** "Child (Under 18)"
3. **Fills form**: Child First Name, Last Name, Birthdate, Parent Email
4. **API Call**: `POST /api/parent-approval/request`
5. **System detects** existing adult account
6. **Creates**: Parent approval record with parentState="existing_adult"
7. **Sends email** to parent via `sendUnifiedParentApprovalEmail`
8. **Redirects to** `/awaiting-approval`

#### Parent Experience
9. **Adult receives** email with approval link
10. **Clicks link** → `/invite/accept?code={approvalToken}`
11. **System detects** existing adult (parentState="existing_adult")
12. **Redirects to** `/sign-up?email={parentEmail}&approvalToken={token}`
13. **Adult fills** signup form (upgrades to parent)
14. **API Call**: `POST /api/parent-approval/signup`
15. **Updates**: Account role from "Adult" to "Parent"
16. **Redirects to** `/choose-plan?approvalToken={token}`
17. **Parent selects** plan (if needed)
18. **Redirects to** `/parents/hq/dashboard?approvalToken={token}`
19. **Parent creates** child account and sets permissions
20. **Child can sign in** and access invited cliq

---

## Key API Endpoints

### Authentication
- `POST /api/sign-up` - Create new user account
- `POST /api/sign-in` - User login
- `GET /api/auth/status` - Check current session

### Invites
- `POST /api/invites/create` - Create new invite
- `GET /api/invites/validate` - Validate invite token

### Parent Approval
- `POST /api/parent-approval/request` - Request parent approval
- `GET /api/parent-approval/accept` - Check approval token
- `POST /api/parent-approval/accept` - Approve/decline child
- `POST /api/parent-approval/signup` - Create parent account
- `POST /api/parent-approval/plan` - Select plan for parent

### Child Management
- `POST /api/parent/children` - Create child account
- `GET /api/parent/children` - Get parent's children

---

## Data Tables

### Core Tables
- `users` - User accounts and authentication
- `accounts` - User account details (role, plan, approval status)
- `myProfiles` - User social profiles

### Invite Tables
- `invites` - Invite records for adults
- `pendingChildSignups` - Parent approval records for children

### Relationship Tables
- `memberships` - User memberships in cliqs
- `cliqs` - Cliq information

---

## Email Templates

### Adult Invites
- `sendInviteEmail` - Standard adult invite email

### Child Invites
- `sendUnifiedParentApprovalEmail` - Parent approval email for children
- Context: "direct_signup" or "child_invite"

---

## Security Features

### Child Safety
- All child accounts require parent approval
- Parent controls child permissions
- Red Alert system for safety monitoring
- Age verification through birthdate

### Account Security
- Email verification for new accounts
- Session management with timeout
- Role-based access control
- Suspended account handling

---

*Last Updated: January 15, 2025*
*Version: 1.0*
