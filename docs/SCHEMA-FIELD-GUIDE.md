# Convex Schema Field Guide

## Purpose
This document clarifies which fields are **source-of-truth** vs. **derived/cached** fields across tables, preventing AI helpers from creating duplicate fields or using outdated sources.

---

## ⚠️ CRITICAL SECURITY: Grooming Prevention Tactics

This schema includes multiple safeguards to prevent adults from impersonating children:

1. **Profile Name Locking:** Child's social profile name is LOCKED to their account name (from parent setup). Adults cannot create fake child accounts with false identities to pose as minors in cliqs.

2. **Location Masking for Events:** When a child creates an activity, location can be hidden until parent approval, preventing location exposure to unknown contacts.

3. **Parent Approval Workflows:** Child-created events and invites require parent approval before visibility, giving parents control over what children share.

4. **Invite Permission Controls:** Parents can disable child's ability to send/receive invites entirely via PHQ settings.

**These are NOT optional features** - they are core to the safety architecture. Any changes to name handling, profile creation, or visibility rules must preserve these protections.

---

## COPPA Compliance & Adult Accountability

**Verified Adult Identity Layer:**
- All adults must provide a real credit card (Stripe) with name verification
- Adult's verified name is stored in `accounts` table and cannot be spoofed
- Profile names are locked to verified account identity, creating accountability
- Children can only be invited/created by verified adults

**Multi-Layer Protection Against Grooming:**
1. Verified Stripe payment method → Real identity accountability (not anonymous)
2. Profile name locking → Adults cannot impersonate children
3. Parent approval workflows → Parents control child visibility
4. Location masking → Location hidden from unapproved contacts
5. Invite controls → Parents can disable invites entirely

**COPPA Compliance:**
✅ Verifiable parental consent (credit card + verified identity)  
✅ Privacy protection (location masking, approval workflows, permission controls)  
✅ Data minimization (PHQ-controlled permissions)  
✅ Accountability (verified adult identity tied to all child accounts)  
✅ **EXCEEDS baseline COPPA:** Prevents adult impersonation of children (not required but critical safety measure)

---

## Community-Based Safety: No Direct Messages

**Architectural Choice:** Cliqstr does NOT implement direct messages (DMs).

**Why:**
- **Private channels enable grooming:** DMs are the primary tool used by predators to isolate children
- **Public visibility = community protection:** All conversations happen in cliq feeds where multiple adults and family members can observe
- **Red Alert crowd-sourcing:** Friends, family, and other cliq members can flag suspicious conversations in real-time
- **No private corners:** There are no hidden spaces where unsafe dialog can happen unobserved

**How It Works:**
1. All member interactions happen in **public cliq feeds** (visible to all cliq members)
2. Posts and comments are **observable by parents and guardians**
3. **Red Alert system** allows any member to flag suspicious content immediately
4. Multiple eyes on conversations = faster detection of grooming behavior

**Schema Implications:**
- `posts` and `replies` tables contain all member interactions (visible, auditable, public)
- No `directMessages`, `privateChats`, or hidden communication tables exist
- All member-to-member communication goes through cliq feeds (not schema-hidden)

**Safety Advantage:**
This is more protective than privacy-focused apps that offer "end-to-end encrypted DMs." Cliqstr trades absolute privacy for **community safety** - a deliberate choice that makes grooming much harder because:
- Predators have no private channel to isolate victims
- Unsafe conversation patterns are visible to protective adults
- The community itself becomes a safety mechanism

---

## Critical Field Mappings

### User Name Information
**Source of Truth:** `accounts` table  
**DO NOT USE:** `users.firstName`, `users.lastName` (removed - temporary fields)

**Where to Get Names:**
- Use `api.accounts.getAccountByUserId(userId)` → returns `account.firstName`, `account.lastName`
- Names are stored in ONE place: the `accounts` table
- Always compose `inviterName` from `accounts.firstName` + `accounts.lastName`

**Example:**
```typescript
const account = await ctx.db.query("accounts").withIndex("by_user_id", q => q.eq("userId", userId)).first();
const fullName = `${account?.firstName || ''} ${account?.lastName || ''}`.trim() || 'Someone';
```

---

### Activity/Event Management

**Historical Note:** 
- Old `events` table was replaced with `activities` table
- `activities` is now the SINGLE SOURCE OF TRUTH for all calendar/event data

**Activities Fields (All stored, no caching):**
- `cliqId` - Which cliq owns this activity
- `title`, `description` - Activity details
- `startAt`, `endAt`, `timezone` - Timing info
- `location`, `locationVisibility` - Location with visibility rules
- `createdByUserId` - Who created it
- `requiresParentApproval` - Parent approval status
- `approvedByParentId`, `approvedAt` - Approval tracking
- `rsvps` - RSVP tracking (object: `{ userId: 'going'|'maybe'|'raincheck' }`)
- `seriesId` - For recurring events (UUID, all instances share same seriesId)

---

### Parent Approval Flow

**Purpose:** Track child signup/invite approvals that require parent validation  
**Lifecycle:** Pending → Approved/Declined

**Key Fields:**
| Field | Type | Purpose | Source |
|-------|------|---------|--------|
| `approvalToken` | string | Unique token for email link | Generated in API route |
| `inviteId` | id\<invites\> | Reference to invite record | Passed from `/api/invites/create` |
| `cliqId` | id\<cliqs\> | Which cliq child is joining | Passed from invite context |
| `inviterName` | string | **WHO** invited the child | Computed from `accounts.firstName` + `accounts.lastName` |
| `cliqName` | string | **WHICH** cliq they're joining | Fetched from cliq record |
| `childFirstName`, `childLastName` | string | Child's name | From form submission |
| `parentEmail` | string | Who needs to approve | From invite payload |

**IMPORTANT:** Both `inviterName` and `cliqName` MUST be populated at creation time (not left as undefined).

---

### Invites Table

**Purpose:** Track all invite requests (both adult and child invites)  
**Note:** Separate from `parentApprovals` (which tracks parent approval for child signups)

**Key Fields:**
| Field | Type | Source | When Set |
|-------|------|--------|----------|
| `inviterId` | id\<users\> | Person sending invite | At creation |
| `inviteeEmail` | string | Email being invited | At creation |
| `targetUserId` | id\<users\> | If invitee already exists | At creation (optional) |
| `invitedUserId` | id\<users\> | After person signs up | Updated when invite accepted |
| `cliqId` | id\<cliqs\> | Which cliq to join | At creation |
| `status` | enum | Pending/accepted/completed | At creation, updated on acceptance |

**NOT DUPLICATES:** `targetUserId` (pre-existing user) vs `invitedUserId` (newly signed up user) serve different purposes.

---

### Child Settings (PHQ Controls)

**Purpose:** Store per-child permissions managed by parents in Parent HQ  
**Location:** One record per child (via `profileId`)

**CRITICAL SECURITY:** Profile name is LOCKED to account name  
- Child's account name (from parent setup) cannot be changed in social profile
- Prevents adults from creating fake child accounts and impersonating minors
- **Grooming prevention tactic:** Adults cannot pose as children in cliqs
- `displayName` is optional for nicknames, but real name always comes from `accounts`
- myProfiles.createProfile validates that names match accounts data

**Calendar-Related Fields:**
```typescript
eventsRequireApproval: boolean;                    // Child events need parent approval
eventLocationVisibilityForChildEvents: 'parents' | 'everyone';  // Default location visibility
maskLocationUntilApproved: boolean;               // Hide location on pending events
```

**Enforcement Points:**
- When child creates activity → apply these settings automatically
- When parent approves activity → location becomes visible per `eventLocationVisibilityForChildEvents`
- Invites also respect these same flags

---

### Computed/Cached Fields (Informational Only)

**These are derived from other tables, DO NOT use as source-of-truth:**

| Table | Field | Source | Purpose |
|-------|-------|--------|---------|
| `myProfiles` | `birthdayMonthDay` | Computed from `accounts.birthdate` | Cache for performance |
| `parentApprovals` | `inviterName` | Computed from `accounts` table | Email display only |
| `parentApprovals` | `cliqName` | Fetched at creation time | Email display only |

---

## Best Practices for AI Helpers

1. **Always check `accounts` table for user names**, never `users` table
2. **Set `inviterName` and `cliqName` at creation time** in `parentApprovals`
3. **Use `activities` table** for all calendar/event data (not old `events`)
4. **Understand `targetUserId` vs `invitedUserId`** - they track different signup scenarios
5. **Child permissions in `childSettings`** apply automatically - don't create separate approval tables
6. **When unsure about a field**, check this guide before creating new fields

---

## Table Cleanup History

| Date | Table | Action | Reason |
|------|-------|--------|--------|
| Oct 2025 | `events` | Deleted | Replaced with `activities` |
| Oct 2025 | `users.firstName`, `users.lastName` | Removed | Source of truth is `accounts` table |

---

## Questions?
If you encounter ambiguous field usage or suspect a duplicate field exists, refer back to this guide before creating new fields.
