import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new Red Alert record
export const createRedAlert = mutation({
  args: {
    cliqId: v.id("cliqs"),
    triggeredById: v.id("users"),
    reason: v.optional(v.string()),
    triggerType: v.union(v.literal("child"), v.literal("adult"), v.literal("ai")),
  },
  handler: async (ctx, args) => {
    const redAlertId = await ctx.db.insert("redAlerts", {
      cliqId: args.cliqId,
      triggeredById: args.triggeredById,
      reason: args.reason || 'Safety concern reported',
      triggeredAt: Date.now(),
      triggerType: args.triggerType,
    });

    return redAlertId;
  },
});

// Get Red Alerts for a specific cliq
export const getRedAlertsByCliq = query({
  args: { cliqId: v.id("cliqs") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("redAlerts")
      .withIndex("by_cliq_id", (q) => q.eq("cliqId", args.cliqId))
      .order("desc")
      .collect();
  },
});

// Get Red Alerts triggered by a specific user
export const getRedAlertsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("redAlerts")
      .withIndex("by_triggered_by", (q) => q.eq("triggeredById", args.userId))
      .order("desc")
      .collect();
  },
});

// Get recent Red Alerts (for moderation dashboard)
export const getRecentRedAlerts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("redAlerts")
      .withIndex("by_triggered_at")
      .order("desc")
      .take(limit);
  },
});

// Update Red Alert status (for moderation)
export const updateRedAlertStatus = mutation({
  args: {
    redAlertId: v.id("redAlerts"),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"), v.literal("dismissed")),
    moderatorNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const redAlert = await ctx.db.get(args.redAlertId);
    if (!redAlert) {
      throw new Error("Red Alert not found");
    }

    await ctx.db.patch(args.redAlertId, {
      status: args.status,
      moderatorNotes: args.moderatorNotes,
      reviewedAt: Date.now(),
    });

    return args.redAlertId;
  },
});
