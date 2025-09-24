 Cliqstr Testing Matrix

This file lists core scenarios for automated and manual testing. Each row defines the setup, action, and expected result.

---

## Sign Up Flows

| Scenario | Setup | Action | Expected Result |
|----------|-------|--------|-----------------|
| Adult sign-up | New user ≥ 18 years | Fill sign-up form | Adult account created, verified via email |
| Child sign-up → New Parent | Child < 18, new parent email | Fill sign-up form | Parent approval email sent → parent must sign up, choose plan, create child |
| Child sign-up → Existing Parent | Child < 18, parent email already registered | Fill sign-up form | Parent notified, approves in Parent HQ, child created |
| Child sign-up → Existing Adult | Child < 18, adult email already registered | Fill sign-up form | Adult upgrades to parent, selects plan, creates child |

---

## Invite Flows

| Scenario | Setup | Action | Expected Result |
|----------|-------|--------|-----------------|
| Adult invites Adult | Adult user logged in | Fill invite form with adult email | Invite email sent, new adult chooses plan or existing joins cliq |
| Adult invites Child → New Parent | Adult user logged in | Fill invite form with child name + new parent email | Parent approval email sent, parent signs up, selects plan, creates child |
| Adult invites Child → Existing Parent | Adult user logged in, parent already exists | Invite child with existing parent email | Parent notified, approves in Parent HQ, child created |
| Adult invites Child → Existing Adult | Adult user logged in, adult already exists | Invite child with adult email | Adult upgrades to parent, selects plan, creates child |
| Child invites Child → New Parent | Inviter child `canInviteChildren=true` | Invite form with child name + new parent email | Parent approval email sent, parent signs up, child joins |
| Child invites Child → Existing Parent | Inviter child `canInviteChildren=true`, parent already exists | Invite child with existing parent email | Parent notified, approves in Parent HQ, child joins |
| Child invites Child → Existing Adult | Inviter child `canInviteChildren=true`, adult already exists | Invite child with adult email | Adult upgrades to parent, child joins |
| Child invites Child → Direct child email | Inviter child `canInviteChildren=true` | Enter another child’s email directly | ❌ Should block and redirect to parent approval (never email the child directly) |

---

## Other

| Scenario | Setup | Action | Expected Result |
|----------|-------|--------|-----------------|
| Password reset via magic link | Any user | Click “Forgot Password” → request link | Magic link email sent, login works |
| Password reset via traditional reset | Any user | Attempt reset via modal | ❌ Should be disabled (only magic link allowed) |
| Quota full during invite | Plan quota reached | Attempt to invite new member | Invite blocked, child sees “Request Upgrade,” parent notified via email + in-app |

---

**Note:** Cursor should use this matrix alongside `CURRENT-AUTH-FLOWS-DOCUMENTATION.md` to implement automated Playwright tests. Manual testers can also walk these scenarios to validate behavior.

