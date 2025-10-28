import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    verificationExpires: v.optional(v.number()),
    verificationToken: v.optional(v.string()),
    resetToken: v.optional(v.string()),
    resetTokenExpires: v.optional(v.number()),
    isVerified: v.boolean(),
    isParent: v.boolean(),
  })
    .index("by_email", ["email"])
    .index("by_verification_token", ["verificationToken"])
    .index("by_reset_token", ["resetToken"]),

  myProfiles: defineTable({
    username: v.string(),
    displayName: v.optional(v.string()), // Nickname for social display
    createdAt: v.number(),
    userId: v.id("users"),
    ageGroup: v.optional(v.string()),
    about: v.optional(v.string()),
    bannerImage: v.optional(v.string()),
    image: v.optional(v.string()),
    updatedAt: v.number(),
    aiModerationLevel: v.union(v.literal("strict"), v.literal("moderate"), v.literal("relaxed")),
    showYear: v.boolean(),
    // Birthday visibility controls (computed from accounts.birthdate)
    showMonthDay: v.boolean(), // Show birthday month/day to cliq members
    birthdayMonthDay: v.optional(v.string()), // Cache: "MM-DD" for performance
  })
    .index("by_username", ["username"])
    .index("by_user_id", ["userId"]),

  childSettings: defineTable({
    profileId: v.id("myProfiles"),
    canCreatePublicCliqs: v.boolean(),
    canJoinPublicCliqs: v.boolean(),
    canCreateCliqs: v.boolean(),
    canSendInvites: v.boolean(),
    canInviteChildren: v.boolean(),
    canInviteAdults: v.boolean(),
    isSilentlyMonitored: v.boolean(),
    aiModerationLevel: v.optional(v.string()),
    canAccessGames: v.boolean(),
    canPostImages: v.boolean(),
    canShareYouTube: v.boolean(),
    visibilityLevel: v.optional(v.string()),
    inviteRequiresApproval: v.boolean(),
    receiveAiAlerts: v.boolean(), // New: Whether parents receive AI-triggered Red Alerts
    // NEW: Receiving invites permissions
    canReceiveInvites: v.boolean(), // Default: true
    receiveInvitesRequireApproval: v.boolean(), // If true, invites auto-accept; if false, parent must approve first
    // NEW: Sending invites permissions
    canSendInvitesToChildren: v.boolean(), // Default: true
    sendInvitesToChildrenRequireApproval: v.boolean(), // If true, invites auto-send; if false, parent must approve first
    canSendInvitesToAdults: v.boolean(), // Default: true
    sendInvitesToAdultsRequireApproval: v.boolean(), // If true, invites auto-send; if false, parent must approve first
    canSendInvitesToParents: v.boolean(), // Default: true
    sendInvitesToParentsRequireApproval: v.boolean(), // If true, invites auto-send; if false, parent must approve first
    // NEW: Calendar & Events permissions (PHQ controls)
    eventsRequireApproval: v.boolean(), // Default: true for children; events need parent approval
    eventLocationVisibilityForChildEvents: v.union(v.literal("parents"), v.literal("everyone")), // Default: 'parents'
    maskLocationUntilApproved: v.boolean(), // Default: true; hide location on pending events
  })
    .index("by_profile_id", ["profileId"]),

  accounts: defineTable({
    userId: v.id("users"),
    firstName: v.string(),
    lastName: v.string(),
    birthdate: v.number(),
    role: v.string(),
    isApproved: v.boolean(),
    stripeStatus: v.optional(v.string()),
    plan: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    setupStage: v.optional(v.string()), // 'started' | 'plan_selected' | 'child_pending' | 'completed'
    createdAt: v.number(),
    suspended: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  cliqs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    createdAt: v.number(),
    deleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    coverImage: v.optional(v.string()),
    privacy: v.union(v.literal("private"), v.literal("semi_private"), v.literal("public")),
    minAge: v.optional(v.number()),
    maxAge: v.optional(v.number()),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_privacy", ["privacy"])
    .index("by_created_at", ["createdAt"]),

  cliqNotices: defineTable({
    cliqId: v.id("cliqs"),
    type: v.string(),
    content: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_cliq_id", ["cliqId"])
    .index("by_expires_at", ["expiresAt"]),

  posts: defineTable({
    content: v.string(),
    image: v.optional(v.string()),
    createdAt: v.number(),
    deleted: v.boolean(),
    authorId: v.id("users"),
    cliqId: v.id("cliqs"),
    expiresAt: v.optional(v.number()),
    // Content moderation fields
    moderationStatus: v.optional(v.union(v.literal("approved"), v.literal("pending"), v.literal("flagged"), v.literal("suspended"))),
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
    suspensionReason: v.optional(v.string()),
    redAlertTriggered: v.optional(v.boolean()),
    redAlertId: v.optional(v.id("redAlerts")),
  })
    .index("by_author_id", ["authorId"])
    .index("by_cliq_id", ["cliqId"])
    .index("by_created_at", ["createdAt"])
    .index("by_moderation_status", ["moderationStatus"])
    .index("by_red_alert", ["redAlertTriggered"]),

  replies: defineTable({
    content: v.string(),
    createdAt: v.number(),
    postId: v.id("posts"),
    authorId: v.id("users"),
  })
    .index("by_post_id", ["postId"])
    .index("by_author_id", ["authorId"]),

  invites: defineTable({
    token: v.string(),
    joinCode: v.optional(v.string()),
    code: v.optional(v.string()),
    inviteeEmail: v.string(),
    targetEmailNormalized: v.string(),
    targetUserId: v.optional(v.id("users")),
    targetState: v.union(
      v.literal("new"),
      v.literal("existing_parent"),
      v.literal("existing_user_non_parent"),
      v.literal("invalid_child")
    ),
    inviterId: v.id("users"),
    cliqId: v.optional(v.id("cliqs")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("completed"), v.literal("canceled")),
    used: v.boolean(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    invitedUserId: v.optional(v.id("users")),
    isApproved: v.boolean(),
    expiresAt: v.optional(v.number()),
    invitedRole: v.optional(v.string()),
    maxUses: v.optional(v.number()),
    message: v.optional(v.string()),
    friendFirstName: v.optional(v.string()),
    friendLastName: v.optional(v.string()),
    childBirthdate: v.optional(v.string()),
    inviteNote: v.optional(v.string()),
    inviteType: v.optional(v.string()),
    trustedAdultContact: v.optional(v.string()),
    parentAccountExists: v.optional(v.boolean()),
  })
    .index("by_token", ["token"])
    .index("by_join_code", ["joinCode"])
    .index("by_code", ["code"])
    .index("by_target_email", ["targetEmailNormalized"])
    .index("by_status_used", ["status", "used"])
    .index("by_inviter_id", ["inviterId"])
    .index("by_cliq_id", ["cliqId"]),

  inviteRequests: defineTable({
    email: v.string(),
    status: v.string(),
    createdAt: v.number(),
    cliqId: v.id("cliqs"),
    invitedRole: v.string(),
    inviteeEmail: v.string(),
    inviterId: v.id("users"),
  })
    .index("by_cliq_id", ["cliqId"])
    .index("by_inviter_id", ["inviterId"])
    .index("by_status", ["status"]),

  parentLinks: defineTable({
    parentId: v.id("users"),
    email: v.string(),
    secondParentEmail: v.optional(v.string()), // Secondary parent/guardian email for Red Alerts
    childId: v.id("users"),
    type: v.string(),
    inviteContext: v.optional(v.string()),
    role: v.optional(v.union(v.literal("primary"), v.literal("secondary"), v.literal("guardian"))), // New: parent role
    permissions: v.optional(v.object({ // New: granular permissions
      canManageChild: v.boolean(),
      canChangeSettings: v.boolean(),
      canViewActivity: v.boolean(),
      receivesNotifications: v.boolean(),
    })),
    // Red Alert contact information
    mobileNumber: v.optional(v.string()), // Primary parent mobile for SMS alerts
    secondParentMobileNumber: v.optional(v.string()), // Secondary parent mobile for SMS alerts
    createdAt: v.number(),
  })
    .index("by_parent_id", ["parentId"])
    .index("by_child_id", ["childId"])
    .index("by_parent_child", ["parentId", "childId"])
    .index("by_email_child", ["email", "childId"]),

  parentAuditLogs: defineTable({
    parentId: v.id("users"),
    childId: v.id("users"),
    action: v.string(),
    oldValue: v.optional(v.string()),
    newValue: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_parent_id", ["parentId"])
    .index("by_child_id", ["childId"])
    .index("by_created_at", ["createdAt"]),

  parentConsents: defineTable({
    parentId: v.id("users"),
    childId: v.id("users"),
    redAlertAccepted: v.boolean(),
    silentMonitoringEnabled: v.boolean(),
    consentTimestamp: v.number(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_parent_id", ["parentId"])
    .index("by_child_id", ["childId"])
    .index("by_parent_child", ["parentId", "childId"])
    .index("by_consent_timestamp", ["consentTimestamp"]),

  redAlerts: defineTable({
    cliqId: v.id("cliqs"),
    triggeredById: v.id("users"),
    reason: v.optional(v.string()),
    triggeredAt: v.number(),
    triggerType: v.union(v.literal("child"), v.literal("adult"), v.literal("ai")),
    status: v.optional(v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed"))),
    moderatorNotes: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
  })
    .index("by_cliq_id", ["cliqId"])
    .index("by_triggered_by", ["triggeredById"])
    .index("by_triggered_at", ["triggeredAt"]),

  passwordResetAudits: defineTable({
    email: v.string(),
    ip: v.optional(v.string()),
    event: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"]),

  // Plan metadata table for tracking member limits
  plans: defineTable({
    planId: v.string(), // "individual", "premium", "family", "large-group", "invited"
    ownerId: v.id("users"), // User ID of the paying account holder
    maxMembers: v.number(), // Maximum members allowed
    currentMembers: v.number(), // Current active members
    billingCycle: v.union(v.literal("monthly"), v.literal("annual")),
    isGroupPlan: v.boolean(), // true for family/large-group, false for individual/premium
    stripeSubscriptionId: v.optional(v.string()), // Stripe subscription ID when integrated
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_plan_id", ["planId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),

  // Membership records linking users to plans
  planMemberships: defineTable({
    memberId: v.id("users"), // User ID of the member
    planId: v.id("plans"), // Plan they belong to
    role: v.union(
      v.literal("parent"),
      v.literal("child"), 
      v.literal("member"),
      v.literal("admin")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("removed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_plan", ["planId"])
    .index("by_member_plan", ["memberId", "planId"])
    .index("by_status", ["status"]),

  // Cliq memberships (existing table for cliq membership)
  memberships: defineTable({
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    role: v.string(),
    joinedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_cliq_id", ["cliqId"])
    .index("by_user_cliq", ["userId", "cliqId"]),

  scrapbookItems: defineTable({
    profileId: v.id("myProfiles"),
    imageUrl: v.string(),
    caption: v.string(),
    isPinned: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_profile_id", ["profileId"])
    .index("by_is_pinned", ["isPinned"])
    .index("by_created_at", ["createdAt"]),

  userActivityLogs: defineTable({
    userId: v.optional(v.id("users")),
    event: v.string(),
    detail: v.optional(v.string()),
    debugId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_event", ["event"])
    .index("by_created_at", ["createdAt"]),

  parentApprovals: defineTable({
    // Core child data
    childFirstName: v.string(),
    childLastName: v.string(),
    childBirthdate: v.string(),
    parentEmail: v.string(),
    
    // Parent contact information for Red Alert notifications
    parentMobileNumber: v.optional(v.string()), // Primary parent mobile for SMS alerts
    secondParentEmail: v.optional(v.string()), // Secondary parent/guardian email
    secondParentMobileNumber: v.optional(v.string()), // Secondary parent mobile for SMS alerts
    
    // Approval tracking
    approvalToken: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("declined"), v.literal("expired")),
    
    // Context (what triggered this approval)
    context: v.union(v.literal("direct_signup"), v.literal("child_invite")),
    inviteId: v.optional(v.id("invites")), // If from invite
    cliqId: v.optional(v.id("cliqs")), // If joining specific cliq
    inviterName: v.optional(v.string()), // Name of person who invited child
    cliqName: v.optional(v.string()), // Name of cliq child is being invited to
    
    // Parent state detection
    parentState: v.union(v.literal("new"), v.literal("existing_parent"), v.literal("existing_adult")),
    existingParentId: v.optional(v.id("users")),
    
    // Timestamps
    createdAt: v.number(),
    expiresAt: v.number(),
    approvedAt: v.optional(v.number()),
    declinedAt: v.optional(v.number()),
  })
    .index("by_approval_token", ["approvalToken"])
    .index("by_parent_email", ["parentEmail"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_context", ["context"])
    .index("by_invite_id", ["inviteId"]),

  // Magic Links for passwordless authentication
  magicLinks: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(), // Hashed token for security
    email: v.string(), // Email address for the magic link
    expiresAt: v.number(), // Expiration timestamp (15 minutes from creation)
    usedAt: v.optional(v.number()), // When the link was used (null if unused)
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_token_hash", ["tokenHash"])
    .index("by_email", ["email"])
    .index("by_expires_at", ["expiresAt"])
    .index("by_used_at", ["usedAt"]),

  // User feedback submissions
  feedback: defineTable({
    userId: v.id("users"),
    userEmail: v.string(), // User's email for context
    category: v.union(v.literal("Bug"), v.literal("Idea"), v.literal("General Comment")),
    message: v.string(),
    status: v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved")),
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.string()), // Admin who reviewed it
    adminNotes: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // Cliq Events - for Calendar tool (offline events, meetups, etc.)
  // NOTE: "events" is the single source of truth for all calendar items
  // Previously was named "activities" - now unified under "events" terminology
  events: defineTable({
    cliqId: v.id("cliqs"),
    title: v.string(),
    description: v.optional(v.string()),
    startAt: v.number(), // Unix timestamp (ms)
    endAt: v.number(), // Unix timestamp (ms)
    timezone: v.string(), // e.g., "America/New_York"
    location: v.optional(v.string()), // Plain text location
    locationVisibility: v.union(v.literal("everyone"), v.literal("parents"), v.literal("hidden")), // Who can see location
    createdByUserId: v.id("users"),
    visibilityLevel: v.string(), // Match existing scheme (e.g., "private", "semi_private", "public")
    requiresParentApproval: v.boolean(), // true if child created it and needs approval
    approvedByParentId: v.optional(v.id("users")), // Parent who approved (if any)
    approvedAt: v.optional(v.number()),
    // RSVPs stored as object: { userId: 'going'|'maybe'|'raincheck' }
    rsvps: v.any(), // Dynamic object allowing any userId keys with string values
    // Repeat series tracking
    seriesId: v.optional(v.string()), // UUID for recurring series; all instances share this
    recurrenceRule: v.optional(v.string()), // e.g., "FREQ=WEEKLY;COUNT=4" (stored for reference, not used for expansion)
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()), // Soft delete
  })
    .index("by_cliq_start", ["cliqId", "startAt"])
    .index("by_creator_start", ["createdByUserId", "startAt"])
    .index("by_cliq_id", ["cliqId"])
    .index("by_created_by", ["createdByUserId"])
    .index("by_series_id", ["seriesId"]),
});
