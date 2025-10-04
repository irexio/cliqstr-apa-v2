import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Membership Record Table
 * Tracks individual members linked to plans
 */
export const createMembership = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const membershipId = await ctx.db.insert("planMemberships", {
      memberId: args.memberId,
      planId: args.planId,
      role: args.role,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[MEMBERSHIPS] Created membership for user ${args.memberId} in plan ${args.planId} with role ${args.role}`);
    
    return membershipId;
  },
});

export const getMembershipsByPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("planMemberships")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();

    return memberships;
  },
});

export const getMembershipsByMember = query({
  args: { memberId: v.id("users") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("planMemberships")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .collect();

    return memberships;
  },
});

export const updateMembershipStatus = mutation({
  args: {
    membershipId: v.id("planMemberships"),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("removed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.membershipId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    console.log(`[MEMBERSHIPS] Updated membership ${args.membershipId} to status ${args.status}`);
  },
});

export const removeMembership = mutation({
  args: { membershipId: v.id("planMemberships") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.membershipId, {
      status: "removed",
      updatedAt: Date.now(),
    });

    console.log(`[MEMBERSHIPS] Removed membership ${args.membershipId}`);
  },
});

/**
 * Get active member count for a plan
 * This is used to keep currentMembers in sync
 */
export const getActiveMemberCount = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("planMemberships")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return memberships.length;
  },
});

/**
 * Add member to plan and update member count
 * This is the main function to use when adding members
 */
export const addMemberToPlan = mutation({
  args: {
    memberId: v.id("users"),
    planId: v.id("plans"),
    role: v.union(
      v.literal("parent"),
      v.literal("child"),
      v.literal("member"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    // Check if membership already exists
    const existingMembership = await ctx.db
      .query("planMemberships")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .filter((q) => q.eq(q.field("planId"), args.planId))
      .first();

    if (existingMembership) {
      // Update existing membership
      await ctx.db.patch(existingMembership._id, {
        status: "active",
        role: args.role,
        updatedAt: Date.now(),
      });
      console.log(`[MEMBERSHIPS] Updated existing membership for user ${args.memberId}`);
    } else {
      // Create new membership
      await ctx.db.insert("planMemberships", {
        memberId: args.memberId,
        planId: args.planId,
        role: args.role,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(`[MEMBERSHIPS] Created new membership for user ${args.memberId}`);
    }

    // Update plan member count
    const activeCount = await ctx.db
      .query("planMemberships")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    await ctx.db.patch(args.planId, {
      currentMembers: activeCount.length,
      updatedAt: Date.now(),
    });

    console.log(`[MEMBERSHIPS] Updated plan ${args.planId} to ${activeCount.length} active members`);
  },
});

/**
 * Remove member from plan and update member count
 */
export const removeMemberFromPlan = mutation({
  args: {
    memberId: v.id("users"),
    planId: v.id("plans"),
  },
  handler: async (ctx, args) => {
    // Find and remove membership
    const membership = await ctx.db
      .query("planMemberships")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .filter((q) => q.eq(q.field("planId"), args.planId))
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        status: "removed",
        updatedAt: Date.now(),
      });
      console.log(`[MEMBERSHIPS] Removed membership for user ${args.memberId}`);
    }

    // Update plan member count
    const activeCount = await ctx.db
      .query("planMemberships")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    await ctx.db.patch(args.planId, {
      currentMembers: activeCount.length,
      updatedAt: Date.now(),
    });

    console.log(`[MEMBERSHIPS] Updated plan ${args.planId} to ${activeCount.length} active members`);
  },
});