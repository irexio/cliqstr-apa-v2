import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create invite
export const createInvite = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const inviteId = await ctx.db.insert("invites", {
      token: args.token,
      joinCode: args.joinCode,
      code: args.code,
      inviteeEmail: args.inviteeEmail,
      targetEmailNormalized: args.targetEmailNormalized,
      targetUserId: args.targetUserId,
      targetState: args.targetState,
      inviterId: args.inviterId,
      cliqId: args.cliqId,
      status: args.status,
      used: args.used,
      acceptedAt: args.acceptedAt,
      completedAt: args.completedAt,
      createdAt: now,
      updatedAt: now,
      invitedUserId: args.invitedUserId,
      isApproved: args.isApproved,
      expiresAt: args.expiresAt,
      invitedRole: args.invitedRole,
      maxUses: args.maxUses,
      message: args.message,
      friendFirstName: args.friendFirstName,
      friendLastName: args.friendLastName,
      childBirthdate: args.childBirthdate,
      inviteNote: args.inviteNote,
      inviteType: args.inviteType,
      trustedAdultContact: args.trustedAdultContact,
      parentAccountExists: args.parentAccountExists,
    });

    return inviteId;
  },
});

// Get invite by code
export const getInviteByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invites")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
  },
});

// Update invite status
export const updateInviteStatus = mutation({
  args: {
    inviteId: v.id("invites"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("completed"), v.literal("canceled")),
    used: v.boolean(),
    invitedUserId: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.inviteId, {
      status: args.status,
      used: args.used,
      invitedUserId: args.invitedUserId,
      acceptedAt: args.acceptedAt,
      completedAt: args.completedAt,
      updatedAt: Date.now(),
    });
  },
});

// Create invite request for parent approval
export const createInviteRequest = mutation({
  args: {
    childId: v.id("users"),
    cliqId: v.id("cliqs"),
    inviteeEmail: v.string(),
    invitedRole: v.string(),
    message: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("denied")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const requestId = await ctx.db.insert("inviteRequests", {
      email: args.inviteeEmail,
      status: args.status,
      createdAt: now,
      cliqId: args.cliqId,
      invitedRole: args.invitedRole,
      inviteeEmail: args.inviteeEmail,
      inviterId: args.childId,
    });

    return requestId;
  },
});