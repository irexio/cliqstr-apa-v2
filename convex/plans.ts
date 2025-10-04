import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Plan Metadata Table
 * Tracks plan limits and current member counts for Family and Group plans
 */
export const createPlan = mutation({
  args: {
    planId: v.string(), // "individual", "premium", "family", "large-group", "invited"
    ownerId: v.id("users"), // User ID of the paying account holder
    maxMembers: v.number(), // Maximum members allowed (1 for individual/premium, 8 for family, 20 for large-group)
    billingCycle: v.optional(v.union(v.literal("monthly"), v.literal("annual"))),
    isGroupPlan: v.boolean(), // true for family/large-group, false for individual/premium
    stripeSubscriptionId: v.optional(v.string()), // Stripe subscription ID when integrated
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const planId = await ctx.db.insert("plans", {
      planId: args.planId,
      ownerId: args.ownerId,
      maxMembers: args.maxMembers,
      currentMembers: 1, // Owner counts as 1 member
      billingCycle: args.billingCycle || "monthly",
      isGroupPlan: args.isGroupPlan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[PLANS] Created plan ${args.planId} for owner ${args.ownerId} with max ${args.maxMembers} members`);
    
    return planId;
  },
});

export const getPlanByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    return plan;
  },
});

export const getPlanById = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    return plan;
  },
});

export const updatePlanMembers = mutation({
  args: {
    planId: v.id("plans"),
    currentMembers: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.planId, {
      currentMembers: args.currentMembers,
      updatedAt: Date.now(),
    });

    console.log(`[PLANS] Updated plan ${args.planId} to ${args.currentMembers} members`);
  },
});

export const upgradePlan = mutation({
  args: {
    planId: v.id("plans"),
    newMaxMembers: v.number(),
    newPlanId: v.optional(v.string()), // e.g., "family" -> "large-group"
  },
  handler: async (ctx, args) => {
    const updates: any = {
      maxMembers: args.newMaxMembers,
      updatedAt: Date.now(),
    };

    if (args.newPlanId) {
      updates.planId = args.newPlanId;
    }

    await ctx.db.patch(args.planId, updates);

    console.log(`[PLANS] Upgraded plan ${args.planId} to max ${args.newMaxMembers} members`);
  },
});

export const checkAvailableSlots = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (!plan) {
      return { available: false, reason: "No plan found" };
    }

    const available = plan.currentMembers < plan.maxMembers;
    const slotsRemaining = plan.maxMembers - plan.currentMembers;

    return {
      available,
      slotsRemaining,
      maxMembers: plan.maxMembers,
      currentMembers: plan.currentMembers,
      planId: plan.planId,
    };
  },
});

/**
 * Initialize default plans for testing
 * This creates the plan structure without Stripe integration
 */
export const initializeTestPlans = mutation({
  args: { ownerId: v.id("users") },
  handler: async (ctx, args) => {
    // Check if plan already exists
    const existingPlan = await ctx.db
      .query("plans")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .first();

    if (existingPlan) {
      console.log(`[PLANS] Plan already exists for owner ${args.ownerId}`);
      return existingPlan._id;
    }

    // Create "invited" plan for testing (free, no Stripe)
    const planId = await ctx.db.insert("plans", {
      planId: "invited",
      ownerId: args.ownerId,
      maxMembers: 1, // Individual plan for testing
      currentMembers: 1,
      billingCycle: "monthly",
      isGroupPlan: false,
      stripeSubscriptionId: undefined, // No Stripe for testing
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`[PLANS] Initialized test plan for owner ${args.ownerId}`);
    return planId;
  },
});
