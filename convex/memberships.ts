import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Join a cliq
export const joinCliq = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this cliq");
    }

    const membershipId = await ctx.db.insert("memberships", {
      userId: args.userId,
      cliqId: args.cliqId,
      role: args.role ?? "Member",
      joinedAt: Date.now(),
    });

    return membershipId;
  },
});

// Leave a cliq
export const leaveCliq = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this cliq");
    }

    // Check if user is the owner
    const cliq = await ctx.db.get(args.cliqId);
    if (cliq?.ownerId === args.userId) {
      throw new Error("Owner cannot leave their own cliq");
    }

    await ctx.db.delete(membership._id);
  },
});

// Update member role
export const updateMemberRole = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    newRole: v.string(),
    updatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if updater is the cliq owner
    const cliq = await ctx.db.get(args.cliqId);
    if (cliq?.ownerId !== args.updatedBy) {
      throw new Error("Only cliq owner can update member roles");
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this cliq");
    }

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });
  },
});

// Remove member from cliq
export const removeMember = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    removedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if remover is the cliq owner
    const cliq = await ctx.db.get(args.cliqId);
    if (cliq?.ownerId !== args.removedBy) {
      throw new Error("Only cliq owner can remove members");
    }

    // Owner cannot remove themselves
    if (args.userId === args.removedBy) {
      throw new Error("Owner cannot remove themselves");
    }

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this cliq");
    }

    await ctx.db.delete(membership._id);
  },
});

// Get user's memberships
export const getUserMemberships = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const cliqs = await Promise.all(
      memberships.map(async (membership) => {
        const cliq = await ctx.db.get(membership.cliqId);
        return cliq ? { ...cliq, membership } : null;
      })
    );

    return cliqs.filter((cliq) => cliq && !cliq.deleted);
  },
});

// Check membership status
export const getMembershipStatus = query({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_user_cliq", (q) => 
        q.eq("userId", args.userId).eq("cliqId", args.cliqId)
      )
      .first();

    return membership ? {
      isMember: true,
      role: membership.role,
      joinedAt: membership.joinedAt,
    } : {
      isMember: false,
      role: null,
      joinedAt: null,
    };
  },
});

// Get all memberships (for validation)
export const getAllMemberships = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("memberships").collect();
  },
});

// Get all memberships for a specific cliq
export const getMembershipsByCliqId = query({
  args: { cliqId: v.id("cliqs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("memberships")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .collect();
  },
});

// Create membership
export const createMembership = mutation({
  args: {
    userId: v.id("users"),
    cliqId: v.id("cliqs"),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const membershipId = await ctx.db.insert("memberships", {
      userId: args.userId,
      cliqId: args.cliqId,
      role: args.role ?? "Member",
      joinedAt: Date.now(),
    });

    return membershipId;
  },
});
